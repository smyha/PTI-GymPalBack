import { Context } from 'hono';
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
    user: any; // User object from auth middleware
    validatedBody: any; // This will be refined by middleware
    validatedQuery: any; // This will be refined by middleware
    validatedParams: any; // This will be refined by middleware
  }
}

// Export types for use in handlers
export type HonoContext = Context;
export type { ValidatedData };
