import { z } from 'zod';

export const exerciseSchemas = {
  create: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    muscle_group: z.string().optional(),
    equipment: z.array(z.string()).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    tags: z.array(z.string()).optional(),
    is_public: z.boolean().default(false),
  }),

  list: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    search: z.string().optional(),
    muscle_group: z.string().optional(),
    equipment: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    tags: z.string().optional(),
    is_public: z.string().transform(Boolean).optional(),
  }),

  update: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    muscle_group: z.string().optional(),
    equipment: z.array(z.string()).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    tags: z.array(z.string()).optional(),
    is_public: z.boolean().optional(),
  }),

  params: z.object({
    id: z.string().uuid('Invalid exercise ID format'),
  }),
} as const;

