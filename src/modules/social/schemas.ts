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
  }),

  listPosts: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
  }),

  params: z.object({
    id: z.string().uuid('Invalid ID format'),
    commentId: z.string().uuid('Invalid comment ID format').optional(),
  }),
} as const;

