import { z } from 'zod';
import { workoutSchemas } from './schemas.js';

export type CreateWorkoutData = z.infer<typeof workoutSchemas.create>;
export type UpdateWorkoutData = z.infer<typeof workoutSchemas.update>;
export type WorkoutFilters = z.infer<typeof workoutSchemas.list>;

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  duration?: number;
  difficulty?: string;
  exercises?: any[];
  tags?: string[];
  is_public?: boolean;
  created_at: string;
  updated_at: string;
}

