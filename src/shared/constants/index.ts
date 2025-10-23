// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const;

// API Messages
export const API_MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  VALIDATION_ERROR: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Resource conflict',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  INTERNAL_ERROR: 'Internal server error',
  BAD_REQUEST: 'Bad request',
  INVALID_CREDENTIALS: 'Invalid credentials',
  TOKEN_EXPIRED: 'Token expired',
  TOKEN_INVALID: 'Invalid token',
  USER_NOT_FOUND: 'User not found',
  WORKOUT_NOT_FOUND: 'Workout not found',
  POST_NOT_FOUND: 'Post not found',
  COMMENT_NOT_FOUND: 'Comment not found',
  ROUTINE_NOT_FOUND: 'Routine not found',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  USERNAME_ALREADY_EXISTS: 'Username already exists',
  PASSWORD_TOO_WEAK: 'Password is too weak',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PASSWORD: 'Invalid password format',
  ACCOUNT_LOCKED: 'Account is locked',
  ACCOUNT_DISABLED: 'Account is disabled',
  EMAIL_NOT_VERIFIED: 'Email not verified',
  INVALID_RESET_TOKEN: 'Invalid or expired reset token',
  RESET_TOKEN_EXPIRED: 'Reset token has expired',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',
  EMAIL_SENT: 'Email sent successfully',
  WELCOME_EMAIL_SENT: 'Welcome email sent',
  PASSWORD_CHANGED: 'Password changed successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  WORKOUT_CREATED: 'Workout created successfully',
  WORKOUT_UPDATED: 'Workout updated successfully',
  WORKOUT_DELETED: 'Workout deleted successfully',
  POST_CREATED: 'Post created successfully',
  POST_UPDATED: 'Post updated successfully',
  POST_DELETED: 'Post deleted successfully',
  COMMENT_CREATED: 'Comment created successfully',
  COMMENT_UPDATED: 'Comment updated successfully',
  COMMENT_DELETED: 'Comment deleted successfully',
  LIKE_ADDED: 'Like added successfully',
  LIKE_REMOVED: 'Like removed successfully',
  FOLLOW_ADDED: 'Follow added successfully',
  FOLLOW_REMOVED: 'Follow removed successfully',
  ROUTINE_CREATED: 'Routine created successfully',
  ROUTINE_UPDATED: 'Routine updated successfully',
  ROUTINE_DELETED: 'Routine deleted successfully',
  SESSION_STARTED: 'Workout session started',
  SESSION_COMPLETED: 'Workout session completed',
  SESSION_UPDATED: 'Workout session updated',
  GOAL_CREATED: 'Goal created successfully',
  GOAL_UPDATED: 'Goal updated successfully',
  GOAL_DELETED: 'Goal deleted successfully',
  ACHIEVEMENT_UNLOCKED: 'Achievement unlocked',
  NOTIFICATION_SENT: 'Notification sent successfully',
  SETTINGS_UPDATED: 'Settings updated successfully',
  DATA_EXPORTED: 'Data exported successfully',
  DATA_IMPORTED: 'Data imported successfully'
} as const;

// Error Codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  WORKOUT_NOT_FOUND: 'WORKOUT_NOT_FOUND',
  POST_NOT_FOUND: 'POST_NOT_FOUND',
  COMMENT_NOT_FOUND: 'COMMENT_NOT_FOUND',
  ROUTINE_NOT_FOUND: 'ROUTINE_NOT_FOUND',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS: 'USERNAME_ALREADY_EXISTS',
  PASSWORD_TOO_WEAK: 'PASSWORD_TOO_WEAK',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  INVALID_RESET_TOKEN: 'INVALID_RESET_TOKEN',
  RESET_TOKEN_EXPIRED: 'RESET_TOKEN_EXPIRED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  EMAIL_SEND_ERROR: 'EMAIL_SEND_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  RESOURCE_LIMIT_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  DEPENDENCY_NOT_FOUND: 'DEPENDENCY_NOT_FOUND',
  INVALID_OPERATION: 'INVALID_OPERATION',
  TIMEOUT: 'TIMEOUT',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  CORS_ERROR: 'CORS_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_EXISTS: 'RESOURCE_EXISTS',
  RESOURCE_IN_USE: 'RESOURCE_IN_USE',
  MAINTENANCE_MODE: 'MAINTENANCE_MODE'
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1
} as const;

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400 // 24 hours
} as const;

// Rate limiting
export const RATE_LIMITS = {
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_ATTEMPTS: 5
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  UPLOAD: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_UPLOADS: 10
  }
} as const;

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
  MAX_IMAGES_PER_POST: 5,
  MAX_VIDEOS_PER_POST: 1
} as const;

// Validation rules
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: false
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    ALLOWED_CHARS: /^[a-zA-Z0-9_-]+$/
  },
  EMAIL: {
    MAX_LENGTH: 254
  },
  WORKOUT_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100
  },
  POST_CONTENT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 1000
  },
  COMMENT_CONTENT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 500
  }
} as const;

// Database constraints
export const DB_CONSTRAINTS = {
  USERS: {
    MAX_WORKOUTS: 1000,
    MAX_POSTS: 10000,
    MAX_FOLLOWERS: 10000,
    MAX_FOLLOWING: 5000
  },
  WORKOUTS: {
    MAX_EXERCISES: 50,
    MAX_DURATION: 300, // 5 hours in minutes
    MAX_SESSIONS: 10000
  },
  POSTS: {
    MAX_LIKES: 100000,
    MAX_COMMENTS: 10000,
    MAX_SHARES: 10000
  }
} as const;

// Feature flags
export const FEATURES = {
  AI_RECOMMENDATIONS: true,
  SOCIAL_FEATURES: true,
  WORKOUT_PLANS: true,
  ACHIEVEMENTS: true,
  NOTIFICATIONS: true,
  EMAIL_NOTIFICATIONS: true,
  PUSH_NOTIFICATIONS: false,
  ANALYTICS: true,
  EXPORT_DATA: true,
  IMPORT_DATA: true,
  BETA_FEATURES: false
} as const;

// Environment types
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test'
} as const;

// Log levels
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace'
} as const;

// API versions
export const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2'
} as const;

// Default values
export const DEFAULTS = {
  FITNESS_LEVEL: 'beginner',
  ACTIVITY_LEVEL: 'moderate',
  TIMEZONE: 'UTC',
  LANGUAGE: 'en',
  THEME: 'light',
  NOTIFICATIONS: {
    EMAIL: true,
    PUSH: false,
    SMS: false
  },
  PRIVACY: {
    PROFILE_PUBLIC: true,
    WORKOUTS_PUBLIC: false,
    POSTS_PUBLIC: true,
    SHOW_EMAIL: false,
    SHOW_PHONE: false
  }
} as const;
