/**
 * Server Configuration
 * 
 * Centralized server configuration and constants
 */

import { env } from './env.js';

export const SERVER_CONFIG = {
  port: parseInt(env.PORT),
  host: '0.0.0.0',
  environment: env.NODE_ENV,
  
  // API Configuration
  api: {
    version: 'v1',
    basePath: '/api',
    prefix: '/api/v1',
  },
  
  // Documentation
  docs: {
    enabled: true,
    path: '/reference',
    openApiPath: '/openapi.json',
    title: 'GymPal API Documentation',
    version: '1.0.0',
  },
  
  // Health Check
  health: {
    path: '/health',
    enabled: true,
  },
  
  // CORS
  cors: {
    origins: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
    credentials: env.CORS_CREDENTIALS,
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS),
  },
  
  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRY,
  },
  
  // Supabase
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceKey: env.SUPABASE_SERVICE_KEY,
  },
  
  // Email (SMTP)
  email: {
    enabled: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ? parseInt(env.SMTP_PORT) : 587,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
} as const;

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

