/**
 * Custom authentication error classes
 * Provides structured error handling for authentication operations
 */
import { AUTH_ERROR_CODES } from './constants.js';
/**
 * Base authentication error class
 */
export class AuthError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
            details: this.details,
            isOperational: this.isOperational,
        };
    }
}
/**
 * Invalid credentials error
 */
export class InvalidCredentialsError extends AuthError {
    constructor(message = 'Invalid email or password') {
        super(message);
        this.code = AUTH_ERROR_CODES.INVALID_CREDENTIALS;
        this.statusCode = 401;
        this.isOperational = true;
    }
}
/**
 * Token expired error
 */
export class TokenExpiredError extends AuthError {
    constructor(message = 'Token has expired') {
        super(message);
        this.code = AUTH_ERROR_CODES.TOKEN_EXPIRED;
        this.statusCode = 401;
        this.isOperational = true;
    }
}
/**
 * Invalid token error
 */
export class InvalidTokenError extends AuthError {
    constructor(message = 'Invalid token') {
        super(message);
        this.code = AUTH_ERROR_CODES.TOKEN_INVALID;
        this.statusCode = 401;
        this.isOperational = true;
    }
}
/**
 * Missing token error
 */
export class MissingTokenError extends AuthError {
    constructor(message = 'Authentication token is required') {
        super(message);
        this.code = AUTH_ERROR_CODES.TOKEN_MISSING;
        this.statusCode = 401;
        this.isOperational = true;
    }
}
/**
 * User not found error
 */
export class UserNotFoundError extends AuthError {
    constructor(message = 'User not found') {
        super(message);
        this.code = AUTH_ERROR_CODES.USER_NOT_FOUND;
        this.statusCode = 404;
        this.isOperational = true;
    }
}
/**
 * User already exists error
 */
export class UserAlreadyExistsError extends AuthError {
    constructor(message = 'User already exists') {
        super(message);
        this.code = AUTH_ERROR_CODES.USER_ALREADY_EXISTS;
        this.statusCode = 409;
        this.isOperational = true;
    }
}
/**
 * Account locked error
 */
export class AccountLockedError extends AuthError {
    constructor(message = 'Account is temporarily locked due to too many failed attempts') {
        super(message);
        this.code = AUTH_ERROR_CODES.ACCOUNT_LOCKED;
        this.statusCode = 423;
        this.isOperational = true;
    }
}
/**
 * Password too weak error
 */
export class PasswordTooWeakError extends AuthError {
    constructor(message = 'Password does not meet security requirements', validationErrors = []) {
        super(message, { validationErrors });
        this.validationErrors = validationErrors;
        this.code = AUTH_ERROR_CODES.PASSWORD_TOO_WEAK;
        this.statusCode = 400;
        this.isOperational = true;
    }
}
/**
 * Email not verified error
 */
export class EmailNotVerifiedError extends AuthError {
    constructor(message = 'Email address must be verified before accessing this resource') {
        super(message);
        this.code = AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED;
        this.statusCode = 403;
        this.isOperational = true;
    }
}
/**
 * Rate limit exceeded error
 */
export class RateLimitExceededError extends AuthError {
    constructor(message = 'Too many requests, please try again later', retryAfter) {
        super(message, { retryAfter });
        this.retryAfter = retryAfter;
        this.code = AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED;
        this.statusCode = 429;
        this.isOperational = true;
    }
}
/**
 * Invalid verification code error
 */
export class InvalidVerificationCodeError extends AuthError {
    constructor(message = 'Invalid verification code') {
        super(message);
        this.code = AUTH_ERROR_CODES.INVALID_VERIFICATION_CODE;
        this.statusCode = 400;
        this.isOperational = true;
    }
}
/**
 * Verification code expired error
 */
export class VerificationCodeExpiredError extends AuthError {
    constructor(message = 'Verification code has expired') {
        super(message);
        this.code = AUTH_ERROR_CODES.VERIFICATION_CODE_EXPIRED;
        this.statusCode = 400;
        this.isOperational = true;
    }
}
/**
 * Authentication error factory
 * Creates appropriate error instances based on error codes
 */
export class AuthErrorFactory {
    static create(errorCode, message, details) {
        switch (errorCode) {
            case AUTH_ERROR_CODES.INVALID_CREDENTIALS:
                return new InvalidCredentialsError(message);
            case AUTH_ERROR_CODES.TOKEN_EXPIRED:
                return new TokenExpiredError(message);
            case AUTH_ERROR_CODES.TOKEN_INVALID:
                return new InvalidTokenError(message);
            case AUTH_ERROR_CODES.TOKEN_MISSING:
                return new MissingTokenError(message);
            case AUTH_ERROR_CODES.USER_NOT_FOUND:
                return new UserNotFoundError(message);
            case AUTH_ERROR_CODES.USER_ALREADY_EXISTS:
                return new UserAlreadyExistsError(message);
            case AUTH_ERROR_CODES.ACCOUNT_LOCKED:
                return new AccountLockedError(message);
            case AUTH_ERROR_CODES.PASSWORD_TOO_WEAK:
                return new PasswordTooWeakError(message, details?.validationErrors);
            case AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED:
                return new EmailNotVerifiedError(message);
            case AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED:
                return new RateLimitExceededError(message, details?.retryAfter);
            case AUTH_ERROR_CODES.INVALID_VERIFICATION_CODE:
                return new InvalidVerificationCodeError(message);
            case AUTH_ERROR_CODES.VERIFICATION_CODE_EXPIRED:
                return new VerificationCodeExpiredError(message);
            default:
                return new InvalidCredentialsError(message || 'Authentication error');
        }
    }
}
