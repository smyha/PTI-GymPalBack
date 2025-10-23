import { Context, Next } from 'hono';
import { z, ZodSchema, ZodError } from 'zod';
import { sendValidationError } from '../utils/response.js';
import { ERROR_CODES } from '../constants/index.js';
import '../types/hono.types.js';

// Validation middleware factory - supports body, query, and params
export const validationMiddleware = (
  schemaOrConfig: ZodSchema | { body?: ZodSchema; query?: ZodSchema; params?: ZodSchema }
) => {
  return async (c: Context, next: Next) => {
    try {
      // If it's a simple schema, treat it as body validation
      if ('parse' in schemaOrConfig) {
        const body = await c.req.json();
        const validatedData = schemaOrConfig.parse(body);
        c.set('validatedBody', validatedData);
      } else {
        // Handle multiple validators
        if (schemaOrConfig.body) {
          const body = await c.req.json();
          const validatedData = schemaOrConfig.body.parse(body);
          c.set('validatedBody', validatedData);
        }
        
        if (schemaOrConfig.query) {
          const query = c.req.query();
          const validatedData = schemaOrConfig.query.parse(query);
          c.set('validatedQuery', validatedData);
        }
        
        if (schemaOrConfig.params) {
          const params = c.req.param();
          const validatedData = schemaOrConfig.params.parse(params);
          c.set('validatedParams', validatedData);
        }
      }
      
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });
        
        return sendValidationError(c, errors, error.errors);
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

// Query validation middleware
export const validateQuery = (schema: ZodSchema) => {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      const validatedQuery = schema.parse(query);
      
      // Store validated query in context
      c.set('validatedQuery', validatedQuery);
      
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });
        
        return sendValidationError(c, errors, error.errors);
      }
      
      console.error('Query validation middleware error:', error);
      return c.json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Query validation failed',
          details: 'Invalid query parameters'
        }
      }, 400);
    }
  };
};

// Params validation middleware
export const validateParams = (schema: ZodSchema) => {
  return async (c: Context, next: Next) => {
    try {
      const params = c.req.param();
      const validatedParams = schema.parse(params);
      
      // Store validated params in context
      c.set('validatedParams', validatedParams);
      
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });
        
        return sendValidationError(c, errors, error.errors);
      }
      
      console.error('Params validation middleware error:', error);
      return c.json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Parameter validation failed',
          details: 'Invalid route parameters'
        }
      }, 400);
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  }),

  // ID parameter
  idParam: z.object({
    id: z.string().uuid('Invalid ID format')
  }),

  // Search query
  searchQuery: z.object({
    q: z.string().min(1, 'Search query cannot be empty').optional(),
    filters: z.string().optional().transform(val => val ? JSON.parse(val) : {}),
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10)
  }),

  // Date range
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  }),

  // File upload
  fileUpload: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    mimetype: z.string(),
    size: z.number().positive(),
    buffer: z.instanceof(Buffer)
  })
};

// Validation helper functions
export const getValidatedBody = <T>(c: Context): T | null => {
  return c.get('validatedBody') || null;
};

export const getValidatedQuery = <T>(c: Context): T | null => {
  return c.get('validatedQuery') || null;
};

export const getValidatedParams = <T>(c: Context): T | null => {
  return c.get('validatedParams') || null;
};

// Custom validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUsername = (username: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  
  if (username.length > 30) {
    errors.push('Username must be at most 30 characters long');
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateDate = (date: string): boolean => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

export const validateAge = (dateOfBirth: string): { isValid: boolean; age: number; errors: string[] } => {
  const errors: string[] = [];
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
    ? age - 1 
    : age;
  
  if (actualAge < 13) {
    errors.push('You must be at least 13 years old');
  }
  
  if (actualAge > 120) {
    errors.push('Invalid age');
  }
  
  return {
    isValid: errors.length === 0,
    age: actualAge,
    errors
  };
};

// Sanitization functions
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};

export const sanitizeHtml = (html: string): string => {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

export const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Validation middleware for specific content types
export const validateJson = () => {
  return async (c: Context, next: Next) => {
    const contentType = c.req.header('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return c.json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Content-Type must be application/json'
        }
      }, 400);
    }
    
    await next();
  };
};

export const validateFormData = () => {
  return async (c: Context, next: Next) => {
    const contentType = c.req.header('content-type');
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return c.json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Content-Type must be multipart/form-data'
        }
      }, 400);
    }
    
    await next();
  };
};

// Rate limiting validation
export const validateRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return async (c: Context, next: Next) => {
    const clientId = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const clientData = requests.get(clientId);
    
    if (!clientData || clientData.resetTime < now) {
      requests.set(clientId, { count: 1, resetTime: now + windowMs });
    } else {
      if (clientData.count >= maxRequests) {
        return c.json({
          success: false,
          error: {
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message: 'Rate limit exceeded'
          }
        }, 429);
      }
      
      clientData.count++;
    }
    
    // Clean up old entries
    for (const [id, data] of requests.entries()) {
      if (data.resetTime < now) {
        requests.delete(id);
      }
    }
    
    await next();
  };
};

export default {
  validationMiddleware,
  validateQuery,
  validateParams,
  commonSchemas,
  getValidatedBody,
  getValidatedQuery,
  getValidatedParams,
  validateEmail,
  validatePassword,
  validateUsername,
  validatePhoneNumber,
  validateUrl,
  validateDate,
  validateAge,
  sanitizeString,
  sanitizeHtml,
  sanitizeObject,
  validateJson,
  validateFormData,
  validateRateLimit
};

// Alias for backward compatibility
export const validate = validationMiddleware;
