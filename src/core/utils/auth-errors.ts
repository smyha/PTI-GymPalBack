/**
 * Authentication Error Classes
 */

export class InvalidCredentialsError extends Error {
  code = 'INVALID_CREDENTIALS';
  statusCode = 401;

  constructor(message: string = 'Invalid email or password') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

export class EmailNotVerifiedError extends Error {
  code = 'EMAIL_NOT_VERIFIED';
  statusCode = 403;

  constructor(message: string = 'Email not verified') {
    super(message);
    this.name = 'EmailNotVerifiedError';
  }
}

export class InvalidTokenError extends Error {
  code = 'TOKEN_INVALID';
  statusCode = 401;

  constructor(message: string = 'Invalid token') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

export class UserAlreadyExistsError extends Error {
  code = 'USER_ALREADY_EXISTS';
  statusCode = 409;

  constructor(message: string = 'User already exists') {
    super(message);
    this.name = 'UserAlreadyExistsError';
  }
}

