import { z } from 'zod';

export const workoutSchemas = {
  create: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    duration_minutes: z.number().int().min(1).max(300).optional().default(60),
    type: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    is_template: z.boolean().optional(),
    is_public: z.boolean().optional(),
    target_goal: z.string().optional(),
    target_level: z.string().optional(),
    days_per_week: z.number().int().min(1).max(7).optional(),
    equipment_required: z.array(z.string()).optional(),
    user_notes: z.string().optional(),
    exercises: z.array(z.object({
      exercise_id: z.string().uuid(),
      sets: z.number().int().min(1).max(50),
      reps: z.number().int().min(1).max(1000),
      weight: z.number().min(0).optional(),
    })).optional(),
    tags: z.array(z.string()).optional(),
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
    duration_minutes: z.number().int().min(1).max(600).optional(),
    type: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    is_template: z.boolean().optional(),
    is_public: z.boolean().optional(),
    target_goal: z.string().optional(),
    target_level: z.string().optional(),
    days_per_week: z.number().int().min(1).max(7).optional(),
    equipment_required: z.array(z.string()).optional(),
    user_notes: z.string().optional(),
    exercises: z.array(z.object({
      exercise_id: z.string().uuid(),
      sets: z.number().int().min(1).max(50),
      reps: z.number().int().min(1).max(1000),
      weight: z.number().min(0).optional(),
    })).optional(),
    tags: z.array(z.string()).optional(),
  }),

  params: z.object({
    id: z.string().uuid('Invalid workout ID format'),
  }),
} as const;

