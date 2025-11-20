import { Context } from 'hono';
import { calendarService } from './service.js';
import { calendarSchemas, AddWorkoutRequest, UpdateScheduledRequest } from './schemas.js';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../../core/utils/response.js';
import { logger } from '../../core/config/logger.js';
import { getUserFromCtx } from '../../core/utils/context.js';

export const calendarHandlers = {
  async addWorkout(c: Context) {
    const user = getUserFromCtx(c);
    const data = c.get('validated') as AddWorkoutRequest;

    try {
      const scheduled: any = await calendarService.addWorkout(user.id, data.workout_id, data.date);
      logger.info({ userId: user.id, workoutId: data.workout_id, date: data.date }, 'Workout scheduled');
      // Return a consistent AddWorkoutResponse shape
      const payload = {
        workoutId: scheduled.workout_id || scheduled.workoutId || data.workout_id,
        date: scheduled.scheduled_date || data.date,
        id: scheduled.id,
      } as any;
      return sendCreated(c, payload);
    } catch (err: any) {
      logger.error({ err, userId: user.id }, 'Failed to schedule workout');
      return sendError(c, 'BAD_REQUEST', err.message || 'Failed to schedule workout', 400);
    }
  },

  async getCalendar(c: Context) {
    const user = getUserFromCtx(c);
    const { month, year } = c.get('validated') as { month?: string; year?: string };

    try {
      const data = await calendarService.getCalendar(user.id, month, year);

      // Map scheduled_workouts rows into CalendarResponse.days
      const days = (data || []).map((row: any) => ({
        id: row.id,
        date: row.scheduled_date || row.date,
        hasWorkout: true,
        status: row.status || 'scheduled',
        workoutId: row.workout_id || row.workouts?.id,
        workoutName: row.workouts?.name || null,
        exerciseCount: Array.isArray(row.workouts?.exercises) ? row.workouts.exercises.length : undefined,
      }));

      const resp: any = {
        month: month ? Number(month) : undefined,
        year: year ? Number(year) : undefined,
        days,
      };

      return sendSuccess(c, resp);
    } catch (err: any) {
      logger.error({ err, userId: user.id }, 'Failed to get calendar data');
      return sendError(c, 'BAD_REQUEST', err.message || 'Failed to get calendar data', 400);
    }
  },

  async updateScheduled(c: Context) {
    const user = getUserFromCtx(c);
    const id = c.req.param('id');
    const data = c.get('validated') as UpdateScheduledRequest;

    try {
      const updated = await calendarService.updateScheduled(id, user.id, data as any);
      return sendSuccess(c, updated);
    } catch (err: any) {
      logger.error({ err, userId: user.id, id }, 'Failed to update scheduled item');
      if (err.message?.includes('not found')) return sendNotFound(c, 'Scheduled item');
      return sendError(c, 'BAD_REQUEST', err.message || 'Failed to update scheduled item', 400);
    }
  },

  async deleteScheduled(c: Context) {
    const user = getUserFromCtx(c);
    const id = c.req.param('id');

    try {
      await calendarService.deleteScheduled(id, user.id);
      return sendSuccess(c, { deleted: true });
    } catch (err: any) {
      logger.error({ err, userId: user.id, id }, 'Failed to delete scheduled item');
      return sendError(c, 'BAD_REQUEST', err.message || 'Failed to delete scheduled item', 400);
    }
  },
};
