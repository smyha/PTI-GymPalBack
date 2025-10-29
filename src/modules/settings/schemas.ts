import { z } from 'zod';

export const settingsSchemas = {
  update: z.object({
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    language: z.string().min(2).max(5).optional(),
    timezone: z.string().optional(),
  }),
  updateNotifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
  }),
  updatePrivacy: z.object({
    profileVisibility: z.enum(['public', 'friends', 'private']).optional(),
    workoutVisibility: z.enum(['public', 'friends', 'private']).optional(),
    showStats: z.boolean().optional(),
  }),
} as const;

