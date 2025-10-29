import { z } from 'zod';

export const authSchemas = {
  register: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
    full_name: z.string().min(1).max(100),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
    terms_accepted: z.boolean().refine(val => val === true, { message: 'Terms must be accepted' }),
    privacy_policy_accepted: z.boolean().refine(val => val === true, { message: 'Privacy policy must be accepted' }),
    bio: z.string().max(500).optional(),
    avatar_url: z.string().url().optional(),
    fitness_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    timezone: z.string().optional(),
    language: z.string().min(2).max(5).optional(),
  }),

  login: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),

  refresh: z.object({
    refresh_token: z.string().min(1, 'Refresh token is required'),
  }),

  resetPassword: z.object({
    token: z.string().min(1, 'Token is required'),
    new_password: z.string().min(8, 'New password must be at least 8 characters'),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),

  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
} as const;

