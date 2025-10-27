/**
 * Validation Middleware
 * Validates request body, query params, and route params using Zod schemas
 */

import type { HonoContext, HonoNext } from '../types/hono.types.js';
import { ZodSchema, ZodError } from 'zod';
import { sendValidationError } from '../utils/response.js';
import { ERROR_CODES } from '../constants/index.js';

/**
 * Formats Zod errors into readable error messages
 */
const formatZodErrors = (error: ZodError): string[] => {
  return error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
};

/**
 * Validation middleware factory
 * Supports body, query, and params validation
 *
 * @example
 * // Single schema (defaults to body)
 * validationMiddleware(mySchema)
 *
 * // Multiple schemas
 * validationMiddleware({ body: bodySchema, query: querySchema, params: paramsSchema })
 */
export const validationMiddleware = (
  schemaOrConfig: ZodSchema | { body?: ZodSchema; query?: ZodSchema; params?: ZodSchema }
) => {
  return async (c: HonoContext, next: HonoNext) => {
    try {
      // Simple schema = body validation
      if ('parse' in schemaOrConfig) {
        const body = await c.req.json();
        c.set('validatedBody', schemaOrConfig.parse(body));
      } else {
        // Multi-schema validation
        if (schemaOrConfig.body) {
          const body = await c.req.json();
          c.set('validatedBody', schemaOrConfig.body.parse(body));
        }

        if (schemaOrConfig.query) {
          const query = c.req.query();
          c.set('validatedQuery', schemaOrConfig.query.parse(query));
        }

        if (schemaOrConfig.params) {
          const params = c.req.param();
          c.set('validatedParams', schemaOrConfig.params.parse(params));
        }
      }

      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        return sendValidationError(c, formatZodErrors(error), error.errors);
      }

      console.error('Validation middleware error:', error);
      return c.json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: 'Invalid request data'
        }
      }, 400);
    }
  };
};

export default validationMiddleware;
