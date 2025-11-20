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

// Response types use Unified.UserPersonalInfo from core/types/unified.types.ts

