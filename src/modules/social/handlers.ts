/**
 * @fileoverview Handlers for the social module
 * 
 * This file contains all HTTP request handlers related to social features.
 * Handlers allow creating, reading, updating, and deleting posts, as well as
 * managing likes and other social interactions.
 * 
 * @module modules/social/handlers
 */

import { Context } from 'hono';
import { socialService } from './service.js';
import { logger } from '../../core/config/logger.js';
import {
  sendSuccess,
  sendCreated,
  sendUpdated,
  sendDeleted,
  sendNotFound,
} from '../../core/utils/response.js';
import type { CreatePostData, UpdatePostData, PostFilters, CreateCommentData } from './types.js';
import { getUserFromCtx } from '../../core/utils/context.js';

/**
 * Object containing all handlers for the social module.
 * Each handler manages social interactions and post operations.
 */
export const socialHandlers = {
  /**
   * Creates a new social media post
   *
   * Allows the user to create a post to share with the community.
   * Posts can include text, images, workout summaries, achievements, etc.
   * Posts are associated with the authenticated user.
   *
   * Supports both:
   * - JSON format with image URLs
   * - Multipart form data with file uploads
   *
   * @param {Context} c - Context with authenticated user and validated data
   * @returns {Promise<Response>} JSON response with created post (status 201)
   *
   * @example
   * // Request: POST /api/v1/social/posts
   * // Body: { content: "Just completed an amazing workout!", workout_id: "123" }
   * // Response: { success: true, data: { id, content, ... } }
   */
  async createPost(c: Context) {
    // Extract authenticated user
    const user = getUserFromCtx(c);
    let postData: CreatePostData;

    try {
      // Check if this is a multipart form data request
      const contentType = c.req.header('content-type') || '';

      if (contentType.includes('multipart/form-data')) {
        // Handle file uploads
        const formData = await c.req.formData();
        const content = formData.get('content') as string;
        const workout_id = formData.get('workout_id') as string | undefined;
        const is_public = (formData.get('is_public') as string) === 'true' || formData.get('is_public') === 'true';
        const imageFiles = formData.getAll('images') as File[];

        // Convert files to base64 data URLs for storage
        const images: Array<{ url: string; alt?: string }> = [];
        for (const file of imageFiles) {
          if (file && file.size > 0) {
            const buffer = await file.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const dataUrl = `data:${file.type};base64,${base64}`;
            images.push({
              url: dataUrl,
              alt: file.name,
            });
          }
        }

        postData = {
          content,
          images: images.length > 0 ? images : undefined,
          workout_id: workout_id || undefined,
          is_public,
        };
      } else {
        // Handle JSON format with URLs
        postData = c.get('validated') as CreatePostData;
      }

      if (!postData.content || !postData.content.trim()) {
        throw new Error('Content is required');
      }

      // Create post in service
      const post = await socialService.createPost(user.id, postData);

      // Log post creation for analytics
      logger.info({ userId: user.id, postId: post.id, imageCount: (postData.images || []).length }, 'Post created');

      // Return created post
      return sendCreated(c, post);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id }, 'Failed to create post');
      throw error;
    }
  },

  /**
   * Lists posts with optional filters
   * 
   * Retrieves a list of posts from the social feed. Supports filters
   * such as user ID (to see specific user's posts), date range, post type,
   * etc. May include pagination for better performance.
   * 
   * @param {Context} c - Context with authenticated user and validated filters
   * @returns {Promise<Response>} JSON response with list of posts
   * 
   * @example
   * // Request: GET /api/v1/social/posts?user_id=123&limit=20
   * // Response: { success: true, data: [{ id, content, likes, ... }, ...] }
   */
  async listPosts(c: Context) {
    // Get authenticated user and validated filters
    const user = getUserFromCtx(c);
    const filters = c.get('validated') as PostFilters;
    const { page = 1, limit = 20 } = filters as any;

    try {
      // Find posts matching the filters with author info and pagination
      const result = await socialService.findMany(user.id, filters);

      // Format response with pagination
      return c.json({
        success: true,
        data: result.posts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / Number(limit)),
          hasNext: Number(page) < Math.ceil(result.total / Number(limit)),
          hasPrev: Number(page) > 1,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      }, 200);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id }, 'Failed to get posts');
      throw error;
    }
  },

  /**
   * Gets a specific post by its ID
   * 
   * Retrieves complete details of a post, including author information,
   * likes count, comments, media, etc. Only visible posts according to
   * privacy settings are accessible.
   * 
   * @param {Context} c - Context with authenticated user and validated ID
   * @returns {Promise<Response>} JSON response with post or 404 error
   * 
   * @example
   * // Request: GET /api/v1/social/posts/:id
   * // Response: { success: true, data: { id, content, author, likes, ... } }
   */
  async getPost(c: Context) {
    // Extract authenticated user and post ID
    const user = getUserFromCtx(c);
    const { id } = c.get('validated') as { id: string };

    try {
      // Find post by ID
      const post = await socialService.findById(id, user.id);

      // If post doesn't exist, return 404 error
      if (!post) {
        return sendNotFound(c, 'Post');
      }

      // Return found post
      return sendSuccess(c, post);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id, postId: id }, 'Failed to get post');
      throw error;
    }
  },

  /**
   * Updates an existing post
   * 
   * Allows modifying post content. Only the post author can update
   * their own posts. Useful for editing typos, updating content, etc.
   * 
   * @param {Context} c - Context with authenticated user, ID and validated data
   * @returns {Promise<Response>} JSON response with updated post
   * 
   * @example
   * // Request: PUT /api/v1/social/posts/:id
   * // Body: { content: "Updated post content" }
   * // Response: { success: true, data: { ...updatedPost } }
   */
  async updatePost(c: Context) {
    // Extract authenticated user, post ID and update data
    const user = getUserFromCtx(c);
    const { id } = c.get('validated') as { id: string };
    const data = c.get('validated') as UpdatePostData;

    try {
      // Update post, verifying ownership
      const post = await socialService.updatePost(id, user.id, data);

      // If post doesn't exist, return 404 error
      if (!post) {
        return sendNotFound(c, 'Post');
      }

      // Log update
      logger.info({ userId: user.id, postId: id }, 'Post updated');

      // Return updated post
      return sendUpdated(c, post);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id, postId: id }, 'Failed to update post');
      throw error;
    }
  },

  /**
   * Deletes a post
   * 
   * Permanently removes a post from the social feed. Only the post author
   * can delete their own posts. This action cannot be undone.
   * 
   * @param {Context} c - Context with authenticated user and validated ID
   * @returns {Promise<Response>} Success response confirming deletion
   * 
   * @example
   * // Request: DELETE /api/v1/social/posts/:id
   * // Response: { success: true, message: "Post deleted successfully" }
   */
  async deletePost(c: Context) {
    // Extract authenticated user and post ID
    const user = getUserFromCtx(c);
    const { id } = c.get('validated') as { id: string };

    try {
      // Delete post, verifying ownership
      const deleted = await socialService.deletePost(id, user.id);

      // If post doesn't exist, return 404 error
      if (!deleted) {
        return sendNotFound(c, 'Post');
      }

      // Log deletion
      logger.info({ userId: user.id, postId: id }, 'Post deleted');

      // Return deletion confirmation
      return sendDeleted(c);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id, postId: id }, 'Failed to delete post');
      throw error;
    }
  },

  /**
   * Likes a post
   * 
   * Adds a like from the authenticated user to the specified post.
   * If the post is already liked, this may toggle the like or be idempotent,
   * depending on the service implementation.
   * 
   * @param {Context} c - Context with authenticated user and validated ID
   * @returns {Promise<Response>} JSON response confirming the like action
   * 
   * @example
   * // Request: POST /api/v1/social/posts/:id/like
   * // Response: { success: true, data: { liked: true } }
   */
  async likePost(c: Context) {
    // Extract authenticated user and post ID
    const user = getUserFromCtx(c);
    const { id } = c.get('validated') as { id: string };

    try {
      // Like the post
      await socialService.likePost(id, user.id);

      // Return success confirmation
      return sendSuccess(c, { liked: true });
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id, postId: id }, 'Failed to like post');
      throw error;
    }
  },


  /**
   * Creates a comment on a post (or replies to another comment)
   *
   * Uses authenticated Supabase client to properly handle RLS policies
   * Post ID is passed via URL params and merged into validated data by validateCombined middleware
   */
  async createComment(c: Context) {
    const user = getUserFromCtx(c);
    const userSupabase = c.get('supabase');
    const validated = c.get('validated') as any;

    // Post ID comes from URL params (mapped to post_id by schema transform)
    const postId = validated?.post_id;
    const content = validated?.content;
    const parent_comment_id = validated?.parent_comment_id;

    if (!postId) {
      logger.error({ userId: user.id, validated }, 'Post ID missing from request');
      throw new Error('Post ID is required');
    }

    if (!content) {
      logger.error({ userId: user.id, postId }, 'Comment content missing from request');
      throw new Error('Comment content is required');
    }

    const data: CreateCommentData = {
      content,
      parent_comment_id,
    };

    try {
      const comment = await socialService.createComment(postId, user.id, data, userSupabase);
      logger.info({ userId: user.id, postId, commentId: comment.id }, 'Comment created');
      return sendCreated(c, comment);
    } catch (error: any) {
      logger.error({ error, userId: user.id, postId }, 'Failed to create comment');
      throw error;
    }
  },

  /**
   * Lists comments for a post
   */
  async listComments(c: Context) {
    const user = getUserFromCtx(c);
    // Extract post ID directly from URL params
    const postId = c.req.param('id');
    const { page = 1, limit = 20 } = (c.req.query() as any);

    try {
      const result = await socialService.getComments(postId, Number(page), Number(limit));
      return c.json({
        success: true,
        data: result.comments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / Number(limit)),
          hasNext: Number(page) < Math.ceil(result.total / Number(limit)),
          hasPrev: Number(page) > 1,
        },
      }, 200);
    } catch (error: any) {
      logger.error({ error, userId: user.id, postId }, 'Failed to get comments');
      throw error;
    }
  },

  /**
   * Deletes a comment
   */
  async deleteComment(c: Context) {
    const user = getUserFromCtx(c);
    const { id, commentId } = c.get('validated') as { id: string; commentId: string };

    try {
      const deleted = await socialService.deleteComment(commentId, user.id);
      if (!deleted) {
        return sendNotFound(c, 'Comment');
      }
      logger.info({ userId: user.id, commentId }, 'Comment deleted');
      return sendDeleted(c);
    } catch (error: any) {
      logger.error({ error, userId: user.id, commentId }, 'Failed to delete comment');
      throw error;
    }
  },

  /**
   * Follows a user
   */
  async followUser(c: Context) {
    const user = getUserFromCtx(c);
    const userId = c.req.param('userId');

    if (!userId) {
      return sendNotFound(c, 'User ID');
    }

    try {
      await socialService.followUser(user.id, userId);
      logger.info({ followerId: user.id, followingId: userId }, 'User followed');
      return sendSuccess(c, { followed: true });
    } catch (error: any) {
      if (error.message === 'Cannot follow yourself') {
        return c.json({
          success: false,
          error: { code: 'CANNOT_FOLLOW_SELF', message: 'Cannot follow yourself' }
        }, 400);
      }
      if (error.message === 'User not found') {
        return sendNotFound(c, 'User');
      }
      logger.error({ error, followerId: user.id, followingId: userId }, 'Failed to follow user');
      throw error;
    }
  },

  /**
   * Unfollows a user
   */
  async unfollowUser(c: Context) {
    const user = getUserFromCtx(c);
    const userId = c.req.param('userId');

    if (!userId) {
      return sendNotFound(c, 'User ID');
    }

    try {
      await socialService.unfollowUser(user.id, userId);
      logger.info({ followerId: user.id, followingId: userId }, 'User unfollowed');
      return sendSuccess(c, { followed: false });
    } catch (error: any) {
      logger.error({ error, followerId: user.id, followingId: userId }, 'Failed to unfollow user');
      throw error;
    }
  },

  /**
   * Reposts a post (toggle repost/unrepost)
   */
  async repostPost(c: Context) {
    const user = getUserFromCtx(c);
    const { id } = c.get('validated') as { id: string };

    try {
      const result = await socialService.repostPost(id, user.id);
      logger.info({ userId: user.id, postId: id, reposted: result.reposted }, 'Post reposted');
      return sendSuccess(c, result);
    } catch (error: any) {
      logger.error({ error, userId: user.id, postId: id }, 'Failed to repost post');
      throw error;
    }
  },

  /**
   * Gets user's reposts
   */
  async getUserReposts(c: Context) {
    const user = getUserFromCtx(c);
    const userId = c.req.param('userId') || user.id;
    const { page = 1, limit = 20 } = c.req.query() as any;

    try {
      const result = await socialService.getUserReposts(userId, Number(page), Number(limit));
      logger.info({ userId: user.id, targetUserId: userId }, 'Get user reposts success');
      return c.json({
        success: true,
        data: result.reposts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / Number(limit)),
          hasNext: Number(page) < Math.ceil(result.total / Number(limit)),
          hasPrev: Number(page) > 1,
        },
      }, 200);
    } catch (error: any) {
      logger.error({ error, userId: user.id }, 'Failed to get user reposts');
      throw error;
    }
  },

  /**
   * Get follow stats for a user
   */
  async getFollowStats(c: Context) {
    const user = getUserFromCtx(c);
    const userId = c.req.param('userId');

    if (!userId) {
      return sendNotFound(c, 'User ID');
    }

    try {
      const stats = await socialService.getFollowStats(userId, user.id);
      return sendSuccess(c, stats);
    } catch (error: any) {
      logger.error({ error, userId: user.id, targetUserId: userId }, 'Failed to get follow stats');
      throw error;
    }
  },

  /**
   * Get post count for a user
   */
  async getPostCount(c: Context) {
    const user = getUserFromCtx(c);
    const userId = c.req.param('userId');

    if (!userId) {
      return sendNotFound(c, 'User ID');
    }

    try {
      const count = await socialService.getUserPostCount(userId);
      return sendSuccess(c, { count });
    } catch (error: any) {
      logger.error({ error, userId: user.id, targetUserId: userId }, 'Failed to get post count');
      throw error;
    }
  },
};

