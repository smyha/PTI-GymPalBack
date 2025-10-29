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
import type { CreatePostData, UpdatePostData, PostFilters } from './types.js';

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
   * @param {Context} c - Context with authenticated user and validated data
   * @returns {Promise<Response>} JSON response with created post (status 201)
   * 
   * @example
   * // Request: POST /api/v1/social/posts
   * // Body: { content: "Just completed an amazing workout!", workout_id: "123" }
   * // Response: { success: true, data: { id, content, ... } }
   */
  async createPost(c: Context) {
    // Extract authenticated user and validated post data
    const user = c.get('user');
    const data = c.get('validated') as CreatePostData;

    try {
      // Create post in service
      const post = await socialService.createPost(user.id, data);
      
      // Log post creation for analytics
      logger.info({ userId: user.id, postId: post.id }, 'Post created');
      
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
    const user = c.get('user');
    const filters = c.get('validated') as PostFilters;

    try {
      // Find posts matching the filters
      const posts = await socialService.findMany(user.id, filters);
      
      // Return list of posts
      return sendSuccess(c, posts);
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
    const user = c.get('user');
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
    const user = c.get('user');
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
    const user = c.get('user');
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
    const user = c.get('user');
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
   * Unlikes a post
   * 
   * Removes a like from the authenticated user to the specified post.
   * Only works if the user has previously liked the post.
   * 
   * @param {Context} c - Context with authenticated user and validated ID
   * @returns {Promise<Response>} JSON response confirming the unlike action
   * 
   * @example
   * // Request: DELETE /api/v1/social/posts/:id/like
   * // Response: { success: true, data: { liked: false } }
   */
  async unlikePost(c: Context) {
    // Extract authenticated user and post ID
    const user = c.get('user');
    const { id } = c.get('validated') as { id: string };

    try {
      // Unlike the post
      await socialService.unlikePost(id, user.id);
      
      // Return success confirmation
      return sendSuccess(c, { liked: false });
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id, postId: id }, 'Failed to unlike post');
      throw error;
    }
  },
};

