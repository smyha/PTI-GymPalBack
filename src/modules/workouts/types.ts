import { z } from 'zod';
import { workoutSchemas } from './schemas.js';

/**
 * Request/Input types (from request validation)
 */
export type CreateWorkoutData = z.infer<typeof workoutSchemas.create>;
export type UpdateWorkoutData = z.infer<typeof workoutSchemas.update>;
export type WorkoutFilters = z.infer<typeof workoutSchemas.list>;

/**
 * Note: Workout response type should use unified types from core/types/unified.types.ts
 * The mapWorkoutRowToWorkout() helper converts database rows to Unified.Workout type
 * This ensures consistency across backend and frontend
 */

