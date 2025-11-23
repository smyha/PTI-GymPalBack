/**
 * Social Service
 * Business logic layer for social features operations
 */

import { insertRow, updateRow } from '../../core/config/database-helpers.js';
import { supabase, supabaseAdmin } from '../../core/config/database.js';
import { AppError, ErrorCode } from '../../core/utils/error-types.js';
import { logger } from '../../core/config/logger.js';
import type * as Unified from '../../core/types/unified.types.js';
import type { Database } from '../../core/types/index.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreatePostData, UpdatePostData, PostFilters, CreateCommentData } from './types.js';

/**
 * Helper function to map post row to Unified.Post
 */
function mapPostRowToPost(row: any): Unified.Post {
  return {
    id: row.id,
    user_id: row.user_id,
    content: row.content,
    post_type: row.post_type || 'general',
    workout_id: row.workout_id,
    image_urls: row.image_urls || [],
    video_url: row.video_url,
    hashtags: row.hashtags || [],
    likes_count: row.likes_count || 0,
    comments_count: row.comments_count || 0,
    shares_count: row.shares_count || 0,
    reposts_count: row.reposts_count || 0,
    is_public: row.is_public ?? true,
    is_original: row.is_original ?? true,
    original_post_id: row.original_post_id,
    shared_from_user_id: row.shared_from_user_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const socialService = {
  /**
   * Creates a new post
   */
  async createPost(userId: string, data: CreatePostData, dbClient?: SupabaseClient<Database>): Promise<Unified.Post> {
    const postData: any = {
      user_id: userId,
      content: data.content,
      post_type: (data as any).post_type || 'general',
      image_urls: Array.isArray((data as any).images)
        ? ((data as any).images as Array<{ url: string }>).map((i) => i?.url).filter(Boolean)
        : [],
      workout_id: data.workout_id,
      hashtags: Array.isArray((data as any).tags) ? (data as any).tags : [],
      is_public: data.is_public ?? true,
    };

    // Use provided client (authenticated) or admin client as fallback
    // Using the authenticated client ensures RLS policies are respected and applied correctly
    const client = dbClient || supabaseAdmin;

    const { data: post, error } = await insertRow('posts', postData, client);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to create post: ${error.message}`);
    }

    if (!post) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create post');
    }

    // If post has a workout_id, mark the workout as shared
    if (data.workout_id) {
      try {
        const { error: workoutUpdateError } = await client
          .from('workouts')
          .update({ is_shared: true })
          .eq('id', data.workout_id);

        if (workoutUpdateError) {
          // Log error but don't fail the post creation
          logger.error({ error: workoutUpdateError.message, workoutId: data.workout_id }, 'Failed to mark workout as shared');
        }
      } catch (err: any) {
        // Log error but don't fail the post creation
        logger.error({ error: err.message, workoutId: data.workout_id }, 'Failed to mark workout as shared');
      }
    }

    return mapPostRowToPost(post);
  },

  /**
   * Finds multiple posts with filters
   * Returns posts with author information, likes count, and comments count
   */
  async findMany(userId: string, filters: PostFilters, dbClient?: SupabaseClient<Database>): Promise<{ posts: any[]; total: number }> {
    const { page = 1, limit = 20, sort = 'popular' } = filters as any;
    const user_id = (filters as any).user_id as string | undefined;
    const offset = (page - 1) * limit;
    const client = dbClient || supabase;

    // Build base query with author profile join and workout details
    let query = client
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey(id, username, full_name, avatar_url),
        workouts(id, name, description, difficulty, duration_minutes)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    // Get total count for pagination
    const { count } = await client
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true);

    const totalCount = count || 0;

    // Get paginated posts
    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get posts: ${error.message}`);
    }

    // Type assertion for the query result with join
    const postsData = (data || []) as any[];

    // Get list of users followed by current user (use authenticated client)
    const { data: following } = await client
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    const followingIds = new Set((following || []).map(f => f.following_id));

    // Enrich posts with author info, likes, comments, and reposts count
    const enrichedPosts = await Promise.all(postsData.map(async (post: any) => {
      // Get likes count (use authenticated client)
      const { count: likesCount } = await client
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      // Get comments count (use authenticated client)
      const { count: commentsCount } = await client
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      // Get reposts count (use authenticated client)
      const { count: repostsCount } = await client
        .from('post_reposts')
        .select('*', { count: 'exact', head: true })
        .eq('original_post_id', post.id);

      // Check if current user liked this post (use authenticated client)
      const { data: userLike } = await client
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', userId)
        .maybeSingle();

      return {
        id: post.id,
        content: post.content,
        image_urls: post.image_urls || [],
        hashtags: post.hashtags || [],
        workout_id: post.workout_id,
        workout: post.workouts, // Mapped from join
        is_public: post.is_public ?? true,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        userId: post.user_id,  // Include user_id directly
        author: post.profiles ? {
          id: post.profiles.id,
          username: post.profiles.username,
          fullName: post.profiles.full_name,
          avatar: post.profiles.avatar_url,
          isFollowing: followingIds.has(post.profiles.id),
        } : {
          // Fallback when profile is missing
          id: post.user_id,
          username: 'Usuario',
          fullName: 'Usuario',
          avatar: null,
          isFollowing: false,
        },
        likesCount: likesCount || 0,
        commentsCount: commentsCount || 0,
        reposts_count: repostsCount || 0,
        isLiked: !!userLike,
      };
    }));

    // Also fetch reposts from all users (not just current user)
    // Get all reposts (we'll combine with posts and paginate together)
    const { data: allReposts, error: repostsError } = await client
      .from('post_reposts')
      .select(`
        id,
        original_post_id,
        reposted_at,
        reposted_by_user_id
      `)
      .order('reposted_at', { ascending: false });

    // Process reposts if available (ignore errors, just log them)
    const processedReposts: any[] = [];
    if (!repostsError && allReposts && allReposts.length > 0) {
      // Get original posts for reposts
      const originalPostIds = [...new Set(allReposts.map((r: any) => r.original_post_id))];
      
      const { data: originalPostsData, error: postsError } = await client
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(id, username, full_name, avatar_url),
          workouts(id, name, description, difficulty, duration_minutes)
        `)
        .in('id', originalPostIds)
        .eq('is_public', true);

      if (!postsError && originalPostsData) {
        const postsById = new Map(originalPostsData.map((p: any) => [p.id, p]));
        
        // Get reposter profiles
        const reposterIds = [...new Set(allReposts.map((r: any) => r.reposted_by_user_id))];
        const { data: reposterProfiles } = await client
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', reposterIds);

        const profilesById = new Map((reposterProfiles || []).map((p: any) => [p.id, p]));

        for (const repost of allReposts) {
          const originalPost = postsById.get(repost.original_post_id);
          if (!originalPost) continue; // Skip if original post not found or not public

          // Get likes and comments count for original post
          const { count: likesCount } = await client
            .from('post_likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', originalPost.id);

          const { count: commentsCount } = await client
            .from('post_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', originalPost.id);

          const { data: userLike } = await client
            .from('post_likes')
            .select('id')
            .eq('post_id', originalPost.id)
            .eq('user_id', userId)
            .maybeSingle();

          const reposterProfile = profilesById.get(repost.reposted_by_user_id);

          // Get reposts count for original post
          const { count: originalRepostsCount } = await client
            .from('post_reposts')
            .select('*', { count: 'exact', head: true })
            .eq('original_post_id', originalPost.id);

          processedReposts.push({
            id: `repost-${repost.id}`,
            content: '',
            image_urls: [],
            hashtags: [],
            workout_id: originalPost.workout_id,
            workout: originalPost.workouts,
            is_public: true,
            createdAt: repost.reposted_at,
            updatedAt: repost.reposted_at,
            userId: originalPost.user_id,
            isRepost: true,
            repostedBy: reposterProfile ? {
              id: reposterProfile.id,
              username: reposterProfile.username,
              fullName: reposterProfile.full_name,
              avatar: reposterProfile.avatar_url,
            } : {
              id: repost.reposted_by_user_id,
              username: 'Usuario',
              fullName: 'Usuario',
              avatar: null,
            },
            repostedAt: repost.reposted_at,
            originalPost: {
              id: originalPost.id,
              content: originalPost.content,
              image_urls: originalPost.image_urls || [],
              hashtags: originalPost.hashtags || [],
              workout_id: originalPost.workout_id,
              workout: originalPost.workouts,
              is_public: originalPost.is_public ?? true,
              createdAt: originalPost.created_at,
              updatedAt: originalPost.updated_at,
              userId: originalPost.user_id,
              author: originalPost.profiles ? {
                id: originalPost.profiles.id,
                username: originalPost.profiles.username,
                fullName: originalPost.profiles.full_name,
                avatar: originalPost.profiles.avatar_url,
                isFollowing: followingIds.has(originalPost.profiles.id),
              } : {
                id: originalPost.user_id,
                username: 'Usuario',
                fullName: 'Usuario',
                avatar: null,
                isFollowing: false,
              },
              likesCount: likesCount || 0,
              commentsCount: commentsCount || 0,
              reposts_count: originalRepostsCount || 0,
              isLiked: !!userLike,
            },
            likesCount: likesCount || 0,
            commentsCount: commentsCount || 0,
            reposts_count: originalRepostsCount || 0,
            isLiked: !!userLike,
          });
        }
      }
    }

    // Combine posts and reposts, then sort according to filter
    const combined = [...enrichedPosts, ...processedReposts];
    const sorted = combined.sort((a, b) => {
      if (sort === 'popular') {
        // Sort by popularity: likes + comments + reposts (descending)
        const getRepostsCount = (post: any) => {
          if (post.isRepost && post.originalPost) {
            return post.originalPost.reposts_count || 0;
          }
          return post.reposts_count || 0;
        };

        const popularityA = (a.likesCount || 0) + (a.commentsCount || 0) + getRepostsCount(a);
        const popularityB = (b.likesCount || 0) + (b.commentsCount || 0) + getRepostsCount(b);

        if (popularityA !== popularityB) {
          return popularityB - popularityA; // Descending order
        }

        // If popularity is equal, sort by date (newest first)
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      } else {
        // Sort by recent: date (newest first)
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      }
    });

    // Return paginated combined results
    const paginatedResults = sorted.slice(offset, offset + limit);
    const totalCombined = combined.length;

    return {
      posts: paginatedResults,
      total: totalCombined,
    };
  },

  /**
   * Finds a post by ID with author information
   */
  async findById(id: string, userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey(id, username, full_name, avatar_url),
        workouts(id, name, description, difficulty, duration_minutes)
      `)
      .eq('id', id)
      .or(`user_id.eq.${userId},is_public.eq.true`)
      .maybeSingle();

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get post: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Type assertion for the query result with join
    const postData = data as any;

    // Get likes count
    const { count: likesCount } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id);

    // Get comments count
    const { count: commentsCount } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id);

    // Check if current user liked this post
    const { data: userLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    // Check if current user follows the author
    const { data: followStatus } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', userId)
      .eq('following_id', postData.user_id)
      .maybeSingle();

    return {
      id: postData.id,
      content: postData.content,
      image_urls: postData.image_urls || [],
      hashtags: postData.hashtags || [],
      workout_id: postData.workout_id,
      workout: postData.workouts, // Mapped from join
      is_public: postData.is_public ?? true,
      createdAt: postData.created_at,
      updatedAt: postData.updated_at,
      author: postData.profiles ? {
        id: postData.profiles.id,
        username: postData.profiles.username,
        fullName: postData.profiles.full_name,
        avatar: postData.profiles.avatar_url,
        isFollowing: !!followStatus,
      } : null,
      likesCount: likesCount || 0,
      commentsCount: commentsCount || 0,
      isLiked: !!userLike,
    };
  },

  /**
   * Updates a post
   */
  async updatePost(id: string, userId: string, data: UpdatePostData): Promise<Unified.Post> {
    const updateData: any = {};

    if (data.content !== undefined) updateData.content = data.content;
    if ((data as any).images !== undefined) {
      const imgs = (data as any).images as Array<{ url: string }>;
      updateData.image_urls = Array.isArray(imgs) ? imgs.map((i) => i?.url).filter(Boolean) : [];
    }
    if ((data as any).tags !== undefined) updateData.hashtags = (data as any).tags;
    if (data.is_public !== undefined) updateData.is_public = data.is_public;

    const { data: updated, error } = await updateRow('posts', updateData, (q) =>
      q.eq('id', id).eq('user_id', userId)
    );

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to update post: ${error.message}`);
    }

    if (!updated) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Post not found or access denied');
    }

    return mapPostRowToPost(updated);
  },

  /**
   * Deletes a post
   */
  async deletePost(id: string, userId: string, dbClient?: SupabaseClient<Database>): Promise<boolean> {
    const client = dbClient || supabase;
    const { error, count } = await client.from('posts').delete({ count: 'exact' }).eq('id', id).eq('user_id', userId);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to delete post: ${error.message}`);
    }

    return (count || 0) > 0;
  },

  /**
   * Likes a post (toggles like/unlike)
   */
  async likePost(postId: string, userId: string, dbClient?: SupabaseClient<Database>): Promise<void> {
    const client = dbClient || supabase;

    // First check if the like already exists
    const { data: existingLike, error: checkError } = await client
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to check like status: ${checkError.message}`);
    }

    // Get the post to check if it has a workout_id
    const { data: postData, error: postError } = await client
      .from('posts')
      .select('workout_id')
      .eq('id', postId)
      .maybeSingle();

    if (postError) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get post: ${postError.message}`);
    }

    if (existingLike) {
      // Unlike: delete the existing like
      const { error: deleteError } = await client
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (deleteError) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to unlike post: ${deleteError.message}`);
      }

      // If post has a workout_id, decrement like_count in workouts table
      if (postData?.workout_id) {
        try {
          const { data: workoutData, error: fetchError } = await client
            .from('workouts')
            .select('like_count')
            .eq('id', postData.workout_id)
            .single();

          if (!fetchError && workoutData) {
            const newCount = Math.max(0, ((workoutData as any).like_count || 0) - 1);
            const { error: updateError } = await client
              .from('workouts')
              .update({ like_count: newCount })
              .eq('id', postData.workout_id);

            if (updateError) {
              logger.error({ error: updateError.message, workoutId: postData.workout_id }, 'Failed to decrement workout like_count');
            }
          }
        } catch (err: any) {
          logger.error({ error: err.message, workoutId: postData.workout_id }, 'Failed to decrement workout like_count');
        }
      }
    } else {
      // Like: insert new like using authenticated client
      const likeData = {
        post_id: postId,
        user_id: userId,
      };

      const { error: insertError } = await client
        .from('post_likes')
        .insert(likeData as any);

      if (insertError) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to like post: ${insertError.message}`);
      }

      // If post has a workout_id, increment like_count in workouts table
      if (postData?.workout_id) {
        try {
          const { data: workoutData, error: fetchError } = await client
            .from('workouts')
            .select('like_count')
            .eq('id', postData.workout_id)
            .single();

          if (!fetchError && workoutData) {
            const newCount = ((workoutData as any).like_count || 0) + 1;
            const { error: updateError } = await client
              .from('workouts')
              .update({ like_count: newCount })
              .eq('id', postData.workout_id);

            if (updateError) {
              logger.error({ error: updateError.message, workoutId: postData.workout_id }, 'Failed to increment workout like_count');
            }
          }
        } catch (err: any) {
          logger.error({ error: err.message, workoutId: postData.workout_id }, 'Failed to increment workout like_count');
        }
      }
    }
  },

  /**
   * Creates a comment on a post (or replies to another comment)
   *
   * @param postId - ID of the post to comment on
   * @param userId - ID of the user creating the comment
   * @param data - Comment data (content, optional parent_comment_id for replies)
   * @param userSupabase - Authenticated Supabase client with proper RLS context
   *
   * Note: Must use authenticated Supabase client to bypass RLS policy violations
   */
  async createComment(
    postId: string,
    userId: string,
    data: CreateCommentData,
    userSupabase: SupabaseClient<Database>
  ): Promise<{
    id: string;
    post_id: string;
    user_id: string;
    parent_comment_id: string | null;
    content: string;
    createdAt: string;
    updatedAt: string;
    author: {
      id: string;
      username: string;
      fullName: string | null;
      avatar: string | null;
    } | null;
  }> {
    const commentData = {
      post_id: postId,
      user_id: userId,
      content: data.content,
      parent_comment_id: data.parent_comment_id || null,
    };

    // Use authenticated client to avoid RLS violations
    const { data: comment, error } = await userSupabase
      .from('post_comments')
      .insert(commentData as any)
      .select()
      .single();

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to create comment: ${error.message}`);
    }

    if (!comment) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create comment');
    }

    // Get author info for the comment
    type ProfileSelect = {
      id: string;
      username: string;
      full_name: string | null;
      avatar_url: string | null;
    };

    const { data: author, error: authorError } = await userSupabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', userId)
      .single() as { data: ProfileSelect | null; error: any };

    if (authorError) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get author info: ${authorError.message}`);
    }

    if (!author) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Author not found');
    }

    const commentRow = comment as Database['public']['Tables']['post_comments']['Row'];

    return {
      id: commentRow.id,
      post_id: commentRow.post_id,
      user_id: commentRow.user_id,
      parent_comment_id: commentRow.parent_comment_id || null,
      content: commentRow.content,
      createdAt: commentRow.created_at || '',
      updatedAt: commentRow.updated_at || '',
      author: {
        id: author.id,
        username: author.username,
        fullName: author.full_name,
        avatar: author.avatar_url,
      },
    };
  },

  /**
   * Gets comments for a post (including replies)
   */
  async getComments(postId: string, page: number = 1, limit: number = 20): Promise<{
    comments: Array<{
      id: string;
      post_id: string;
      user_id: string;
      parent_comment_id: string | null;
      content: string;
      createdAt: string;
      updatedAt: string;
      author: {
        id: string;
        username: string;
        fullName: string | null;
        avatar: string | null;
      } | null;
      replies: Array<{
        id: string;
        post_id: string;
        user_id: string;
        parent_comment_id: string | null;
        content: string;
        createdAt: string;
        updatedAt: string;
        author: {
          id: string;
          username: string;
          fullName: string | null;
          avatar: string | null;
        } | null;
      }>;
    }>;
    total: number;
  }> {
    const offset = (page - 1) * limit;

    type CommentWithProfile = Database['public']['Tables']['post_comments']['Row'] & {
      profiles: Database['public']['Tables']['profiles']['Row'] | null;
    };

    const { data: comments, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles!post_comments_user_id_fkey(id, username, full_name, avatar_url)
      `)
      .eq('post_id', postId)
      .is('parent_comment_id', null) // Only top-level comments for pagination
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get comments: ${error.message}`);
    }

    // Get replies for each comment
    const commentsWithReplies = await Promise.all((comments || []).map(async (comment) => {
      // Explicitly cast comment to match expected structure with profile
      const commentWithProfile = comment as CommentWithProfile;

      const { data: replies } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles!post_comments_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq('parent_comment_id', comment.id)
        .order('created_at', { ascending: true });

      return {
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        parent_comment_id: comment.parent_comment_id || null,
        content: comment.content,
        createdAt: comment.created_at || '',
        updatedAt: comment.updated_at || '',
        author: commentWithProfile.profiles ? {
          id: commentWithProfile.profiles.id,
          username: commentWithProfile.profiles.username || '',
          fullName: commentWithProfile.profiles.full_name,
          avatar: commentWithProfile.profiles.avatar_url,
        } : null,
        replies: (replies || []).map((reply) => {
          const replyWithProfile = reply as CommentWithProfile;
          return {
            id: reply.id,
            post_id: reply.post_id,
            user_id: reply.user_id,
            parent_comment_id: reply.parent_comment_id || null,
            content: reply.content,
            createdAt: reply.created_at || '',
            updatedAt: reply.updated_at || '',
            author: replyWithProfile.profiles ? {
              id: replyWithProfile.profiles.id,
              username: replyWithProfile.profiles.username || '',
              fullName: replyWithProfile.profiles.full_name,
              avatar: replyWithProfile.profiles.avatar_url,
            } : null,
          };
        }),
      };
    }));

    // Get total count
    const { count } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .is('parent_comment_id', null);

    return {
      comments: commentsWithReplies,
      total: count || 0,
    };
  },

  /**
   * Deletes a comment (only by owner)
   */
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to delete comment: ${error.message}`);
    }

    return true;
  },

  /**
   * Follows a user
   */
  async followUser(followerId: string, followingId: string, dbClient?: SupabaseClient<Database>): Promise<void> {
    const client = dbClient || supabase;

    // Prevent self-follow
    if (followerId === followingId) {
      throw new AppError(ErrorCode.INVALID_INPUT, 'Cannot follow yourself');
    }

    // Check if user exists
    const { data: user } = await client
      .from('profiles')
      .select('id')
      .eq('id', followingId)
      .single();

    if (!user) {
      throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
    }

    // Check if already following
    const { data: existingFollow } = await client
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (existingFollow) {
      // Already following, return success
      return;
    }

    // Create follow relationship using type-safe helper
    const followData: Database['public']['Tables']['follows']['Insert'] = {
      follower_id: followerId,
      following_id: followingId,
    };

    const { error } = await insertRow('follows', followData, client);
    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to follow user: ${error.message}`);
    }
  },

  /**
   * Unfollows a user
   */
  async unfollowUser(followerId: string, followingId: string, dbClient?: SupabaseClient<Database>): Promise<void> {
    const client = dbClient || supabase;
    const { error } = await client
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to unfollow user: ${error.message}`);
    }
  },

  /**
   * Repost a post (toggle repost/unrepost)
   */
  async repostPost(postId: string, userId: string, dbClient?: SupabaseClient<Database>): Promise<{ reposted: boolean }> {
    const client = dbClient || supabase;

    // First check if the repost already exists
    const { data: existingRepost, error: checkError } = await client
      .from('post_reposts')
      .select('id')
      .eq('original_post_id', postId)
      .eq('reposted_by_user_id', userId)
      .maybeSingle();

    if (checkError) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to check repost status: ${checkError.message}`);
    }

    if (existingRepost) {
      // Remove the repost
      const { error: deleteError } = await client
        .from('post_reposts')
        .delete()
        .eq('original_post_id', postId)
        .eq('reposted_by_user_id', userId);

      if (deleteError) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to remove repost: ${deleteError.message}`);
      }

      // Decrement reposts_count
      try {
        // Get current count and workout_id
        const { data: postData, error: fetchError } = await client
          .from('posts')
          .select('reposts_count, workout_id')
          .eq('id', postId)
          .single() as any;

        if (fetchError || !postData) {
          throw new Error(`Failed to fetch post: ${fetchError?.message || 'unknown'}`);
        }

        // Calculate and update new count
        const newCount = Math.max(0, ((postData as any).reposts_count as number || 0) - 1);
        const updateResult = await (client as any)
          .from('posts')
          .update({ reposts_count: newCount } as any)
          .eq('id', postId as any);

        const updateError = (updateResult as any)?.error;
        if (updateError) {
          throw new Error(`Failed to update reposts_count: ${updateError.message}`);
        }

        // If post has a workout_id, decrement share_count in workouts table
        if (postData.workout_id) {
          try {
            const { data: workoutData, error: workoutFetchError } = await client
              .from('workouts')
              .select('share_count')
              .eq('id', postData.workout_id)
              .single();

            if (!workoutFetchError && workoutData) {
              const newShareCount = Math.max(0, ((workoutData as any).share_count || 0) - 1);
              const { error: workoutUpdateError } = await client
                .from('workouts')
                .update({ share_count: newShareCount })
                .eq('id', postData.workout_id);

              if (workoutUpdateError) {
                logger.error({ error: workoutUpdateError.message, workoutId: postData.workout_id }, 'Failed to decrement workout share_count');
              }
            }
          } catch (err: any) {
            logger.error({ error: err.message, workoutId: postData.workout_id }, 'Failed to decrement workout share_count');
          }
        }
      } catch (error: any) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to decrement reposts: ${error.message}`);
      }

      return { reposted: false };
    } else {
      // Add the repost
      const { error: insertError } = await client
        .from('post_reposts')
        .insert([{
          original_post_id: postId,
          reposted_by_user_id: userId,
        }] as any);

      if (insertError) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to create repost: ${insertError.message}`);
      }

      // Increment reposts_count
      try {
        // Get current count and workout_id
        const { data: postData, error: fetchError } = await client
          .from('posts')
          .select('reposts_count, workout_id')
          .eq('id', postId)
          .single() as any;

        if (fetchError || !postData) {
          throw new Error(`Failed to fetch post: ${fetchError?.message || 'unknown'}`);
        }

        // Calculate and update new count
        const newCount = ((postData as any).reposts_count as number || 0) + 1;
        const updateResult = await (client as any)
          .from('posts')
          .update({ reposts_count: newCount } as any)
          .eq('id', postId as any);

        const updateError = (updateResult as any)?.error;
        if (updateError) {
          throw new Error(`Failed to update reposts_count: ${updateError.message}`);
        }

        // If post has a workout_id, increment share_count in workouts table
        if (postData.workout_id) {
          try {
            const { data: workoutData, error: workoutFetchError } = await client
              .from('workouts')
              .select('share_count')
              .eq('id', postData.workout_id)
              .single();

            if (!workoutFetchError && workoutData) {
              const newShareCount = ((workoutData as any).share_count || 0) + 1;
              const { error: workoutUpdateError } = await client
                .from('workouts')
                .update({ share_count: newShareCount })
                .eq('id', postData.workout_id);

              if (workoutUpdateError) {
                logger.error({ error: workoutUpdateError.message, workoutId: postData.workout_id }, 'Failed to increment workout share_count');
              }
            }
          } catch (err: any) {
            logger.error({ error: err.message, workoutId: postData.workout_id }, 'Failed to increment workout share_count');
          }
        }
      } catch (error: any) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to increment reposts: ${error.message}`);
      }

      return { reposted: true };
    }
  },

  /**
   * Get user's reposts
   */
  async getUserReposts(userId: string, page: number = 1, limit: number = 20): Promise<{ reposts: any[]; total: number }> {
    const offset = (page - 1) * limit;

    // Get the count
    const { count } = await supabase
      .from('post_reposts')
      .select('*', { count: 'exact', head: true })
      .eq('reposted_by_user_id', userId);

    const total = count || 0;

    // Get the reposts with joined post data
    const { data: reposts, error } = await supabase
      .from('post_reposts')
      .select(`
        id,
        original_post_id,
        reposted_at,
        posts:original_post_id(
          *,
          profiles!posts_user_id_fkey(id, username, full_name, avatar_url)
        )
      `)
      .eq('reposted_by_user_id', userId)
      .order('reposted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get reposts: ${error.message}`);
    }

    return { reposts: reposts || [], total };
  },

  /**
   * Check if user has reposted a post
   */
  async hasUserReposted(postId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('post_reposts')
      .select('id')
      .eq('original_post_id', postId)
      .eq('reposted_by_user_id', userId)
      .maybeSingle();

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to check repost status: ${error.message}`);
    }

    return !!data;
  },

  /**
   * Get follow statistics for a user
   */
  async getFollowStats(targetUserId: string, currentUserId?: string): Promise<{ followersCount: number; followingCount: number; isFollowing: boolean }> {
    // Get followers count
    const { count: followersCount, error: followersError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', targetUserId);

    if (followersError) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get followers count: ${followersError.message}`);
    }

    // Get following count
    const { count: followingCount, error: followingError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', targetUserId);

    if (followingError) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get following count: ${followingError.message}`);
    }

    let isFollowing = false;
    if (currentUserId) {
      const { data: followData, error: followError } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (followError) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to check follow status: ${followError.message}`);
      }
      isFollowing = !!followData;
    }

    return {
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
      isFollowing
    };
  },

  /**
   * Get post count for a user
   */
  async getUserPostCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_public', true);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get post count: ${error.message}`);
    }

    return count || 0;
  },
};
