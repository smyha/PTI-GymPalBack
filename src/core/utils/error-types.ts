/**
 * STRUCTURED ERROR TYPES & UTILITIES
 *
 * Provides type-safe error handling with standardized error codes,
 * messages, and structures across the entire application.
 */

import type { ApiError, ValidationError } from '../types/unified.types.js';

// ============================================================================
// ERROR CODES
// ============================================================================

export enum ErrorCode {
  // Authentication (1000-1099)
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS = 'USERNAME_ALREADY_EXISTS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  INVALID_RESET_TOKEN = 'INVALID_RESET_TOKEN',

  // Validation (2000-2099)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Resource (3000-3099)
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',

  // Permission (4000-4099)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  OWNERSHIP_REQUIRED = 'OWNERSHIP_REQUIRED',

  // Server (5000-5099)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Rate Limiting (6000-6099)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
}

// ============================================================================
// ERROR MAPPINGS
// ============================================================================

export const ErrorMessages: Record<ErrorCode, string> = {
  // Auth
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please log in again',
  [ErrorCode.TOKEN_INVALID]: 'Invalid or malformed token',
  [ErrorCode.UNAUTHORIZED]: 'You must be logged in to access this resource',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'This email is already registered',
  [ErrorCode.USERNAME_ALREADY_EXISTS]: 'This username is already taken',
  [ErrorCode.EMAIL_NOT_VERIFIED]: 'Please verify your email address',
  [ErrorCode.INVALID_RESET_TOKEN]: 'Invalid or expired password reset token',

  // Validation
  [ErrorCode.VALIDATION_ERROR]: 'One or more fields have validation errors',
  [ErrorCode.INVALID_INPUT]: 'The input provided is invalid',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'A required field is missing',
  [ErrorCode.INVALID_FORMAT]: 'The format of the provided data is invalid',

  // Resource
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found',
  [ErrorCode.ALREADY_EXISTS]: 'This resource already exists',
  [ErrorCode.CONFLICT]: 'The operation cannot be completed due to a conflict',
  [ErrorCode.RESOURCE_LOCKED]: 'This resource is currently locked',

  // Permission
  [ErrorCode.FORBIDDEN]: 'You do not have permission to access this resource',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Your account lacks the required permissions',
  [ErrorCode.OWNERSHIP_REQUIRED]: 'You can only modify your own resources',

  // Server
  [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again later',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable',
  [ErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again later',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'An external service failed. Please try again later',

  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'You have made too many requests. Please try again later',
  [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests. Please wait before trying again',
};

// ============================================================================
// ERROR STATUS CODE MAPPINGS
// ============================================================================

export const ErrorStatusCodes: Record<ErrorCode, number> = {
  // Auth (401-403)
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.TOKEN_INVALID]: 401,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 409,
  [ErrorCode.USERNAME_ALREADY_EXISTS]: 409,
  [ErrorCode.EMAIL_NOT_VERIFIED]: 403,
  [ErrorCode.INVALID_RESET_TOKEN]: 401,

  // Validation (400)
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,

  // Resource (404, 409)
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.RESOURCE_LOCKED]: 423,

  // Permission (403)
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.OWNERSHIP_REQUIRED]: 403,

  // Server (500, 503)
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 500,

  // Rate Limiting (429)
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,
};

// ============================================================================
// ERROR CLASSES
// ============================================================================

/**
 * Base application error with structured properties
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;
  readonly timestamp: string;

  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, unknown>
  ) {
    super(message || ErrorMessages[code]);
    this.code = code;
    this.statusCode = ErrorStatusCodes[code];
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toApiError(): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Validation error with field-level details
 */
export class ValidationAppError extends AppError {
  readonly fieldErrors: Record<string, string[]>;

  constructor(fieldErrors: Record<string, string[]>) {
    super(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      fieldErrors
    );
    this.fieldErrors = fieldErrors;
    Object.setPrototypeOf(this, ValidationAppError.prototype);
  }

  toValidationError(): ValidationError {
    return {
      code: ErrorCode.VALIDATION_ERROR as unknown as 'VALIDATION_ERROR',
      message: this.message,
      details: this.fieldErrors,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Authentication error
 */
export class AuthError extends AppError {
  constructor(code: ErrorCode, message?: string) {
    super(code, message);
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with id ${identifier} not found`
      : `${resource} not found`;
    super(ErrorCode.NOT_FOUND, message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Permission denied error
 */
export class ForbiddenError extends AppError {
  constructor(message?: string) {
    super(ErrorCode.FORBIDDEN, message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Conflict error (resource already exists, etc.)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(ErrorCode.CONFLICT, message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

// ============================================================================
// ERROR GUARD FUNCTIONS
// ============================================================================

/**
 * Type guard to check if an object is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if an error is a validation error
 */
export function isValidationError(error: unknown): error is ValidationAppError {
  return error instanceof ValidationAppError;
}

/**
 * Type guard to check if an error is an auth error
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/**
 * Type guard to check if an error is a not found error
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Convert unknown error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      ErrorCode.INTERNAL_ERROR,
      error.message
    );
  }

  return new AppError(
    ErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred'
  );
}

/**
 * Format error for API response
 */
export function formatErrorForResponse(error: unknown): { status: number; body: any } {
  const appError = toAppError(error);

  if (isValidationError(appError)) {
    return {
      status: appError.statusCode,
      body: {
        success: false,
        message: appError.message,
        error: appError.toValidationError(),
      },
    };
  }

  return {
    status: appError.statusCode,
    body: {
      success: false,
      message: appError.message,
      error: appError.toApiError(),
    },
  };
}
