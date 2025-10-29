import type { Context } from 'hono';
import { HTTP_STATUS, API_MESSAGES, ERROR_CODES } from '../constants/api.js';

// Type definitions
interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  metadata?: {
    timestamp?: string;
    [key: string]: unknown;
  };
}

// Success responses
export const sendSuccess = <T>(
  c: Context,
  data: T,
  message?: string,
  statusCode: number = HTTP_STATUS.OK
) => {
  return c.json(
    {
      success: true,
      message: message || API_MESSAGES.SUCCESS,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse<T>,
    statusCode as any
  );
};

export const sendCreated = <T>(
  c: Context,
  data: T,
  message?: string
) => {
  return c.json({
    success: true,
    message: message || API_MESSAGES.CREATED,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  } as ApiResponse<T>, HTTP_STATUS.CREATED);
};

export const sendUpdated = <T>(
  c: Context,
  data: T,
  message?: string
) => {
  return c.json({
    success: true,
    message: message || API_MESSAGES.UPDATED,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  } as ApiResponse<T>, HTTP_STATUS.OK);
};

export const sendDeleted = (
  c: Context,
  message?: string
) => {
  return c.json({
    success: true,
    message: message || API_MESSAGES.DELETED,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  } as ApiResponse, HTTP_STATUS.OK);
};

// Error responses
export const sendError = (
  c: Context,
  code: string,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details?: unknown
) => {
  return c.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse,
    statusCode as any
  );
};

export const sendValidationError = (
  c: Context,
  errors: string[],
  details?: unknown
) => {
  return c.json({
    success: false,
    error: {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: API_MESSAGES.VALIDATION_ERROR,
      details: errors,
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  } as ApiResponse, HTTP_STATUS.BAD_REQUEST);
};

export const sendNotFound = (
  c: Context,
  resource?: string
) => {
  return c.json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: resource ? `${resource} not found` : API_MESSAGES.NOT_FOUND,
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  } as ApiResponse, HTTP_STATUS.NOT_FOUND);
};

export const sendUnauthorized = (
  c: Context,
  message?: string
) => {
  return c.json({
    success: false,
    error: {
      code: ERROR_CODES.UNAUTHORIZED,
      message: message || API_MESSAGES.UNAUTHORIZED,
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  } as ApiResponse, HTTP_STATUS.UNAUTHORIZED);
};

export const sendForbidden = (
  c: Context,
  message?: string
) => {
  return c.json({
    success: false,
    error: {
      code: ERROR_CODES.FORBIDDEN,
      message: message || API_MESSAGES.FORBIDDEN,
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  } as ApiResponse, HTTP_STATUS.FORBIDDEN);
};

export const sendConflict = (
  c: Context,
  message?: string
) => {
  return c.json({
    success: false,
    error: {
      code: ERROR_CODES.CONFLICT,
      message: message || API_MESSAGES.CONFLICT,
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  } as ApiResponse, HTTP_STATUS.CONFLICT);
};

// Paginated response
export const sendPaginated = <T>(
  c: Context,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message?: string
) => {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  
  return c.json({
    success: true,
    message: message || API_MESSAGES.SUCCESS,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  } as ApiResponse<T[]>, HTTP_STATUS.OK);
};

