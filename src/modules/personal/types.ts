/**
 * Personal Module Types
 * Request types inferred from Zod schemas
 * Response types use core/types/unified.types.ts
 */

import { z } from 'zod';
import { personalSchemas } from './schemas.js';

// Request types (from Zod schemas)
export type UpdatePersonalInfoData = z.infer<typeof personalSchemas.updateInfo>;
export type UpdateFitnessProfileData = z.infer<typeof personalSchemas.updateFitnessProfile>;
export type UpdateDietaryPreferencesData = z.infer<typeof personalSchemas.updateDietaryPreferences>;
export type UpdateUserStatsData = z.infer<typeof personalSchemas.updateUserStats>;

// Response types use Unified.UserPersonalInfo from core/types/unified.types.ts

