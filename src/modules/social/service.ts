/**
 * Social Service
 * Business logic layer for social features operations
 */

import { insertRow, selectRow, selectRows, updateRow, upsertRow } from '../../core/config/database-helpers.js';
import { supabase } from '../../core/config/database.js';
import type { CreatePostData, UpdatePostData, PostFilters, Post } from './types.js';

/**
 * Helper function to map post row to Post
 */
function mapPostRowToPost(row: any): Post {
  return {
    id: row.id,
    user_id: row.user_id,
    content: row.content,
    image_urls: row.image_urls || [],
    workout_id: row.workout_id,
    hashtags: row.hashtags || [],
    is_public: row.is_public ?? true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const socialService = {
  /**
   * Creates a new post
   */
  async createPost(userId: string, data: CreatePostData): Promise<Post> {
    const postData: any = {
      user_id: userId,
      content: data.content,
      image_urls: Array.isArray((data as any).images)
        ? ((data as any).images as Array<{ url: string }>).map((i) => i?.url).filter(Boolean)
        : [],
      workout_id: data.workout_id,
      hashtags: Array.isArray((data as any).tags) ? (data as any).tags : [],
      is_public: data.is_public ?? true,
    };

    const { data: post, error } = await insertRow('posts', postData);

    if (error) {
      throw new Error(`Failed to create post: ${error.message}`);
    }

    if (!post) {
      throw new Error('Failed to create post');
    }

    return mapPostRowToPost(post);
  },

  /**
   * Finds multiple posts with filters
   */
  async findMany(userId: string, filters: PostFilters): Promise<Post[]> {
    const { page = 1, limit = 20 } = filters as any;
    const user_id = (filters as any).user_id as string | undefined;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('posts')
      .select('*')
      .eq('is_public', true)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get posts: ${error.message}`);
    }

    return (data || []).map(mapPostRowToPost);
  },

  /**
   * Finds a post by ID
   */
  async findById(id: string, userId: string): Promise<Post | null> {
    const { data, error } = await selectRow('posts', (q) =>
      q.eq('id', id).or(`user_id.eq.${userId},is_public.eq.true`)
    );

    if (error) {
      throw new Error(`Failed to get post: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return mapPostRowToPost(data);
  },

  /**
   * Updates a post
   */
  async updatePost(id: string, userId: string, data: UpdatePostData): Promise<Post> {
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
      throw new Error(`Failed to update post: ${error.message}`);
    }

    if (!updated) {
      throw new Error('Post not found or access denied');
    }

    return mapPostRowToPost(updated);
  },

  /**
   * Deletes a post
   */
  async deletePost(id: string, userId: string): Promise<boolean> {
    const { error } = await supabase.from('posts').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }

    return true;
  },

  /**
   * Likes a post
   */
  async likePost(postId: string, userId: string): Promise<void> {
    const likeData = {
      post_id: postId,
      user_id: userId,
    };

    const { error } = await upsertRow('post_likes', likeData, {
      onConflict: 'post_id,user_id',
    });

    if (error) {
      throw new Error(`Failed to like post: ${error.message}`);
    }
  },

  /**
   * Unlikes a post
   */
  async unlikePost(postId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to unlike post: ${error.message}`);
    }
  },
};

