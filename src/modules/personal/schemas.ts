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
    preferred_workout_duration: z.number().int().positive().max(300).optional(),
    available_equipment: z.array(z.string()).optional(),
    workout_preferences: z.record(z.any()).optional(),
    injury_history: z.array(z.string()).optional(),
    medical_restrictions: z.array(z.string()).optional(),
    fitness_goals_timeline: z.string().optional(),
    motivation_level: z.number().int().min(1).max(10).optional(),
  }),
  updateDietaryPreferences: z.object({
    dietary_restrictions: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    preferred_cuisines: z.array(z.string()).optional(),
    disliked_foods: z.array(z.string()).optional(),
    daily_calorie_target: z.number().int().positive().max(10000).optional(),
    protein_target_percentage: z.number().min(0).max(100).optional(),
    carb_target_percentage: z.number().min(0).max(100).optional(),
    fat_target_percentage: z.number().min(0).max(100).optional(),
    meal_preferences: z.string().optional(),
  }),
  updateUserStats: z.object({
    height_cm: z.number().positive().max(300).optional(),
    weight_kg: z.number().positive().max(500).optional(),
    body_fat_percentage: z.number().min(0).max(100).optional(),
    target_weight_kg: z.number().positive().max(500).optional(),
    recorded_at: z.string().datetime().optional(),
  }),
} as const;

