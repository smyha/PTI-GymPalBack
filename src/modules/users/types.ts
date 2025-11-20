/**
 * User Module Types
 * Request types inferred from Zod schemas
 * Response types use core/types/unified.types.ts
 */

import { z } from 'zod';
import { userSchemas } from './schemas.js';

// Request types (from Zod schemas)
export type UpdateProfileData = z.infer<typeof userSchemas.updateProfile>;
export type SearchUsersFilters = z.infer<typeof userSchemas.search>;

// Response types use Unified.UserProfile from core/types/unified.types.ts

