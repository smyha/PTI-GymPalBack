import { z } from 'zod';

export const dashboardSchemas = {
  overview: z.object({
    date: z.string().optional(),
  }),
  stats: z.object({
    period: z.enum(['week', 'month', 'year', 'all']).default('month'),
    include_social: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
    date: z.string().optional(),
  }),
  activity: z.object({
    limit: z.string().transform(Number).default('10'),
    offset: z.string().transform(Number).default('0'),
  }),
  progress: z.object({
    period: z.enum(['week', 'month', 'year']).default('month'),
  }),
} as const;

