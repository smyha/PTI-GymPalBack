import { z } from 'zod';
import { exerciseSchemas } from './schemas.js';

export type CreateExerciseData = z.infer<typeof exerciseSchemas.create>;
export type UpdateExerciseData = z.infer<typeof exerciseSchemas.update>;
export type ExerciseFilters = z.infer<typeof exerciseSchemas.list>;

export interface Exercise {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  muscle_group?: string;
  equipment?: string[];
  difficulty?: string;
  tags?: string[];
  is_public?: boolean;
  created_at: string;
  updated_at: string;
}

