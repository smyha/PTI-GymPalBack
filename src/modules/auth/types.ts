import { z } from 'zod';
import { authSchemas } from './schemas.js';

/**
 * Request/Input types (from request validation)
 */
export type RegisterData = z.infer<typeof authSchemas.register>;
export type LoginData = z.infer<typeof authSchemas.login>;
export type RefreshData = z.infer<typeof authSchemas.refresh>;
export type ResetPasswordData = z.infer<typeof authSchemas.resetPassword>;
export type ChangePasswordData = z.infer<typeof authSchemas.changePassword>;

/**
 * Note: All response types should use unified types from core/types/unified.types.ts
 * - AuthUser (for individual user objects)
 * - AuthResponse (for authentication responses with tokens)
 *
 * This ensures consistency across backend and frontend
 */

