import { Context, Next } from 'hono';
import { ZodSchema, ZodError } from 'zod';
import { sendValidationError } from '../core/utils/response.js';
import { ERROR_CODES } from '../core/constants/api.js';

/**
 * Formats Zod errors into readable error messages
 */
const formatZodErrors = (error: ZodError): string[] => {
  return error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
};

/**
 * Validation middleware factory
 * Supports body, query, and params validation
 */
export const validate = <T extends ZodSchema>(
  schema: T,
  target: 'body' | 'query' | 'params' = 'body'
) => {
  return async (c: Context, next: Next) => {
    try {
      let data: unknown;
      
      switch (target) {
        case 'body':
          data = await c.req.json();
          break;
        case 'query':
          data = c.req.query();
          break;
        case 'params':
          data = c.req.param();
          break;
      }
      
      const validated = schema.parse(data);
      c.set('validated', validated);
      
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        return sendValidationError(c, formatZodErrors(error), error.errors);
      }
      
      return sendValidationError(c, ['Validation failed'], error);
    }
  };
};

