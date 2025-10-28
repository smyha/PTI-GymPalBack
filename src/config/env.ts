import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });
// dotenv.config({ path: '.env.dev' });
dotenv.config();

const envSchema = z.object({
  // Supabase Configuration
  SUPABASE_URL: z.string().url().default('https://your-project.supabase.co'),
  SUPABASE_ANON_KEY: z.string().min(1).default('your-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('your-service-role-key'),
  SUPABASE_JWT_SECRET: z.string().min(1).default('your-jwt-secret'),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32).default('your-jwt-secret-minimum-32-characters-long'),
  JWT_EXPIRY: z.string().default('7d'),
  
  // Server Configuration
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database Configuration
  POSTGRES_URL: z.string().optional(),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_HOST: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DATABASE: z.string().optional(),
  POSTGRES_PRISMA_URL: z.string().optional(),
  POSTGRES_URL_NON_POOLING: z.string().optional(),
  
  // Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // CORS Configuration
  // Set CORS_ORIGIN to your frontend URL(s) in production (comma-separated for multiple origins)
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  // CORS_CREDENTIALS should be 'false' in production unless you specifically need cookies/auth headers
  CORS_CREDENTIALS: z.coerce.boolean().default(true),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  
  // Additional Configuration
  LOG_LEVEL: z.string().default('info'),
  FRONTEND_URL: z.string().optional()
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;

// Helper functions
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

export const corsOrigins = env.CORS_ORIGIN.split(',').map((origin: string) => origin.trim());
export const corsCredentials = env.CORS_CREDENTIALS;