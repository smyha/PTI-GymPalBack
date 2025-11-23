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

  completedCounts: z.object({
    userId: z.string().uuid('Invalid user ID format'),
    period: z.enum(['week', 'month', 'year', 'all']).default('all'),
    date: z.string().optional(),
  }),

  streak: z.object({
    date: z.string().optional(),
  }),

  // Exercise Set Logs schemas
  createSetLog: z.object({
    workout_session_id: z.string().uuid().optional(),
    scheduled_workout_id: z.string().uuid().optional(),
    exercise_id: z.string().uuid(),
    set_number: z.number().int().min(1),
    weight_kg: z.number().min(0).max(1000).optional(),
    reps_completed: z.number().int().min(0).max(1000).optional(),
    completed: z.boolean().default(true),
    rpe: z.number().int().min(1).max(10).optional(),
    rir: z.number().int().min(0).max(20).optional(),
    failure: z.boolean().default(false),
    rest_seconds: z.number().int().min(0).max(3600).optional(),
    notes: z.string().optional(),
  }),

  createSetLogs: z.array(z.object({
    workout_session_id: z.string().uuid().optional(),
    scheduled_workout_id: z.string().uuid().optional(),
    exercise_id: z.string().uuid(),
    set_number: z.number().int().min(1),
    weight_kg: z.number().min(0).max(1000).optional(),
    reps_completed: z.number().int().min(0).max(1000).optional(),
    completed: z.boolean().default(true),
    rpe: z.number().int().min(1).max(10).optional(),
    rir: z.number().int().min(0).max(20).optional(),
    failure: z.boolean().default(false),
    rest_seconds: z.number().int().min(0).max(3600).optional(),
    notes: z.string().optional(),
  })),

  getProgressStats: z.object({
    period: z.enum(['week', 'month', 'year', 'all']).default('month'),
    exercise_id: z.string().uuid().optional(),
  }),
} as const;

