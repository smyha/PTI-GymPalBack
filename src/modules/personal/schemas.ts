import { z } from 'zod';

export const personalSchemas = {
  updateInfo: z.object({
    age: z.number().int().min(13).max(120).optional(),
    weight_kg: z.number().positive().max(500).optional(),
    height_cm: z.number().int().positive().max(300).optional(),
    body_fat_percentage: z.number().min(0).max(100).optional(),
  }),
  updateFitnessProfile: z.object({
    experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    primary_goal: z.string().min(1).max(100).optional(),
    secondary_goals: z.array(z.string()).optional(),
    workout_frequency: z.number().int().min(1).max(7).optional(),
  }),
} as const;

