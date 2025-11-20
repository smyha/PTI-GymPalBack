import { Context, Next } from 'hono';
import { ZodSchema, ZodError } from 'zod';
import { sendValidationError } from '../core/utils/response.js';

/**
 * Formats Zod errors into readable error messages
 */
const formatZodErrors = (error: ZodError): string[] => {
  return error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
};

/**
 * Combined validation middleware factory
 * Validates both params and body together and merges them into a single validated object
 */
export const validateCombined = <T extends ZodSchema>(
  schema: T,
  targets: Array<'body' | 'query' | 'params'> = ['params', 'body']
) => {
  return async (c: Context, next: Next) => {
    try {
      const dataToValidate: Record<string, any> = {};

      // Collect data from all targets
      for (const target of targets) {
        let data: unknown;

        switch (target) {
          case 'body':
            try {
              data = await c.req.json();
            } catch {
              data = {};
            }
            break;
          case 'query':
            data = c.req.query();
            break;
          case 'params':
            data = c.req.param();
            break;
        }

        // Merge data (params override body, body overrides query)
        if (data && typeof data === 'object') {
          Object.assign(dataToValidate, data);
        }
      }

      // Validate the merged data
      const validated = schema.parse(dataToValidate);
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
