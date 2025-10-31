/**
 * Social Service
 * Business logic layer for social features operations
 */

import { insertRow, selectRow, selectRows, updateRow, upsertRow } from '../../core/config/database-helpers.js';
import { supabase } from '../../core/config/database.js';
import type { Database } from '../../core/types/index.js';
import type { 
  CreatePostData, UpdatePostData, PostFilters, Post, 
  CreateCommentData } from './types.js';

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
   * Returns posts with author information, likes count, and comments count
   */
  async findMany(userId: string, filters: PostFilters): Promise<{ posts: any[]; total: number }> {
    const { page = 1, limit = 20 } = filters as any;
    const user_id = (filters as any).user_id as string | undefined;
    const offset = (page - 1) * limit;

    // Build base query with author profile join
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey(id, username, full_name, avatar_url)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true);
    
    const totalCount = count || 0;

    // Get paginated posts
    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get posts: ${error.message}`);
    }

    // Type assertion for the query result with join
    const postsData = (data || []) as any[];

    // Enrich posts with author info, likes, and comments count
    const enrichedPosts = await Promise.all(postsData.map(async (post: any) => {
      // Get likes count
      const { count: likesCount } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      // Get comments count
      const { count: commentsCount } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      // Check if current user liked this post
      const { data: userLike } = await supabase
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
        is_public: post.is_public ?? true,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        author: post.profiles ? {
          id: post.profiles.id,
          username: post.profiles.username,
          fullName: post.profiles.full_name,
          avatar: post.profiles.avatar_url,
        } : null,
        likesCount: likesCount || 0,
        commentsCount: commentsCount || 0,
        isLiked: !!userLike,
      };
    }));

    return {
      posts: enrichedPosts,
      total: totalCount,
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
        profiles!posts_user_id_fkey(id, username, full_name, avatar_url)
      `)
      .eq('id', id)
      .or(`user_id.eq.${userId},is_public.eq.true`)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get post: ${error.message}`);
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

    return {
      id: postData.id,
      content: postData.content,
      image_urls: postData.image_urls || [],
      hashtags: postData.hashtags || [],
      workout_id: postData.workout_id,
      is_public: postData.is_public ?? true,
      createdAt: postData.created_at,
      updatedAt: postData.updated_at,
      author: postData.profiles ? {
        id: postData.profiles.id,
        username: postData.profiles.username,
        fullName: postData.profiles.full_name,
        avatar: postData.profiles.avatar_url,
      } : null,
      likesCount: likesCount || 0,
      commentsCount: commentsCount || 0,
      isLiked: !!userLike,
    };
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
   * Likes a post (toggles like/unlike)
   */
  async likePost(postId: string, userId: string): Promise<void> {
    // First check if the like already exists
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Failed to check like status: ${checkError.message}`);
    }

    if (existingLike) {
      // Unlike: delete the existing like
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (deleteError) {
        throw new Error(`Failed to unlike post: ${deleteError.message}`);
      }
    } else {
      // Like: insert new like using type-safe helper
      const likeData: Database['public']['Tables']['post_likes']['Insert'] = {
        post_id: postId,
        user_id: userId,
      };

      const { error: insertError } = await insertRow('post_likes', likeData);
      // insertRow returns { data, error }, we just need error
      if (insertError) {
        throw new Error(`Failed to like post: ${insertError.message}`);
      }
    }
  },



  /**
   * Creates a comment on a post (or replies to another comment)
   */
  async createComment(postId: string, userId: string, data: CreateCommentData): Promise<{
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
    const commentData: Database['public']['Tables']['post_comments']['Insert'] = {
      post_id: postId,
      user_id: userId,
      content: data.content,
      parent_comment_id: data.parent_comment_id || null,
    };

    const { data: comment, error } = await insertRow('post_comments', commentData);

    if (error) {
      throw new Error(`Failed to create comment: ${error.message}`);
    }

    if (!comment) {
      throw new Error('Failed to create comment');
    }

    // Get author info for the comment
    type ProfileSelect = {
      id: string;
      username: string;
      full_name: string | null;
      avatar_url: string | null;
    };

    const { data: author, error: authorError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', userId)
      .single() as { data: ProfileSelect | null; error: any };

    if (authorError) {
      throw new Error(`Failed to get author info: ${authorError.message}`);
    }

    if (!author) {
      throw new Error('Author not found');
    }

    const commentRow = comment as Database['public']['Tables']['post_comments']['Row'];

    return {
      id: commentRow.id,
      post_id: commentRow.post_id,
      user_id: commentRow.user_id,
      parent_comment_id: commentRow.parent_comment_id || null,
      content: commentRow.content,
      createdAt: commentRow.created_at,
      updatedAt: commentRow.updated_at,
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
      throw new Error(`Failed to get comments: ${error.message}`);
    }

    // Get replies for each comment
    const commentsWithReplies = await Promise.all((comments || []).map(async (comment: CommentWithProfile) => {
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
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        author: comment.profiles ? {
          id: comment.profiles.id,
          username: comment.profiles.username,
          fullName: comment.profiles.full_name,
          avatar: comment.profiles.avatar_url,
        } : null,
        replies: (replies || []).map((reply: CommentWithProfile) => ({
          id: reply.id,
          post_id: reply.post_id,
          user_id: reply.user_id,
          parent_comment_id: reply.parent_comment_id || null,
          content: reply.content,
          createdAt: reply.created_at,
          updatedAt: reply.updated_at,
          author: reply.profiles ? {
            id: reply.profiles.id,
            username: reply.profiles.username,
            fullName: reply.profiles.full_name,
            avatar: reply.profiles.avatar_url,
          } : null,
        })),
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
      throw new Error(`Failed to delete comment: ${error.message}`);
    }

    return true;
  },

  /**
   * Follows a user
   */
  async followUser(followerId: string, followingId: string): Promise<void> {
    // Prevent self-follow
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    // Check if user exists
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', followingId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Check if already following
    const { data: existingFollow } = await supabase
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

    const { error } = await insertRow('follows', followData);
    if (error) {
      throw new Error(`Failed to follow user: ${error.message}`);
    }
  },

  /**
   * Unfollows a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      throw new Error(`Failed to unfollow user: ${error.message}`);
    }
  },
};

