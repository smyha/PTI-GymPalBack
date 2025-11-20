/**
 * Exercise Module Types
 * Request types inferred from Zod schemas
 * Response types use core/types/unified.types.ts
 */

import { z } from 'zod';
import { exerciseSchemas } from './schemas.js';

// Request types (from Zod schemas)
export type CreateExerciseData = z.infer<typeof exerciseSchemas.create>;
export type UpdateExerciseData = z.infer<typeof exerciseSchemas.update>;
export type ExerciseFilters = z.infer<typeof exerciseSchemas.list>;

// Response types use Unified.Exercise from core/types/unified.types.ts

