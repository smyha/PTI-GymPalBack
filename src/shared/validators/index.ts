// ============================================================================
// VALIDATORS INDEX
// ============================================================================
// Central export file for all validation schemas and utilities

// Authentication validators
export * from './auth.validators.js';

// Workout validators
export * from './workout.validators.js';

// Social validators
export * from './social.validators.js';

// ============================================================================
// COMMON VALIDATION UTILITIES
// ============================================================================

import { z } from 'zod';

// Common pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z.string().max(50).optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Common search schema
export const SearchSchema = z.object({
  search: z.string().max(100).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

// Common ID schema
export const IdSchema = z.object({
  id: z.string().min(1, 'ID is required')
});

// Common UUID schema
export const UuidSchema = z.string().uuid('Invalid UUID format');

// Common email schema
export const EmailSchema = z.string().email('Invalid email format');

// Common password schema
export const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

// Common date schema
export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');

// Common datetime schema
export const DateTimeSchema = z.string().datetime('Invalid datetime format');

// Common URL schema
export const UrlSchema = z.string().url('Invalid URL format');

// Common boolean schema
export const BooleanSchema = z.boolean();

// Common number schema
export const NumberSchema = z.number();

// Common integer schema
export const IntegerSchema = z.number().int('Must be an integer');

// Common positive number schema
export const PositiveNumberSchema = z.number().min(0, 'Must be a positive number');

// Common positive integer schema
export const PositiveIntegerSchema = z.number().int().min(0, 'Must be a positive integer');

// Common string schema with length validation
export const StringSchema = (minLength: number = 1, maxLength: number = 255) => 
  z.string().min(minLength, `Must be at least ${minLength} characters`).max(maxLength, `Must be no more than ${maxLength} characters`);

// Common array schema with length validation
export const ArraySchema = (maxLength: number = 100) => 
  z.array(z.string()).max(maxLength, `Array cannot exceed ${maxLength} items`);

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validates a schema and returns formatted error messages
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with isValid boolean and formatted errors array
 */
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): { 
  isValid: boolean; 
  errors: string[]; 
  data?: T 
} => {
  try {
    const result = schema.parse(data);
    return {
      isValid: true,
      errors: [],
      data: result
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
        return `${path}${err.message}`;
      });
      return {
        isValid: false,
        errors
      };
    }
    return {
      isValid: false,
      errors: ['Validation failed']
    };
  }
};

/**
 * Sanitizes string input by trimming and removing extra whitespace
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

/**
 * Validates and sanitizes email address
 * @param email - Email to validate and sanitize
 * @returns Object with isValid boolean and sanitized email
 */
export const validateAndSanitizeEmail = (email: string): { 
  isValid: boolean; 
  email: string; 
  errors: string[] 
} => {
  const errors: string[] = [];
  const sanitizedEmail = email.trim().toLowerCase();
  
  if (!sanitizedEmail) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
    errors.push('Invalid email format');
  } else if (sanitizedEmail.length > 254) {
    errors.push('Email too long');
  }
  
  return {
    isValid: errors.length === 0,
    email: sanitizedEmail,
    errors
  };
};

/**
 * Validates and sanitizes username
 * @param username - Username to validate and sanitize
 * @returns Object with isValid boolean and sanitized username
 */
export const validateAndSanitizeUsername = (username: string): { 
  isValid: boolean; 
  username: string; 
  errors: string[] 
} => {
  const errors: string[] = [];
  const sanitizedUsername = username.trim().toLowerCase();
  
  if (!sanitizedUsername) {
    errors.push('Username is required');
  } else if (sanitizedUsername.length < 3) {
    errors.push('Username must be at least 3 characters');
  } else if (sanitizedUsername.length > 30) {
    errors.push('Username too long');
  } else if (!/^[a-zA-Z0-9_]+$/.test(sanitizedUsername)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }
  
  return {
    isValid: errors.length === 0,
    username: sanitizedUsername,
    errors
  };
};

/**
 * Validates pagination parameters
 * @param page - Page number
 * @param limit - Items per page
 * @returns Object with validated pagination parameters
 */
export const validatePagination = (page?: number, limit?: number): { 
  page: number; 
  limit: number; 
  offset: number 
} => {
  const validatedPage = Math.max(1, page || 1);
  const validatedLimit = Math.min(100, Math.max(1, limit || 20));
  const offset = (validatedPage - 1) * validatedLimit;
  
  return {
    page: validatedPage,
    limit: validatedLimit,
    offset
  };
};

/**
 * Validates sort parameters
 * @param sortBy - Field to sort by
 * @param sortOrder - Sort order
 * @param allowedFields - Array of allowed sort fields
 * @returns Object with validated sort parameters
 */
export const validateSort = (
  sortBy?: string, 
  sortOrder?: string, 
  allowedFields: string[] = []
): { 
  sortBy: string; 
  sortOrder: 'asc' | 'desc' 
} => {
  const validatedSortBy = allowedFields.includes(sortBy || '') ? sortBy! : allowedFields[0] || 'created_at';
  const validatedSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
  
  return {
    sortBy: validatedSortBy,
    sortOrder: validatedSortOrder
  };
};
