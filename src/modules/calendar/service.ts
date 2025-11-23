/**
 * Calendar Service
 * Handles scheduling and retrieval of user scheduled workouts
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../../core/config/database.js';
import { AppError, ErrorCode } from '../../core/utils/error-types.js';

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export const calendarService = {
  async addWorkout(userId: string, workoutId: string, dateStr: string, annotations?: string | null, dbClient?: SupabaseClient) {
    // Use provided client or admin client to ensure visibility
    // Ideally use authenticated client to check user's access, but admin allows cross-checks if needed
    const client = dbClient || supabaseAdmin;

    // Validate workout exists (bypass RLS if using admin, or respect it if using auth client)
    const { data: workout, error: wErr } = await client.from('workouts').select('id,user_id,name').eq('id', workoutId).single();
    
    if (wErr || !workout) {
      // Try finding it with admin if it failed with normal client (e.g. public workout logic might differ)
      // But generally, if we use the proper client, it should work.
      throw new AppError(ErrorCode.NOT_FOUND, 'Workout not found');
    }

    // Insert scheduled_workout
    const payload = {
      user_id: userId,
      workout_id: workoutId,
      scheduled_date: dateStr,
      annotations: annotations === '' || annotations === null || annotations === undefined ? null : annotations,
    } as any;

    const { data, error } = await client.from('scheduled_workouts').insert(payload).select('*').single();

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to schedule workout: ${error.message}`);
    }

    return data;
  },

  async getCalendar(userId: string, month?: string, year?: string, dbClient?: SupabaseClient) {
    const client = dbClient || supabase;
    
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

      const { data, error } = await client
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

    const { data, error } = await client
      .from('scheduled_workouts')
      .select('*, workouts(*)')
      .eq('user_id', userId)
      .gte('scheduled_date', toISODate(today))
      .lte('scheduled_date', toISODate(future))
      .order('scheduled_date', { ascending: true });

    if (error) throw new AppError(ErrorCode.DATABASE_ERROR, error.message);
    return data || [];
  },

  async updateScheduled(id: string, userId: string, updates: { scheduled_date?: string; status?: string; annotations?: string | null }, dbClient?: SupabaseClient) {
    const client = dbClient || supabase;
    const payload: any = {};
    if (updates.scheduled_date) payload.scheduled_date = updates.scheduled_date;
    if (updates.status) payload.status = updates.status;
    // Handle annotations: if undefined, don't update; if null or empty string, set to null
    if (updates.annotations !== undefined) {
      payload.annotations = updates.annotations === '' || updates.annotations === null ? null : updates.annotations;
    }

    const { data, error } = await client
      .from('scheduled_workouts')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw new AppError(ErrorCode.DATABASE_ERROR, error.message);
    if (!data) throw new AppError(ErrorCode.NOT_FOUND, 'Scheduled item not found');
    return data;
  },

  async deleteScheduled(id: string, userId: string, dbClient?: SupabaseClient) {
    const client = dbClient || supabase;
    const { error } = await client.from('scheduled_workouts').delete().eq('id', id).eq('user_id', userId);
    if (error) throw new AppError(ErrorCode.DATABASE_ERROR, error.message);
    return true;
  },
};
