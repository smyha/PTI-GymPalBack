import { z } from 'zod';

export const userSchemas = {
  updateProfile: z.object({
    full_name: z.string().min(1).max(100).optional(),
    bio: z.string().max(500).optional(),
    fitness_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    avatar_url: z.string().url().optional().nullable(),
    date_of_birth: z.string().optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    timezone: z.string().optional(),
    language: z.string().min(2).max(5).optional(),
    // Note: height and weight are managed via /api/v1/personal/info endpoint
  }),

  search: z.object({
    q: z.string().min(1),
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
  }),

  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
} as const;

