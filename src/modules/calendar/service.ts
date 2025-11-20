/**
 * Calendar Service
 * Handles scheduling and retrieval of user scheduled workouts
 */
import { supabase } from '../../core/config/database.js';
import { AppError, ErrorCode } from '../../core/utils/error-types.js';

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export const calendarService = {
  async addWorkout(userId: string, workoutId: string, dateStr: string) {
    // Validate workout exists
    const { data: workout, error: wErr } = await supabase.from('workouts').select('id,user_id,name').eq('id', workoutId).single();
    if (wErr || !workout) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Workout not found');
    }

    // Insert scheduled_workout
    const payload = {
      user_id: userId,
      workout_id: workoutId,
      scheduled_date: dateStr,
    } as any;

    const { data, error } = await supabase.from('scheduled_workouts').insert(payload).select('*').single();

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to schedule workout: ${error.message}`);
    }

    return data;
  },

  async getCalendar(userId: string, month?: string, year?: string) {
    // If month & year provided, compute start/end of month
    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      if (Number.isNaN(m) || Number.isNaN(y) || m < 1 || m > 12) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid month/year');
      }
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0); // last day of month

      const startIso = toISODate(start);
      const endIso = toISODate(end);

      const { data, error } = await supabase
        .from('scheduled_workouts')
        .select('*, workouts(*)')
        .eq('user_id', userId)
        .gte('scheduled_date', startIso)
        .lte('scheduled_date', endIso)
        .order('scheduled_date', { ascending: true });

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, error.message);
      return data || [];
    }

    // Default: return future scheduled items (next 365 days)
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 365);

    const { data, error } = await supabase
      .from('scheduled_workouts')
      .select('*, workouts(*)')
      .eq('user_id', userId)
      .gte('scheduled_date', toISODate(today))
      .lte('scheduled_date', toISODate(future))
      .order('scheduled_date', { ascending: true });

    if (error) throw new AppError(ErrorCode.DATABASE_ERROR, error.message);
    return data || [];
  },

  async updateScheduled(id: string, userId: string, updates: { scheduled_date?: string; status?: string }) {
    const payload: any = {};
    if (updates.scheduled_date) payload.scheduled_date = updates.scheduled_date;
    if (updates.status) payload.status = updates.status;

    const { data, error } = await (supabase.from('scheduled_workouts') as any)
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw new AppError(ErrorCode.DATABASE_ERROR, error.message);
    if (!data) throw new AppError(ErrorCode.NOT_FOUND, 'Scheduled item not found');
    return data;
  },

  async deleteScheduled(id: string, userId: string) {
    const { error } = await supabase.from('scheduled_workouts').delete().eq('id', id).eq('user_id', userId);
    if (error) throw new AppError(ErrorCode.DATABASE_ERROR, error.message);
    return true;
  },
};
