import { HTTP_STATUS, API_MESSAGES, ERROR_CODES } from '../constants/index.js';
// Success responses
export const success = (data, message = API_MESSAGES.SUCCESS) => {
    return {
        success: true,
        message,
        data,
        metadata: {
            timestamp: new Date().toISOString()
        }
    };
};
export const created = (data, message = API_MESSAGES.CREATED) => {
    return {
        success: true,
        message,
        data,
        metadata: {
            timestamp: new Date().toISOString()
        }
    };
};
export const updated = (data, message = API_MESSAGES.UPDATED) => {
    return {
        success: true,
        message,
        data,
        metadata: {
            timestamp: new Date().toISOString()
        }
    };
};
export const deleted = (message = API_MESSAGES.DELETED) => {
    return {
        success: true,
        message,
        metadata: {
            timestamp: new Date().toISOString()
        }
    };
};
// Error responses
export const error = (code, message, details, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) => {
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
export const validationError = (errors, details) => {
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
export const notFound = (resource = 'Resource') => {
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
export const unauthorized = (message = API_MESSAGES.UNAUTHORIZED) => {
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
export const forbidden = (message = API_MESSAGES.FORBIDDEN) => {
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
export const conflict = (message = API_MESSAGES.CONFLICT) => {
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
export const rateLimitExceeded = () => {
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
export const badRequest = (message = API_MESSAGES.BAD_REQUEST) => {
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
export const internalError = (message = API_MESSAGES.INTERNAL_ERROR) => {
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
export const paginated = (data, pagination, message = API_MESSAGES.SUCCESS) => {
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
export const withMetadata = (response, metadata) => {
    return {
        ...response,
        metadata: {
            ...response.metadata,
            ...metadata
        }
    };
};
// Hono response helpers
export const sendSuccess = (c, data, message, statusCode = HTTP_STATUS.OK, pagination) => {
    const response = success(data, message);
    if (pagination) {
        response.pagination = pagination;
    }
    return c.json(response, statusCode);
};
export const sendCreated = (c, data, message) => {
    return c.json(created(data, message), HTTP_STATUS.CREATED);
};
export const sendDeleted = (c, message) => {
    return c.json(deleted(message), HTTP_STATUS.OK);
};
export const sendError = (c, code, message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, details) => {
    return c.json(error(code, message, details, statusCode), statusCode);
};
export const sendValidationError = (c, errors, details) => {
    return c.json(validationError(errors, details), HTTP_STATUS.BAD_REQUEST);
};
export const sendNotFound = (c, resource) => {
    return c.json(notFound(resource), HTTP_STATUS.NOT_FOUND);
};
export const sendUnauthorized = (c, message) => {
    return c.json(unauthorized(message), HTTP_STATUS.UNAUTHORIZED);
};
export const sendConflict = (c, message) => {
    return c.json(conflict(message), HTTP_STATUS.CONFLICT);
};
export const sendInternalError = (c, message) => {
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
