import type { HonoContext } from '../types/hono.types.js';
import { HTTP_STATUS, API_MESSAGES, ERROR_CODES } from '../constants/index.js';

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
  pagination?: PaginationResult;
  metadata?: {
    timestamp?: string;
    [key: string]: unknown;
  };
}

interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage?: number;
  prevPage?: number;
}

// Success responses
export const success = <T>(data: T, message: string = API_MESSAGES.SUCCESS): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
};

export const created = <T>(data: T, message: string = API_MESSAGES.CREATED): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
};

export const updated = <T>(data: T, message: string = API_MESSAGES.UPDATED): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
};

export const deleted = (message: string = API_MESSAGES.DELETED): ApiResponse => {
  return {
    success: true,
    message,
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
};

// Error responses
export const error = (
  code: string,
  message: string,
  details?: unknown,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
): ApiResponse => {
  return {
    success: false,
    error: {
      code,
      message,
      details
    },
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
};

export const validationError = (errors: string[], details?: unknown): ApiResponse => {
  return {
    success: false,
    error: {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: API_MESSAGES.VALIDATION_ERROR,
      details: errors
    },
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
};

export const notFound = (resource: string = 'Resource'): ApiResponse => {
  return {
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `${resource} not found`
    },
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
};

export const unauthorized = (message: string = API_MESSAGES.UNAUTHORIZED): ApiResponse => {
  return {
    success: false,
    error: {
      code: ERROR_CODES.UNAUTHORIZED,
      message
    },
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
};

export const forbidden = (message: string = API_MESSAGES.FORBIDDEN): ApiResponse => {
  return {
    success: false,
    error: {
      code: ERROR_CODES.FORBIDDEN,
      message
    },
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
};

export const conflict = (message: string = API_MESSAGES.CONFLICT): ApiResponse => {
  return {
    success: false,
    error: {
      code: ERROR_CODES.CONFLICT,
      message
    },
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
};

export const rateLimitExceeded = (): ApiResponse => {
  return {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: API_MESSAGES.RATE_LIMIT_EXCEEDED
    },
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
};

export const badRequest = (message: string = API_MESSAGES.BAD_REQUEST): ApiResponse => {
  return {
    success: false,
    error: {
      code: ERROR_CODES.BAD_REQUEST,
      message
    },
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
};

export const internalError = (message: string = API_MESSAGES.INTERNAL_ERROR): ApiResponse => {
  return {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message
    },
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
};

// Paginated responses
export const paginated = <T>(
  data: T[],
  pagination: PaginationResult,
  message: string = API_MESSAGES.SUCCESS
): ApiResponse<T[]> => {
  return {
    success: true,
    message,
    data,
    pagination,
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
};

// Response with metadata
export const withMetadata = <T>(
  response: ApiResponse<T>,
  metadata: Record<string, unknown>
): ApiResponse<T> => {
  return {
    ...response,
    metadata: {
      ...response.metadata,
      ...metadata
    }
  };
};

// Hono response helpers
export const sendSuccess = <T>(c: HonoContext, data: T, message?: string, statusCode: number = HTTP_STATUS.OK, pagination?: PaginationResult) => {
  const response = success(data, message);
  if (pagination) {
    return c.json({ ...response, pagination }, statusCode as any);
  }
  return c.json(response, statusCode as any);
};

export const sendCreated = <T>(c: HonoContext, data: T, message?: string) => {
  return c.json(created(data, message), HTTP_STATUS.CREATED);
};

export const sendDeleted = (c: HonoContext, message?: string) => {
  return c.json(deleted(message), HTTP_STATUS.OK);
};

export const sendError = (c: HonoContext, code: string, message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR, details?: unknown) => {
  return c.json(error(code, message, details, statusCode), statusCode as any);
};

export const sendValidationError = (c: HonoContext, errors: string[], details?: unknown) => {
  return c.json(validationError(errors, details), HTTP_STATUS.BAD_REQUEST);
};

export const sendNotFound = (c: HonoContext, resource?: string) => {
  return c.json(notFound(resource), HTTP_STATUS.NOT_FOUND);
};

export const sendUnauthorized = (c: HonoContext, message?: string) => {
  return c.json(unauthorized(message), HTTP_STATUS.UNAUTHORIZED);
};

export const sendConflict = (c: HonoContext, message?: string) => {
  return c.json(conflict(message), HTTP_STATUS.CONFLICT);
};

export const sendInternalError = (c: HonoContext, message?: string) => {
  return c.json(internalError(message), HTTP_STATUS.INTERNAL_SERVER_ERROR);
};

export default {
  success,
  created,
  updated,
  deleted,
  error,
  validationError,
  notFound,
  unauthorized,
  forbidden,
  conflict,
  rateLimitExceeded,
  badRequest,
  internalError,
  paginated,
  withMetadata,
  sendSuccess,
  sendCreated,
  sendDeleted,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendConflict,
  sendInternalError
};
