import pino from 'pino';
import { env } from './env.js';

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

// Create logger configuration
const createLoggerConfig = () => {
  const config: pino.LoggerOptions = {
    level: env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: string) => ({ level: label }),
    },
  };

  // Add pretty printing in development
  if (env.NODE_ENV === 'development') {
    config.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        singleLine: false,
        hideObject: false,
      },
    };
  }

  return config;
};

// Create the main logger instance
export const logger = pino(createLoggerConfig());

// Child loggers for different modules
export const createLogger = (context: string) => logger.child({ context });

// Specialized loggers
export const authLogger = createLogger('auth');
export const apiLogger = createLogger('api');
export const dbLogger = createLogger('database');
export const emailLogger = createLogger('email');

// Logging utilities
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error({
    err: error,
    ...context,
  }, error.message);
};

export default logger;

