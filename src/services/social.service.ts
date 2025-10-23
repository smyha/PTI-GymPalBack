import { Context } from 'hono';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { sendSuccess, sendError, sendNotFound, sendValidationError, sendConflict } from '../shared/utils/response.js';
import { API_MESSAGES, ERROR_CODES } from '../shared/constants/index.js';

// Create a new post
export async function createPost(c: Context, body: any) {
  try {
    const userId = c.get('userId');
    const { content, images, workout_id, routine_id, tags, is_public } = body;

    // Validate content length
    if (!content || content.trim().length === 0) {
      return sendValidationError(c, ['Content is required']);
    }

    if (content.length > 2000) {
      return sendValidationError(c, ['Content must be less than 2000 characters']);
    }

    // Validate images
    if (images && Array.isArray(images)) {
      if (images.length > 10) {
        return sendValidationError(c, ['Maximum 10 images allowed']);
      }
      for (const image of images) {
        if (!image.url || !image.alt) {
          return sendValidationError(c, ['Each image must have url and alt text']);
        }
      }
    }

    // Create post
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content,
        images,
        workout_id,
        routine_id,
        tags,
        is_public: is_public || false,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        profiles!posts_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to create post', 500, error.message);
    }

    return sendSuccess(c, post, API_MESSAGES.CREATED);

  } catch (error: any) {
    console.error('Create post error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get post by ID
export async function getPost(c: Context, postId: string) {
  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !post) {
      return sendNotFound(c, API_MESSAGES.POST_NOT_FOUND);
    }

    return sendSuccess(c, post, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get post error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Update post
export async function updatePost(c: Context, postId: string, body: any) {
  try {
    const userId = c.get('userId');
    const { content, images, tags, is_public } = body;

    // Check if post exists and belongs to user
    const { data: existingPost, error: checkError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (checkError || !existingPost) {
      return sendNotFound(c, API_MESSAGES.POST_NOT_FOUND);
    }

    if (existingPost.user_id !== userId) {
      return sendError(c, ERROR_CODES.FORBIDDEN, 'Not authorized to update this post', 403);
    }

    // Validate content length
    if (content && content.length > 2000) {
      return sendValidationError(c, ['Content must be less than 2000 characters']);
    }

    // Update post
    const { data: post, error } = await supabase
      .from('posts')
      .update({
        content,
        images,
        tags,
        is_public,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select(`
        *,
        profiles!posts_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to update post', 500, error.message);
    }

    return sendSuccess(c, post, API_MESSAGES.UPDATED);

  } catch (error: any) {
    console.error('Update post error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Delete post
export async function deletePost(c: Context, postId: string) {
  try {
    const userId = c.get('userId');

    // Check if post exists and belongs to user
    const { data: existingPost, error: checkError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (checkError || !existingPost) {
      return sendNotFound(c, API_MESSAGES.POST_NOT_FOUND);
    }

    if (existingPost.user_id !== userId) {
      return sendError(c, ERROR_CODES.FORBIDDEN, 'Not authorized to delete this post', 403);
    }

    // Delete post
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to delete post', 500, error.message);
    }

    return sendSuccess(c, null, API_MESSAGES.DELETED);

  } catch (error: any) {
    console.error('Delete post error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get feed posts
export async function getFeedPosts(c: Context, limit: number = 20, offset: number = 0) {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('is_public', true)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to get feed posts', 500, error.message);
    }

    return sendSuccess(c, posts || [], API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get feed posts error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get user posts
export async function getUserPosts(c: Context, userId: string, limit: number = 20, offset: number = 0) {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to get user posts', 500, error.message);
    }

    return sendSuccess(c, posts || [], API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get user posts error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Search posts
export async function searchPosts(c: Context, query: string, limit: number = 20, offset: number = 0) {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .or(`content.ilike.%${query}%,tags.cs.{${query}}`)
      .eq('is_public', true)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to search posts', 500, error.message);
    }

    return sendSuccess(c, posts, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Search posts error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Like post
export async function likePost(c: Context, postId: string) {
  try {
    const userId = c.get('userId');

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return sendNotFound(c, API_MESSAGES.POST_NOT_FOUND);
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single();

    if (existingLike) {
      return sendConflict(c, 'Post already liked');
    }

    // Create like
    const { data: like, error } = await supabase
      .from('post_likes')
      .insert({
        user_id: userId,
        post_id: postId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to like post', 500, error.message);
    }

    return sendSuccess(c, like, 'Post liked successfully');

  } catch (error: any) {
    console.error('Like post error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Unlike post
export async function unlikePost(c: Context, postId: string) {
  try {
    const userId = c.get('userId');

    // Remove like
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to unlike post', 500, error.message);
    }

    return sendSuccess(c, null, 'Post unliked successfully');

  } catch (error: any) {
    console.error('Unlike post error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get post likes
export async function getPostLikes(c: Context, postId: string, limit: number = 20, offset: number = 0) {
  try {
    const { data: likes, error } = await supabase
      .from('post_likes')
      .select(`
        *,
        profiles!post_likes_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .eq('post_id', postId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to get post likes', 500, error.message);
    }

    return sendSuccess(c, likes, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get post likes error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Create comment
export async function createComment(c: Context, postId: string, body: any) {
  try {
    const userId = c.get('userId');
    const { content, parent_id } = body;

    // Validate content
    if (!content || content.trim().length === 0) {
      return sendValidationError(c, ['Content is required']);
    }

    if (content.length > 500) {
      return sendValidationError(c, ['Content must be less than 500 characters']);
    }

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return sendNotFound(c, API_MESSAGES.POST_NOT_FOUND);
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from('post_comments')
      .insert({
        user_id: userId,
        post_id: postId,
        content,
        parent_id,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        profiles!post_comments_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to create comment', 500, error.message);
    }

    return sendSuccess(c, comment, API_MESSAGES.CREATED);

  } catch (error: any) {
    console.error('Create comment error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get post comments
export async function getPostComments(c: Context, postId: string, limit: number = 20, offset: number = 0) {
  try {
    const { data: comments, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles!post_comments_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .eq('post_id', postId)
      .is('parent_id', null)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to get comments', 500, error.message);
    }

    return sendSuccess(c, comments, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get post comments error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Delete comment
export async function deleteComment(c: Context, commentId: string) {
  try {
    const userId = c.get('userId');

    // Check if comment exists and belongs to user
    const { data: existingComment, error: checkError } = await supabase
      .from('post_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (checkError || !existingComment) {
      return sendNotFound(c, 'Comment not found');
    }

    if (existingComment.user_id !== userId) {
      return sendError(c, ERROR_CODES.FORBIDDEN, 'Not authorized to delete this comment', 403);
    }

    // Delete comment
    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to delete comment', 500, error.message);
    }

    return sendSuccess(c, null, API_MESSAGES.DELETED);

  } catch (error: any) {
    console.error('Delete comment error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get post statistics
export async function getPostStats(c: Context, postId: string) {
  try {
    // Get post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, content, user_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return sendNotFound(c, API_MESSAGES.POST_NOT_FOUND);
    }

    // Get like count
    const { count: likeCount } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    // Get comment count
    const { count: commentCount } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    const stats = {
      likes: likeCount || 0,
      comments: commentCount || 0
    };

    return sendSuccess(c, stats, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get post stats error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// List posts
export async function listPosts(c: Context, query: any = {}) {
  try {
    const { page = 1, limit = 20 } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data: posts, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to list posts', 500, error.message);
    }

    return sendSuccess(c, posts, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('List posts error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get trending posts
export async function getTrendingPosts(c: Context, query: any = {}) {
  try {
    const { page = 1, limit = 20 } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data: posts, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('is_public', true)
      .order('likes_count', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to get trending posts', 500, error.message);
    }

    return sendSuccess(c, posts, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get trending posts error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Add comment (alias for createComment)
export async function addComment(c: Context, postId: string, body: any) {
  return createComment(c, postId, body);
}

// Share post
export async function sharePost(c: Context, postId: string, body: any) {
  try {
    const userId = c.get('userId');

    const { data: share, error } = await supabase
      .from('post_shares')
      .insert({
        user_id: userId,
        post_id: postId,
        shared_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to share post', 500, error.message);
    }

    return sendSuccess(c, share, API_MESSAGES.SUCCESS, 201);

  } catch (error: any) {
    console.error('Share post error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Repost
export async function repost(c: Context, postId: string, body: any) {
  try {
    const userId = c.get('userId');

    const { data: repost, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        original_post_id: postId,
        content: body.content || '',
        is_repost: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to repost', 500, error.message);
    }

    return sendSuccess(c, repost, API_MESSAGES.POST_CREATED, 201);

  } catch (error: any) {
    console.error('Repost error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// ============================================================================
// FOLLOW/UNFOLLOW FUNCTIONS
// ============================================================================

// Follow user
export async function followUser(c: Context, targetUserId: string) {
  try {
    const userId = c.get('userId');

    if (userId === targetUserId) {
      return sendValidationError(c, ['Cannot follow yourself']);
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', userId)
      .eq('following_id', targetUserId)
      .single();

    if (existingFollow) {
      return sendConflict(c, 'Already following this user');
    }

    // Create follow relationship
    const { data: follow, error } = await supabase
      .from('follows')
      .insert({
        follower_id: userId,
        following_id: targetUserId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to follow user', 500, error.message);
    }

    return sendSuccess(c, follow, 'User followed successfully');

  } catch (error: any) {
    console.error('Follow user error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Unfollow user
export async function unfollowUser(c: Context, targetUserId: string) {
  try {
    const userId = c.get('userId');

    // Remove follow relationship
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', targetUserId);

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to unfollow user', 500, error.message);
    }

    return sendSuccess(c, null, 'User unfollowed successfully');

  } catch (error: any) {
    console.error('Unfollow user error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get user followers
export async function getUserFollowers(c: Context, userId: string, query: any = {}) {
  try {
    const { page = 1, limit = 20 } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data: followers, error } = await supabase
      .from('follows')
      .select(`
        follower_id,
        profiles!follows_follower_id_fkey (
          id, username, full_name, avatar_url, bio, fitness_level
        )
      `)
      .eq('following_id', userId)
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to get followers', 500, error.message);
    }

    return sendSuccess(c, followers, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get user followers error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get user following
export async function getUserFollowing(c: Context, userId: string, query: any = {}) {
  try {
    const { page = 1, limit = 20 } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data: following, error } = await supabase
      .from('follows')
      .select(`
        following_id,
        profiles!follows_following_id_fkey (
          id, username, full_name, avatar_url, bio, fitness_level
        )
      `)
      .eq('follower_id', userId)
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to get following', 500, error.message);
    }

    return sendSuccess(c, following, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get user following error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get user feed
export async function getUserFeed(c: Context, query: any = {}) {
  try {
    const userId = c.get('userId');
    const { page = 1, limit = 20 } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data: feed, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .or(`user_id.eq.${userId},user_id.in.(select following_id from follows where follower_id = ${userId})`)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to get user feed', 500, error.message);
    }

    return sendSuccess(c, feed, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get user feed error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}