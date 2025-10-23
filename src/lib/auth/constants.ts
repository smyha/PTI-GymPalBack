/**
 * Authentication constants and configuration
 * Centralized configuration for all authentication-related settings
 */

// Password validation rules
export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 100,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  SPECIAL_CHARS: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
} as const;

// Error codes
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_MISSING: 'TOKEN_MISSING',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  PASSWORD_TOO_WEAK: 'PASSWORD_TOO_WEAK',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_VERIFICATION_CODE: 'INVALID_VERIFICATION_CODE',
  VERIFICATION_CODE_EXPIRED: 'VERIFICATION_CODE_EXPIRED',
} as const;

// Rate limiting
export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  },
  PASSWORD_RESET: {
    MAX_ATTEMPTS: 3,
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  },
  VERIFICATION_CODE: {
    MAX_ATTEMPTS: 3,
    WINDOW_MS: 5 * 60 * 1000, // 5 minutes
  },
} as const;

// Password strength levels
export const PASSWORD_STRENGTH = {
  WEAK: 'weak',
  MEDIUM: 'medium',
  STRONG: 'strong',
  VERY_STRONG: 'very_strong',
} as const;

// User roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  PREMIUM: 'premium',
} as const;

// Authentication providers
export const AUTH_PROVIDERS = {
  EMAIL: 'email',
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  APPLE: 'apple',
} as const;

// Session configuration
export const SESSION_CONFIG = {
  COOKIE_NAME: 'gympal_session',
  COOKIE_HTTP_ONLY: true,
  COOKIE_SECURE: process.env.NODE_ENV === 'production',
  COOKIE_SAME_SITE: 'lax' as const,
  MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;
