import { z } from 'zod';

export const workoutSchemas = {
  create: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    duration: z.number().int().min(1).max(600).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    exercises: z.array(z.object({
      exercise_id: z.string().uuid(),
      sets: z.number().int().min(1).max(50),
      reps: z.number().int().min(1).max(1000),
      weight: z.number().positive().optional(),
    })).optional(),
    tags: z.array(z.string()).optional(),
    is_public: z.boolean().default(false),
  }),

  list: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    search: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  }),

  update: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    duration: z.number().int().min(1).max(600).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    exercises: z.array(z.object({
      exercise_id: z.string().uuid(),
      sets: z.number().int().min(1).max(50),
      reps: z.number().int().min(1).max(1000),
      weight: z.number().positive().optional(),
    })).optional(),
    tags: z.array(z.string()).optional(),
    is_public: z.boolean().optional(),
  }),

  params: z.object({
    id: z.string().uuid('Invalid workout ID format'),
  }),
} as const;

