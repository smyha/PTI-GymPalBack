/**
 * Workout Service
 * Business logic layer for workout management operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { insertRow, selectRow, selectRows, updateRow } from '../../core/config/database-helpers.js';
import { supabase, supabaseAdmin } from '../../core/config/database.js';
import { logger } from '../../core/config/logger.js';
import { AppError, ErrorCode } from '../../core/utils/error-types.js';
import type * as Unified from '../../core/types/unified.types.js';
import type { CreateWorkoutData, UpdateWorkoutData, WorkoutFilters } from './types.js';

/**
 * Helper function to map workout row to unified Workout type
 */
function mapWorkoutRowToWorkout(row: any): Unified.Workout {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    type: row.type,
    difficulty: row.difficulty || 'beginner',
    duration_minutes: row.duration_minutes || row.duration || 0,
    is_template: row.is_template || false,
    is_public: row.is_public || false,
    is_shared: row.is_shared || false,
    target_goal: row.target_goal,
    target_level: row.target_level,
    days_per_week: row.days_per_week,
    equipment_required: row.equipment_required || [],
    user_notes: row.user_notes,
    tags: row.tags || [],
    share_count: row.share_count || 0,
    like_count: row.like_count || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    exercises: row.exercises,
  };
}

export const workoutService = {
  /**
   * Creates a new workout with exercises
   */
  async create(userId: string, data: CreateWorkoutData, dbClient?: SupabaseClient): Promise<Unified.Workout> {
    const workoutData: any = {
      user_id: userId,
      name: data.name,
      description: data.description || null,
      type: data.type || null,
      duration_minutes: data.duration_minutes || 60,
      difficulty: data.difficulty || 'beginner',
      is_template: data.is_template || false,
      is_public: data.is_public || false,
      target_goal: data.target_goal || null,
      target_level: data.target_level || null,
      days_per_week: data.days_per_week || null,
      equipment_required: data.equipment_required || [],
      user_notes: data.user_notes || null,
      tags: data.tags || [],
    };

    // Use provided client (authenticated) or admin client as fallback
    const client = dbClient || supabaseAdmin;

    const { data: workout, error } = await client
      .from('workouts')
      .insert(workoutData as any)
      .select()
      .single();

    if (error) {
      // Log detailed database error
      console.error('Database Error creating workout:', JSON.stringify(error, null, 2));
      console.error('Payload:', JSON.stringify(workoutData, null, 2));
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to create workout: ${error.message || error.details || 'Unknown DB error'}`);
    }

    if (!workout) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create workout');
    }

    // Insert exercises if provided
    if (data.exercises && data.exercises.length > 0) {
      const workoutAny = workout as any;
      for (let i = 0; i < data.exercises.length; i++) {
        const ex = data.exercises[i];
        const exerciseData: any = {
          workout_id: workoutAny.id,
          exercise_id: ex.exercise_id,
          order_index: i,
          sets: ex.sets,
          reps: ex.reps,
          weight_kg: ex.weight || null, // Use weight_kg column name
          rest_seconds: 60, // Default rest time
        };

        const { error: exerciseError } = await client
          .from('workout_exercises')
          .insert(exerciseData as any);

        if (exerciseError) {
          console.error('Database Error adding exercise:', JSON.stringify(exerciseError, null, 2));
          throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to add exercise to workout: ${exerciseError.message}`);
        }
      }
    }

    return mapWorkoutRowToWorkout(workout);
  },

  /**
   * Finds multiple workouts with filters
   */
  async findMany(userId: string, filters: WorkoutFilters, dbClient?: SupabaseClient): Promise<Unified.PaginatedList<Unified.Workout>> {
    const { page = 1, limit = 20, search, difficulty } = filters;
    const offset = (page - 1) * limit;

    // Use provided client (authenticated) or admin client as fallback
    const client = dbClient || supabaseAdmin;

    // Build query for counting total records
    let countQuery = client
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (search) {
      countQuery = countQuery.ilike('name', `%${search}%`);
    }

    if (difficulty) {
      countQuery = countQuery.eq('difficulty', difficulty);
    }

    // Get total count
    const { count: total, error: countError } = await countQuery;

    if (countError) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to count workouts: ${countError.message}`);
    }

    // Build query for fetching data with exercises
    let query = client
      .from('workouts')
      .select(`
        *,
        workout_exercises(
          *,
          exercise:exercises(*)
        )
      `)
      .eq('user_id', userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get workouts: ${error.message}`);
    }

    const workouts = (data || []).map((row: any) => {
      const workout = mapWorkoutRowToWorkout(row);
      // Add exercises if present
      if (row.workout_exercises && Array.isArray(row.workout_exercises)) {
        workout.exercises = row.workout_exercises
          .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
          .map((we: any) => ({
            id: we.id,
            workout_id: we.workout_id,
            exercise_id: we.exercise_id,
            order_index: we.order_index,
            sets: we.sets,
            reps: we.reps,
            weight_kg: we.weight_kg,
            rest_seconds: we.rest_seconds,
            notes: we.notes,
            exercise: we.exercise,
          }));
      }
      return workout;
    });

    const totalRecords = total || 0;
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      data: workouts,
      pagination: {
        page,
        limit,
        total: totalRecords,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    };
  },

  /**
   * Finds a workout by ID
   */
  async findById(id: string, userId: string, dbClient?: SupabaseClient): Promise<Unified.Workout | null> {
    // Use provided client (authenticated) or default supabase client (which might be anon)
    // Ideally, we should use the authenticated client passed from the handler to respect RLS
    const client = dbClient || supabase;

    // Fetch workout with its related exercises
    // Allow fetching workouts that are either:
    // 1. Owned by the current user (user_id = userId)
    // 2. Public workouts (is_public = true)
    // This allows users to view public workouts from other users (e.g., from social posts)
    const { data: workout, error: workoutError } = await client
      .from('workouts')
      .select(`
        *,
        workout_exercises(
          *,
          exercise:exercises(*)
        )
      `)
      .eq('id', id)
      .or(`user_id.eq.${userId},is_public.eq.true`)
      .single();

    if (workoutError) {
      if (workoutError.code === 'PGRST116') {
        // No row found
        return null;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get workout: ${workoutError.message}`);
    }

    if (!workout) {
      return null;
    }

    // Transform workout with exercises
    const workoutAny = workout as any;
    const mappedWorkout = mapWorkoutRowToWorkout(workoutAny);
    if (workoutAny.workout_exercises) {
      mappedWorkout.exercises = (workoutAny.workout_exercises as any[])
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .map((we: any) => ({
          id: we.id,
          workout_id: we.workout_id,
          exercise_id: we.exercise_id,
          order_index: we.order_index,
          sets: we.sets,
          reps: we.reps,
          weight_kg: we.weight_kg,
          rest_seconds: we.rest_seconds,
          notes: we.notes,
          exercise: we.exercise,
        }));
    }

    return mappedWorkout;
  },

  /**
   * Updates a workout
   * Also handles updating exercises if provided
   */
  async update(id: string, userId: string, data: UpdateWorkoutData, dbClient?: SupabaseClient): Promise<Unified.Workout> {
    const client = dbClient || supabaseAdmin;
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.duration_minutes !== undefined) updateData.duration_minutes = data.duration_minutes;
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.is_public !== undefined) updateData.is_public = data.is_public;
    if (data.is_template !== undefined) updateData.is_template = data.is_template;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.target_goal !== undefined) updateData.target_goal = data.target_goal;
    if (data.target_level !== undefined) updateData.target_level = data.target_level;
    if (data.days_per_week !== undefined) updateData.days_per_week = data.days_per_week;
    if (data.equipment_required !== undefined) updateData.equipment_required = data.equipment_required;
    if (data.user_notes !== undefined) updateData.user_notes = data.user_notes;

    // First verify ownership
    const { data: existingWorkout, error: fetchError } = await client
      .from('workouts')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new AppError(ErrorCode.NOT_FOUND, 'Workout not found');
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to verify workout: ${fetchError.message}`);
    }

    if (!existingWorkout) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Workout not found');
    }

    if (existingWorkout.user_id !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, 'You can only update your own workouts');
    }

    // Update workout metadata
    const { data: updated, error } = await client
      .from('workouts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to update workout: ${error.message}`);
    }

    if (!updated) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Workout not found or access denied');
    }

    // Update exercises if provided
    if (data.exercises && Array.isArray(data.exercises)) {
      // Delete existing exercises
      const { error: deleteError } = await client
        .from('workout_exercises')
        .delete()
        .eq('workout_id', id);

      if (deleteError) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to delete existing exercises: ${deleteError.message}`);
      }

      // Insert new exercises
      if (data.exercises.length > 0) {
        for (let i = 0; i < data.exercises.length; i++) {
          const ex = data.exercises[i];
          const exerciseData: any = {
            workout_id: id,
            exercise_id: ex.exercise_id,
            order_index: i,
            sets: ex.sets,
            reps: ex.reps,
            weight_kg: ex.weight || null,
            rest_seconds: 60, // Default rest time
          };

          const { error: exerciseError } = await client
            .from('workout_exercises')
            .insert(exerciseData as any);

          if (exerciseError) {
            console.error('Database Error adding exercise:', JSON.stringify(exerciseError, null, 2));
            throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to add exercise to workout: ${exerciseError.message}`);
          }
        }
      }
    }

    // Fetch updated workout with exercises
    const { data: finalWorkout, error: finalError } = await client
      .from('workouts')
      .select(`
        *,
        workout_exercises (
          *,
          exercise:exercises (*)
        )
      `)
      .eq('id', id)
      .single();

    if (finalError) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to fetch updated workout: ${finalError.message}`);
    }

    return mapWorkoutRowToWorkout(finalWorkout);
  },

  /**
   * Deletes a workout
   * Only the owner (creator) can delete their workout
   */
  async delete(id: string, userId: string, dbClient?: SupabaseClient): Promise<boolean> {
    const client = dbClient || supabaseAdmin;
    
    // First, verify that the workout exists and belongs to the user
    const { data: workout, error: fetchError } = await client
      .from('workouts')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // Workout not found
        return false;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to verify workout: ${fetchError.message}`);
    }

    if (!workout) {
      return false;
    }

    // Verify ownership - only the creator can delete
    if (workout.user_id !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, 'You can only delete your own workouts');
    }

    // Delete the workout
    const { error } = await client.from('workouts').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to delete workout: ${error.message}`);
    }

    return true;
  },

  /**
   * Copies an existing workout (creates a new one for the current user)
   * Used to allow users to copy workouts shared in the social feed
   */
  async copyWorkoutForUser(userId: string, sourceWorkoutId: string): Promise<Unified.Workout> {
    // Use RPC to bypass RLS if admin client is not configured with service role
    const { data: sourceWorkouts, error: fetchError } = await supabaseAdmin
      .rpc('get_workout_by_id', { p_id: sourceWorkoutId }) as any;
    
    if (fetchError) {
         throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to fetch source workout: ${fetchError.message}`);
    }

    const sourceWorkout = Array.isArray(sourceWorkouts) ? sourceWorkouts[0] : sourceWorkouts;

    if (!sourceWorkout) {
      throw new AppError(ErrorCode.NOT_FOUND, `Source workout not found. It might have been deleted or you don't have permission to view it.`);
    }

    // Create a copy with the current user as owner
    const copiedWorkoutData: any = {
      user_id: userId,
      name: `${sourceWorkout.name} (Copy)`,
      description: sourceWorkout.description,
      type: sourceWorkout.type,
      duration_minutes: sourceWorkout.duration_minutes,
      difficulty: sourceWorkout.difficulty,
      tags: sourceWorkout.tags || [],
      is_public: false, // Copies are private by default
      is_template: false,
      equipment_required: sourceWorkout.equipment_required || [],
    };

    const { data: newWorkout, error: createError } = await insertRow('workouts', copiedWorkoutData);

    if (createError || !newWorkout) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to copy workout: ${createError?.message || 'Unknown error'}`);
    }

    // Get workout exercises to copy them using RPC
    try {
      const { data: exercises, error: exercisesError } = await supabaseAdmin
        .rpc('get_workout_exercises_by_workout_id', { p_workout_id: sourceWorkoutId }) as any;

      if (exercisesError) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to fetch workout exercises: ${exercisesError.message}`);
      }

      if (exercises && Array.isArray(exercises) && exercises.length > 0) {
        // Use supabaseAdmin to insert exercises (bypasses RLS)
        for (const exercise of exercises) {
          const { error: insertError } = await supabaseAdmin
            .from('workout_exercises')
            .insert({
              workout_id: (newWorkout as any).id,
              exercise_id: exercise.exercise_id,
              sets: exercise.sets,
              reps: exercise.reps,
              weight_kg: exercise.weight_kg,
              order_index: exercise.order_index,
              rest_seconds: exercise.rest_seconds,
              notes: exercise.notes,
            } as any);

          if (insertError) {
            throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to copy exercise: ${insertError.message}`);
          }
        }
      }
    } catch (err: any) {
      // If it's an AppError, re-throw it
      if (err.code) {
        throw err;
      }
      // Otherwise, wrap it in an AppError
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to copy workout exercises: ${err.message || 'Unknown error'}`);
    }

    return mapWorkoutRowToWorkout(newWorkout);
  },

  /**
   * Get workout count for a user (total created workouts)
   */
  async getUserWorkoutCount(userId: string): Promise<number> {
    // Use RPC to get accurate count regardless of visibility/RLS
    const { data: count, error } = await supabaseAdmin
      .rpc('count_user_workouts', { p_user_id: userId }) as any;

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get workout count: ${error.message}`);
    }

    return count || 0;
  },

  /**
   * Get completed workout counts by period (week, month, year, all)
   * Counts workouts from scheduled_workouts with status='completed'
   */
  async getCompletedWorkoutCounts(userId: string, period: 'week' | 'month' | 'year' | 'all', dbClient?: SupabaseClient, referenceDate?: string): Promise<number> {
    const client = dbClient || supabase;
    const now = referenceDate ? new Date(referenceDate) : new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        // Start of current week (Monday)
        startDate = new Date(now);
        const day = startDate.getDay() || 7;
        if (day !== 1) {
          startDate.setDate(startDate.getDate() - day + 1);
        }
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'all':
        startDate = new Date(0); // All time
        break;
      default:
        startDate = new Date(0);
    }

    // Count completed scheduled workouts in period
    let query = client
      .from('scheduled_workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (period !== 'all') {
      query = query.gte('scheduled_date', startDate.toISOString().split('T')[0]);
    }

    const { count, error } = await query;

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get completed workout count: ${error.message}`);
    }

    return count || 0;
  },

  /**
   * Get completed exercise counts by period (week, month, year, all)
   * Counts exercises from workout_exercises of completed scheduled_workouts
   */
  async getCompletedExerciseCounts(userId: string, period: 'week' | 'month' | 'year' | 'all', dbClient?: SupabaseClient, referenceDate?: string): Promise<number> {
    const client = dbClient || supabase;
    const now = referenceDate ? new Date(referenceDate) : new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        // Start of current week (Monday)
        startDate = new Date(now);
        const day = startDate.getDay() || 7;
        if (day !== 1) {
          startDate.setDate(startDate.getDate() - day + 1);
        }
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'all':
        startDate = new Date(0); // All time
        break;
      default:
        startDate = new Date(0);
    }

    // Get completed scheduled workouts in period
    let scheduledQuery = client
      .from('scheduled_workouts')
      .select('workout_id')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (period !== 'all') {
      scheduledQuery = scheduledQuery.gte('scheduled_date', startDate.toISOString().split('T')[0]);
    }

    const { data: completedScheduled, error: scheduledError } = await scheduledQuery;

    if (scheduledError) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get completed scheduled workouts: ${scheduledError.message}`);
    }

    if (!completedScheduled || completedScheduled.length === 0) {
      return 0;
    }

    // Get unique workout IDs
    const workoutIds = [...new Set(completedScheduled.map((sw: any) => sw.workout_id))];

    // Count exercises from these workouts
    const { count, error } = await client
      .from('workout_exercises')
      .select('*', { count: 'exact', head: true })
      .in('workout_id', workoutIds);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get completed exercise count: ${error.message}`);
    }

    return count || 0;
  },

  /**
   * Get current streak (consecutive days with scheduled workouts)
   * Counts days backwards from today where user has scheduled workouts
   */
  async getCurrentStreak(userId: string, dbClient?: SupabaseClient, referenceDate?: string): Promise<number> {
    const client = dbClient || supabase;
    const now = referenceDate ? new Date(referenceDate) : new Date();
    const todayStr = referenceDate || now.toISOString().split('T')[0];

    // Get all scheduled workouts (any status) ordered by date descending
    const { data: scheduledWorkouts, error } = await client
      .from('scheduled_workouts')
      .select('scheduled_date')
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: false });

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get scheduled workouts: ${error.message}`);
    }

    if (!scheduledWorkouts || scheduledWorkouts.length === 0) {
      return 0;
    }

    // Get distinct dates and convert to Date objects for easier comparison
    const distinctDatesSet = new Set(scheduledWorkouts.map((sw: any) => sw.scheduled_date));
    const distinctDates = Array.from(distinctDatesSet).sort().reverse(); // Most recent first

    // Calculate streak: count consecutive days backwards from today
    let streak = 0;
    let currentDate = new Date(now);
    currentDate.setHours(0, 0, 0, 0);

    // Check if today or yesterday has a scheduled workout to start the streak
    const todayDateStr = currentDate.toISOString().split('T')[0];
    const yesterdayDate = new Date(currentDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayDateStr = yesterdayDate.toISOString().split('T')[0];

    // Start counting from today or yesterday if today has no workout
    let checkDate = distinctDatesSet.has(todayDateStr) 
      ? new Date(todayDateStr)
      : (distinctDatesSet.has(yesterdayDateStr) ? new Date(yesterdayDateStr) : null);

    if (!checkDate) {
      return 0; // No workout today or yesterday, streak is 0
    }

    // Count consecutive days backwards
    while (checkDate) {
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      if (distinctDatesSet.has(checkDateStr)) {
        streak++;
        // Move to previous day
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Streak broken
        break;
      }
    }

    return streak;
  },

  /**
   * Create exercise set logs (batch)
   */
  async createSetLogs(userId: string, logs: any[], dbClient?: SupabaseClient): Promise<any[]> {
    const client = dbClient || supabaseAdmin;
    
    // Validate that user owns the session or scheduled workout
    for (const log of logs) {
      if (log.workout_session_id) {
        const { data: session } = await selectRow('workout_sessions', log.workout_session_id, client);
        if (!session || session.user_id !== userId) {
          throw new AppError(ErrorCode.FORBIDDEN, 'You do not have permission to log sets for this session');
        }
      }
      if (log.scheduled_workout_id) {
        const { data: scheduled } = await selectRow('scheduled_workouts', log.scheduled_workout_id, client);
        if (!scheduled || scheduled.user_id !== userId) {
          throw new AppError(ErrorCode.FORBIDDEN, 'You do not have permission to log sets for this scheduled workout');
        }
      }
    }

    const createdLogs = [];
    for (const log of logs) {
      // Use client directly since exercise_set_logs is not in the TypeScript types yet
      const { data, error } = await (client as any)
        .from('exercise_set_logs')
        .insert(log)
        .select()
        .single();
      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to create set log: ${error.message}`);
      createdLogs.push(data);
    }

    return createdLogs;
  },

  /**
   * Get set logs for a workout session or scheduled workout
   */
  async getSetLogs(sessionId?: string, scheduledWorkoutId?: string, dbClient?: SupabaseClient): Promise<any[]> {
    const client = dbClient || supabaseAdmin;
    
    // Use client directly since exercise_set_logs is not in the TypeScript types yet
    let query = (client as any).from('exercise_set_logs').select('*');
    
    if (sessionId) {
      query = query.eq('workout_session_id', sessionId);
    } else if (scheduledWorkoutId) {
      query = query.eq('scheduled_workout_id', scheduledWorkoutId);
    } else {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Either session_id or scheduled_workout_id must be provided');
    }

    const { data, error } = await query.order('set_number', { ascending: true });
    
    if (error) throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get set logs: ${error.message}`);
    return data || [];
  },

  /**
   * Get progress statistics for charts
   */
  async getProgressStats(userId: string, period: 'week' | 'month' | 'year' | 'all' = 'month', exerciseId?: string, dbClient?: SupabaseClient): Promise<any> {
    const client = dbClient || supabaseAdmin;
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get workout sessions for the user in the period
    let sessionsQuery = client
      .from('workout_sessions')
      .select('id, started_at')
      .eq('user_id', userId);
    
    if (period !== 'all') {
      sessionsQuery = sessionsQuery.gte('started_at', startDate.toISOString());
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;
    if (sessionsError) throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get sessions: ${sessionsError.message}`);

    // Get completed scheduled workouts for the user in the period
    let scheduledQuery = client
      .from('scheduled_workouts')
      .select('id, scheduled_date, created_at')
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    if (period !== 'all') {
      scheduledQuery = scheduledQuery.gte('scheduled_date', startDate.toISOString().split('T')[0]);
    }

    const { data: scheduledWorkouts, error: scheduledError } = await scheduledQuery;
    if (scheduledError) throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get scheduled workouts: ${scheduledError.message}`);

    const sessionIds = (sessions || []).map(s => s.id);
    const scheduledIds = (scheduledWorkouts || []).map(s => s.id);

    // Get set logs from both workout_sessions and scheduled_workouts
    // use client directly since exercise_set_logs is not in the TypeScript types yet
    let logs: any[] = [];
    
    if (sessionIds.length > 0) {
      let sessionLogsQuery = (client as any)
        .from('exercise_set_logs')
        .select('*, exercise:exercises(name)')
        .in('workout_session_id', sessionIds);
      
      if (exerciseId) {
        sessionLogsQuery = sessionLogsQuery.eq('exercise_id', exerciseId);
      }
      
      const { data: sessionLogs, error: sessionLogsError } = await sessionLogsQuery;
      if (sessionLogsError) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get session logs: ${sessionLogsError.message}`);
      }
      if (sessionLogs) logs = logs.concat(sessionLogs);
    }
    
    if (scheduledIds.length > 0) {
      let scheduledLogsQuery = (client as any)
        .from('exercise_set_logs')
        .select('*, exercise:exercises(name)')
        .in('scheduled_workout_id', scheduledIds);
      
      if (exerciseId) {
        scheduledLogsQuery = scheduledLogsQuery.eq('exercise_id', exerciseId);
      }
      
      const { data: scheduledLogs, error: scheduledLogsError } = await scheduledLogsQuery;
      if (scheduledLogsError) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get scheduled workout logs: ${scheduledLogsError.message}`);
      }
      if (scheduledLogs) logs = logs.concat(scheduledLogs);
    }

    // Group by week/month for workouts count - combine sessions and scheduled workouts
    const workoutsByPeriod: Record<string, number> = {};
    
    // Add sessions
    (sessions || []).forEach(session => {
      // Validate started_at is not null before creating Date
      if (!session.started_at) return;
      const date = new Date(session.started_at);
      const key = period === 'week' 
        ? `${date.getFullYear()}-W${String(getWeekNumber(date)).padStart(2, '0')}`
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      workoutsByPeriod[key] = (workoutsByPeriod[key] || 0) + 1;
    });
    
    // Add scheduled workouts (use scheduled_date or created_at as fallback)
    (scheduledWorkouts || []).forEach(scheduled => {
      const dateStr = scheduled.scheduled_date || scheduled.created_at;
      if (!dateStr) return;
      // Handle both date strings and timestamps
      const date = typeof dateStr === 'string' ? new Date(dateStr) : new Date(dateStr);
      if (isNaN(date.getTime())) return; // Skip invalid dates
      const key = period === 'week' 
        ? `${date.getFullYear()}-W${String(getWeekNumber(date)).padStart(2, '0')}`
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      workoutsByPeriod[key] = (workoutsByPeriod[key] || 0) + 1;
    });

    // Group weight progression by exercise and date
    const weightProgression: Record<string, any[]> = {};
    (logs || []).forEach((log: any) => {
      const exerciseName = log.exercise?.name || log.exercise_id;
      if (!weightProgression[exerciseName]) {
        weightProgression[exerciseName] = [];
      }
      const date = new Date(log.created_at);
      const key = period === 'week'
        ? `${date.getFullYear()}-W${getWeekNumber(date)}`
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const existing = weightProgression[exerciseName].find(e => e.date === key);
      if (existing) {
        existing.weight = Math.max(existing.weight, parseFloat(log.weight_kg) || 0);
        existing.reps = Math.max(existing.reps, log.reps_completed || 0);
      } else {
        weightProgression[exerciseName].push({
          date: key,
          weight: parseFloat(log.weight_kg) || 0,
          reps: log.reps_completed || 0,
        });
      }
    });

    // Sort by date
    Object.keys(weightProgression).forEach(exercise => {
      weightProgression[exercise].sort((a, b) => a.date.localeCompare(b.date));
    });

    // Sort workoutsByPeriod by date for proper chart display
    const sortedWorkoutsByPeriod = Object.entries(workoutsByPeriod)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      workoutsByPeriod: sortedWorkoutsByPeriod,
      weightProgression,
    };
  },
};

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

