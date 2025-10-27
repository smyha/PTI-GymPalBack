/**
 * Logger Configuration
 * Centralized logging using Pino for high-performance structured logging
 */

import pino from 'pino';
import { env } from '../config/env.js';

// Log levels
export const LOG_LEVELS = {
  FATAL: 'fatal',
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace',
} as const;

export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

// Standardized logger configuration for all environments
const createLoggerConfig = () => {
  return {
    level: env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: string) => ({ level: label }),
    },
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        singleLine: false,
        hideObject: false,
      },
    },
  };
};

// Create the main logger instance
export const logger = pino(createLoggerConfig());


// Child loggers for different modules
export const createChildLogger = (module: string, context?: Record<string, any>) => {
  return logger.child({ module, ...context });
};

// Specialized loggers for different parts of the application
export const authLogger = createChildLogger('auth');
export const apiLogger = createChildLogger('api');
export const dbLogger = createChildLogger('database');
export const emailLogger = createChildLogger('email');
export const securityLogger = createChildLogger('security');

// Simplified logging utilities
export const logRequest = (req: any, res: any, duration: number) => {
  apiLogger.info({
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration,
  }, 'Request completed');
};

export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error({
    err: error,
    ...context,
  }, error.message);
};

export const logPerformance = (operation: string, duration: number, metadata?: Record<string, any>) => {
  logger.info({
    operation,
    duration,
    ...metadata,
  }, `Performance: ${operation} took ${duration}ms`);
};

// Auth-specific logging functions
export const logAuthAttempt = (email: string, success: boolean, context?: Record<string, any>) => {
  authLogger.info({
    email,
    success,
    ...context,
  }, `Auth attempt: ${success ? 'successful' : 'failed'}`);
};

export const logTokenRefresh = (userId: string, success: boolean, context?: Record<string, any>) => {
  authLogger.info({
    userId,
    success,
    ...context,
  }, `Token refresh: ${success ? 'successful' : 'failed'}`);
};

// Email-specific logging functions
export const logEmailSent = (to: string, subject: string, template?: string) => {
  emailLogger.info({
    to,
    subject,
    template,
  }, 'Email sent successfully');
};

export const logEmailError = (to: string, subject: string, error: Error) => {
  emailLogger.error({
    to,
    subject,
    error: error.message,
  }, 'Email sending failed');
};

// Export default logger
export default logger;
