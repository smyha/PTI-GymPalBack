/**
 * Error Middleware
 * Provides custom error classes and centralized error handling
 */

import type { HonoContext } from '../types/hono.types.js';
import { ZodError } from 'zod';
import { HTTP_STATUS, API_MESSAGES, ERROR_CODES } from '../constants/index.js';
import { sendInternalError } from '../utils/response.js';
import { logger, logError } from '../../lib/logger.js';

/**
 * Custom error classes for typed error handling
 */
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

/**
 * Global error handler middleware
 * Catches and formats all unhandled errors in the application
 */
export const errorHandler = async (err: Error, c: HonoContext) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: c.req.url,
    method: c.req.method,
    requestId: c.get('requestId'),
    timestamp: new Date().toISOString()
  }, 'Error caught by middleware');
  
  logError(err, {
    url: c.req.url,
    method: c.req.method,
    requestId: c.get('requestId')
  });

  // Handle known AppError instances
  if (err instanceof AppError) {
    return c.json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    }, err.statusCode as any);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return c.json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: API_MESSAGES.VALIDATION_ERROR,
        details: err.errors
      }
    }, HTTP_STATUS.BAD_REQUEST);
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
    }, HTTP_STATUS.BAD_REQUEST);
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

