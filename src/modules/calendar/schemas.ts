import { z } from 'zod';

export const calendarSchemas = {
  addWorkout: z.object({
    workout_id: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),

  getCalendar: z.object({
    month: z.string().optional(),
    year: z.string().optional(),
  }),
  updateScheduled: z.object({
    scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: z.string().optional(),
  }),
};

export type AddWorkoutRequest = z.infer<typeof calendarSchemas.addWorkout>;
export type UpdateScheduledRequest = z.infer<typeof calendarSchemas.updateScheduled>;
