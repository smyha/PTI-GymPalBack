import type { Context, Next } from 'hono';
import type { User } from '@supabase/supabase-js';
import { z } from 'zod';

// Define a generic type for validated data
type ValidatedData<T extends z.ZodSchema> = z.infer<T>;

// Extend the Hono Context to include validated data
declare module 'hono' {
  interface ContextRenderer {
    // Add custom properties to the Hono Context
  }
  interface ContextVariableMap {
    userId: string;
    userEmail: string;
    user: User;
    supabase: unknown;
    requestId: string;
    validatedBody: unknown;
    validatedQuery: unknown;
    validatedParams: unknown;
  }
}

// Export types for use in handlers
export type HonoContext = Context;
export type HonoNext = Next;
export type { ValidatedData };
