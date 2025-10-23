import { Context, Next } from 'hono';
import { HTTP_STATUS, API_MESSAGES, ERROR_CODES } from '../constants/index.js';
import { sendError, sendInternalError } from '../utils/response.js';

// Custom error classes
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: string = ERROR_CODES.INTERNAL_ERROR,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = API_MESSAGES.UNAUTHORIZED) {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = API_MESSAGES.FORBIDDEN) {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = API_MESSAGES.CONFLICT) {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = API_MESSAGES.RATE_LIMIT_EXCEEDED) {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.RATE_LIMIT_EXCEEDED);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.DATABASE_ERROR, true, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(`External service error (${service}): ${message}`, HTTP_STATUS.SERVICE_UNAVAILABLE, ERROR_CODES.EXTERNAL_SERVICE_ERROR, true, details);
  }
}

// Error factory functions
export const createValidationError = (message: string, details?: any) => {
  return new ValidationError(message, details);
};

export const createAuthenticationError = (message?: string) => {
  return new AuthenticationError(message);
};

export const createAuthorizationError = (message?: string) => {
  return new AuthorizationError(message);
};

export const createNotFoundError = (resource?: string) => {
  return new NotFoundError(resource);
};

export const createConflictError = (message?: string) => {
  return new ConflictError(message);
};

export const createRateLimitError = (message?: string) => {
  return new RateLimitError(message);
};

export const createDatabaseError = (message: string, details?: any) => {
  return new DatabaseError(message, details);
};

export const createExternalServiceError = (service: string, message: string, details?: any) => {
  return new ExternalServiceError(service, message, details);
};

// Error handler middleware
export const errorHandler = async (err: Error, c: Context) => {
  console.error('Error caught by middleware:', {
    message: err.message,
    stack: err.stack,
    url: c.req.url,
    method: c.req.method,
    timestamp: new Date().toISOString()
  });

  // Handle known AppError instances
  if (err instanceof AppError) {
    return c.json({
      success: false,
      error: {
        code: (err as any).code,
        message: (err as any).message,
        details: (err as any).details
      }
    }, err.statusCode as any);
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return c.json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: API_MESSAGES.VALIDATION_ERROR,
        details: (err as any).message
      }
    }, HTTP_STATUS.BAD_REQUEST as any);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return c.json({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Invalid token'
      }
    }, HTTP_STATUS.UNAUTHORIZED);
  }

  if (err.name === 'TokenExpiredError') {
    return c.json({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Token expired'
      }
    }, HTTP_STATUS.UNAUTHORIZED);
  }

  // Handle Supabase errors
  if (err.message.includes('supabase') || err.message.includes('postgres')) {
    return c.json({
      success: false,
      error: {
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Database error occurred',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      }
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  // Handle network errors
  if (err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND')) {
    return c.json({
      success: false,
      error: {
        code: ERROR_CODES.EXTERNAL_SERVICE_ERROR,
        message: 'External service unavailable'
      }
    }, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  // Handle timeout errors
  if (err.message.includes('timeout')) {
    return c.json({
      success: false,
      error: {
        code: ERROR_CODES.TIMEOUT_ERROR,
        message: 'Request timeout'
      }
    }, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  // Handle file upload errors
  if (err.message.includes('LIMIT_FILE_SIZE')) {
    return c.json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'File too large'
      }
    }, HTTP_STATUS.BAD_REQUEST as any);
  }

  // Handle CORS errors
  if (err.message.includes('CORS')) {
    return c.json({
      success: false,
      error: {
        code: ERROR_CODES.CORS_ERROR,
        message: 'CORS policy violation'
      }
    }, HTTP_STATUS.FORBIDDEN);
  }

  // Default error handling
  return sendInternalError(c, 'An unexpected error occurred');
};

// 404 handler
export const notFoundHandler = (c: Context) => {
  return c.json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: 'Endpoint not found',
      details: {
        method: c.req.method,
        url: c.req.url,
        availableEndpoints: [
          'GET /health',
          'GET /reference',
          'GET /openapi.json',
          'POST /api/v1/auth/register',
          'POST /api/v1/auth/login',
          'POST /api/v1/auth/logout',
          'GET /api/v1/users/profile',
          'PUT /api/v1/users/profile',
          'GET /api/v1/workouts',
          'POST /api/v1/workouts',
          'GET /api/v1/workouts/:id',
          'PUT /api/v1/workouts/:id',
          'DELETE /api/v1/workouts/:id'
        ]
      }
    }
  }, HTTP_STATUS.NOT_FOUND);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (c: Context, next: Next) => {
    return Promise.resolve(fn(c, next)).catch((err) => {
      return errorHandler(err, c);
    });
  };
};

// Error logging utility
export const logError = (error: Error, context?: any) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    context: context || {},
    level: 'error'
  };

  // In production, you might want to send this to a logging service
  console.error('Error logged:', errorLog);
  
  // You could also send to external logging service here
  // await sendToLoggingService(errorLog);
};

// Error monitoring utility
export const monitorError = (error: Error, context?: any) => {
  logError(error, context);
  
  // In production, you might want to send this to an error monitoring service
  // await sendToErrorMonitoring(error, context);
};

// Error recovery utilities
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

export const shouldRestart = (error: Error): boolean => {
  return !isOperationalError(error);
};

// Error context builder
export const buildErrorContext = (c: Context) => {
  return {
    url: c.req.url,
    method: c.req.method,
    headers: Object.fromEntries(c.req.raw.headers as any),
    userAgent: c.req.header('user-agent'),
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
    timestamp: new Date().toISOString()
  };
};

// Error response formatter
export const formatErrorResponse = (error: Error, includeStack: boolean = false) => {
  const baseResponse = {
    success: false,
    error: {
      code: error instanceof AppError ? error.code : ERROR_CODES.INTERNAL_ERROR,
      message: error.message,
      ...(error instanceof AppError && error.details && { details: error.details })
    }
  };

  if (includeStack && process.env.NODE_ENV === 'development') {
    return {
      ...baseResponse,
      stack: error.stack
    };
  }

  return baseResponse;
};

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createNotFoundError,
  createConflictError,
  createRateLimitError,
  createDatabaseError,
  createExternalServiceError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  logError,
  monitorError,
  isOperationalError,
  shouldRestart,
  buildErrorContext,
  formatErrorResponse
};