/**
 * Custom authentication error classes
 * Provides structured error handling for authentication operations
 */

import { AUTH_ERROR_CODES } from './constants.js';

/**
 * Base authentication error class
 */
export abstract class AuthError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;

  constructor(
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
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
  readonly code = AUTH_ERROR_CODES.INVALID_CREDENTIALS;
  readonly statusCode = 401;
  readonly isOperational = true;

  constructor(message = 'Invalid email or password') {
    super(message);
  }
}

/**
 * Token expired error
 */
export class TokenExpiredError extends AuthError {
  readonly code = AUTH_ERROR_CODES.TOKEN_EXPIRED;
  readonly statusCode = 401;
  readonly isOperational = true;

  constructor(message = 'Token has expired') {
    super(message);
  }
}

/**
 * Invalid token error
 */
export class InvalidTokenError extends AuthError {
  readonly code = AUTH_ERROR_CODES.TOKEN_INVALID;
  readonly statusCode = 401;
  readonly isOperational = true;

  constructor(message = 'Invalid token') {
    super(message);
  }
}

/**
 * Missing token error
 */
export class MissingTokenError extends AuthError {
  readonly code = AUTH_ERROR_CODES.TOKEN_MISSING;
  readonly statusCode = 401;
  readonly isOperational = true;

  constructor(message = 'Authentication token is required') {
    super(message);
  }
}

/**
 * User not found error
 */
export class UserNotFoundError extends AuthError {
  readonly code = AUTH_ERROR_CODES.USER_NOT_FOUND;
  readonly statusCode = 404;
  readonly isOperational = true;

  constructor(message = 'User not found') {
    super(message);
  }
}

/**
 * User already exists error
 */
export class UserAlreadyExistsError extends AuthError {
  readonly code = AUTH_ERROR_CODES.USER_ALREADY_EXISTS;
  readonly statusCode = 409;
  readonly isOperational = true;

  constructor(message = 'User already exists') {
    super(message);
  }
}

/**
 * Account locked error
 */
export class AccountLockedError extends AuthError {
  readonly code = AUTH_ERROR_CODES.ACCOUNT_LOCKED;
  readonly statusCode = 423;
  readonly isOperational = true;

  constructor(message = 'Account is temporarily locked due to too many failed attempts') {
    super(message);
  }
}

/**
 * Password too weak error
 */
export class PasswordTooWeakError extends AuthError {
  readonly code = AUTH_ERROR_CODES.PASSWORD_TOO_WEAK;
  readonly statusCode = 400;
  readonly isOperational = true;

  constructor(
    message = 'Password does not meet security requirements',
    public readonly validationErrors: string[] = []
  ) {
    super(message, { validationErrors });
  }
}

/**
 * Email not verified error
 */
export class EmailNotVerifiedError extends AuthError {
  readonly code = AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED;
  readonly statusCode = 403;
  readonly isOperational = true;

  constructor(message = 'Email address must be verified before accessing this resource') {
    super(message);
  }
}

/**
 * Rate limit exceeded error
 */
export class RateLimitExceededError extends AuthError {
  readonly code = AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED;
  readonly statusCode = 429;
  readonly isOperational = true;

  constructor(
    message = 'Too many requests, please try again later',
    public readonly retryAfter?: number
  ) {
    super(message, { retryAfter });
  }
}

/**
 * Invalid verification code error
 */
export class InvalidVerificationCodeError extends AuthError {
  readonly code = AUTH_ERROR_CODES.INVALID_VERIFICATION_CODE;
  readonly statusCode = 400;
  readonly isOperational = true;

  constructor(message = 'Invalid verification code') {
    super(message);
  }
}

/**
 * Verification code expired error
 */
export class VerificationCodeExpiredError extends AuthError {
  readonly code = AUTH_ERROR_CODES.VERIFICATION_CODE_EXPIRED;
  readonly statusCode = 400;
  readonly isOperational = true;

  constructor(message = 'Verification code has expired') {
    super(message);
  }
}

/**
 * Authentication error factory
 * Creates appropriate error instances based on error codes
 */
export class AuthErrorFactory {
  static create(errorCode: string, message?: string, details?: Record<string, any>): AuthError {
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
