import { z } from 'zod';

export const socialSchemas = {
  createPost: z.object({
    content: z.string().min(1).max(2000),
    images: z.array(z.object({
      url: z.string().url(),
      alt: z.string().optional(),
    })).optional(),
    workout_id: z.string().uuid().optional(),
    tags: z.array(z.string()).optional(),
    is_public: z.boolean().default(true),
  }),

  updatePost: z.object({
    content: z.string().min(1).max(2000).optional(),
    images: z.array(z.object({
      url: z.string().url(),
      alt: z.string().optional(),
    })).optional(),
    tags: z.array(z.string()).optional(),
    is_public: z.boolean().optional(),
  }),

  createComment: z.object({
    content: z.string().min(1).max(500),
    id: z.string().uuid('Invalid post ID format').optional(), // From URL params /:id (mapped by middleware)
    post_id: z.string().uuid('Invalid post ID format').optional(), // Will be set by middleware
    parent_comment_id: z.string().uuid('Invalid parent comment ID format').optional(),
  }).transform(data => {
    // Map 'id' param to 'post_id' if post_id not already set
    if (!data.post_id && data.id) {
      data.post_id = data.id;
    }
    // Remove id field from final data
    const { id, ...rest } = data;
    return rest;
  }),

  listPosts: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    sort: z.enum(['popular', 'recent']).optional().default('popular'),
  }),

  params: z.object({
    id: z.string().uuid('Invalid ID format'),
    commentId: z.string().uuid('Invalid comment ID format').optional(),
    userId: z.string().uuid('Invalid user ID format').optional(),
  }),
} as const;

