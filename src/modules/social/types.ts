/**
 * Social Module Types
 * Request types inferred from Zod schemas
 * Response types use core/types/unified.types.ts
 */

import { z } from 'zod';
import { socialSchemas } from './schemas.js';

// Request types (from Zod schemas)
export type CreatePostData = z.infer<typeof socialSchemas.createPost>;
export type UpdatePostData = z.infer<typeof socialSchemas.updatePost>;
export type CreateCommentData = z.infer<typeof socialSchemas.createComment>;
export type PostFilters = z.infer<typeof socialSchemas.listPosts>;

// Response types use Unified.Post, Unified.PostComment from core/types/unified.types.ts

