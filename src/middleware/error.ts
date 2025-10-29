import { Context, ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { HTTP_STATUS, ERROR_CODES, API_MESSAGES } from '../core/constants/api.js';
import { AppError } from '../core/utils/errors.js';
import { logger } from '../core/config/logger.js';
import { ZodError } from 'zod';

export const errorHandler: ErrorHandler = async (err: Error, c: Context) => {
  logger.error({ error: err, path: c.req.path }, 'Request error');

  // Handle HTTPException from Hono
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.BAD_REQUEST,
          message: err.message,
        },
      },
      err.status as any
    );
  }

  // Handle AppError
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      },
      err.statusCode as any
    );
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: API_MESSAGES.VALIDATION_ERROR,
          details: err.errors,
        },
      },
      HTTP_STATUS.BAD_REQUEST as any
    );
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid token',
        },
      },
      HTTP_STATUS.UNAUTHORIZED as any
    );
  }

  if (err.name === 'TokenExpiredError') {
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.TOKEN_EXPIRED,
          message: 'Token expired',
        },
      },
      HTTP_STATUS.UNAUTHORIZED as any
    );
  }

  // Default error response
  return c.json(
    {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: API_MESSAGES.INTERNAL_ERROR,
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
    },
    HTTP_STATUS.INTERNAL_SERVER_ERROR as any
  );
};

