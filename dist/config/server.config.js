/**
 * Server Configuration
 *
 * Centralized server configuration and constants
 */
import { env } from './env.js';
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
