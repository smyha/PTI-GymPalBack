import { z } from 'zod';

// ============================================================================
// SOCIAL POST VALIDATION SCHEMAS
// ============================================================================

export const CreatePostSchema = z.object({
  content: z.string()
    .min(1, 'Post content is required')
    .max(2000, 'Post content too long'),
  post_type: z.enum(['achievement', 'routine', 'tip', 'progress', 'motivation', 'question', 'general'])
    .default('general'),
  workout_id: z.string().min(1, 'Workout ID is required').optional(),
  image_urls: z.array(z.string().url('Invalid image URL'))
    .max(10, 'Too many images')
    .default([]),
  video_url: z.string()
    .url('Invalid video URL')
    .optional(),
  hashtags: z.array(z.string())
    .max(20, 'Too many hashtags')
    .default([]),
  is_public: z.boolean().default(true)
});

export const UpdatePostSchema = CreatePostSchema.partial();

export const GetPostsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  post_type: z.enum(['achievement', 'routine', 'tip', 'progress', 'motivation', 'question', 'general']).optional(),
  hashtags: z.array(z.string()).max(10).optional(),
  user_id: z.string().min(1).optional(),
  is_public: z.boolean().optional(),
  sort_by: z.enum(['created_at', 'likes_count', 'comments_count', 'shares_count']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// ============================================================================
// POST LIKES VALIDATION SCHEMAS
// ============================================================================

export const LikePostSchema = z.object({
  post_id: z.string().min(1, 'Post ID is required')
});

export const UnlikePostSchema = LikePostSchema;

// ============================================================================
// POST COMMENTS VALIDATION SCHEMAS
// ============================================================================

export const CreateCommentSchema = z.object({
  post_id: z.string().min(1, 'Post ID is required'),
  content: z.string()
    .min(1, 'Comment content is required')
    .max(500, 'Comment content too long'),
  parent_comment_id: z.string().min(1).optional()
});

export const UpdateCommentSchema = z.object({
  content: z.string()
    .min(1, 'Comment content is required')
    .max(500, 'Comment content too long')
});

export const GetCommentsSchema = z.object({
  post_id: z.string().min(1, 'Post ID is required'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z.enum(['created_at', 'likes_count']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
});

// ============================================================================
// POST SHARES VALIDATION SCHEMAS
// ============================================================================

export const SharePostSchema = z.object({
  post_id: z.string().min(1, 'Post ID is required'),
  share_type: z.enum(['share', 'repost', 'forward']).default('share'),
  shared_with_user_id: z.string().min(1).optional()
});

export const RepostSchema = z.object({
  original_post_id: z.string().min(1, 'Original post ID is required'),
  content: z.string()
    .max(2000, 'Repost content too long')
    .optional()
});

// ============================================================================
// FOLLOWS VALIDATION SCHEMAS
// ============================================================================

export const FollowUserSchema = z.object({
  following_id: z.string().min(1, 'User ID is required')
});

export const UnfollowUserSchema = FollowUserSchema;

export const GetFollowersSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z.enum(['created_at', 'username']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export const GetFollowingSchema = GetFollowersSchema;

// ============================================================================
// USER PROFILE VALIDATION SCHEMAS
// ============================================================================

export const GetUserProfileSchema = z.object({
  user_id: z.string().min(1, 'User ID is required')
});

export const SearchUsersSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z.enum(['username', 'created_at']).default('username'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
});

// ============================================================================
// NOTIFICATIONS VALIDATION SCHEMAS
// ============================================================================

export const GetNotificationsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  type: z.enum(['workout', 'social', 'achievement', 'system', 'reminder']).optional(),
  is_read: z.boolean().optional(),
  sort_by: z.enum(['created_at', 'priority']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export const MarkNotificationReadSchema = z.object({
  notification_id: z.string().min(1, 'Notification ID is required')
});

export const MarkAllNotificationsReadSchema = z.object({
  // No parameters needed
});

// ============================================================================
// HELPER FUNCTIONS FOR VALIDATION
// ============================================================================

export const validatePostContent = (content: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!content || content.trim().length === 0) {
    errors.push('Post content is required');
  } else if (content.length > 2000) {
    errors.push('Post content too long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCommentContent = (content: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!content || content.trim().length === 0) {
    errors.push('Comment content is required');
  } else if (content.length > 500) {
    errors.push('Comment content too long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateHashtags = (hashtags: string[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (hashtags.length > 20) {
    errors.push('Too many hashtags');
  }
  
  for (const hashtag of hashtags) {
    if (!hashtag.startsWith('#')) {
      errors.push('Hashtags must start with #');
    } else if (hashtag.length < 2) {
      errors.push('Hashtags must be at least 2 characters');
    } else if (hashtag.length > 50) {
      errors.push('Hashtags too long');
    } else if (!/^#[a-zA-Z0-9_]+$/.test(hashtag)) {
      errors.push('Hashtags can only contain letters, numbers, and underscores');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateImageUrls = (urls: string[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (urls.length > 10) {
    errors.push('Too many images');
  }
  
  for (const url of urls) {
    try {
      new URL(url);
    } catch {
      errors.push('Invalid image URL format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateVideoUrl = (url: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  try {
    new URL(url);
  } catch {
    errors.push('Invalid video URL format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============================================================================
// CUSTOM VALIDATION MESSAGES
// ============================================================================

export const SOCIAL_VALIDATION_MESSAGES = {
  CONTENT_REQUIRED: 'Post content is required',
  CONTENT_TOO_LONG: 'Post content too long',
  COMMENT_CONTENT_REQUIRED: 'Comment content is required',
  COMMENT_CONTENT_TOO_LONG: 'Comment content too long',
  INVALID_POST_TYPE: 'Invalid post type',
  POST_ID_REQUIRED: 'Post ID is required',
  USER_ID_REQUIRED: 'User ID is required',
  TOO_MANY_IMAGES: 'Too many images',
  INVALID_IMAGE_URL: 'Invalid image URL',
  INVALID_VIDEO_URL: 'Invalid video URL',
  TOO_MANY_HASHTAGS: 'Too many hashtags',
  INVALID_HASHTAG_FORMAT: 'Hashtags must start with # and contain only letters, numbers, and underscores',
  HASHTAG_TOO_SHORT: 'Hashtags must be at least 2 characters',
  HASHTAG_TOO_LONG: 'Hashtags too long',
  INVALID_SHARE_TYPE: 'Invalid share type',
  ORIGINAL_POST_ID_REQUIRED: 'Original post ID is required',
  FOLLOWING_ID_REQUIRED: 'User ID is required',
  SEARCH_QUERY_REQUIRED: 'Search query is required',
  SEARCH_QUERY_TOO_LONG: 'Search query too long',
  NOTIFICATION_ID_REQUIRED: 'Notification ID is required',
  INVALID_NOTIFICATION_TYPE: 'Invalid notification type',
  INVALID_SORT_BY: 'Invalid sort field',
  INVALID_SORT_ORDER: 'Invalid sort order'
} as const;
