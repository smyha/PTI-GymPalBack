/**
 * Workout Service
 * Business logic layer for workout management operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { insertRow, selectRow, selectRows, updateRow } from '../../core/config/database-helpers.js';
import { supabase, supabaseAdmin } from '../../core/config/database.js';
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
   */
  async update(id: string, userId: string, data: UpdateWorkoutData): Promise<Unified.Workout> {
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

    const { data: updated, error } = await updateRow('workouts', updateData, (q) =>
      q.eq('id', id).eq('user_id', userId)
    );

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to update workout: ${error.message}`);
    }

    if (!updated) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Workout not found or access denied');
    }

    return mapWorkoutRowToWorkout(updated);
  },

  /**
   * Deletes a workout
   */
  async delete(id: string, userId: string, dbClient?: SupabaseClient): Promise<boolean> {
    const client = dbClient || supabaseAdmin;
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
};

