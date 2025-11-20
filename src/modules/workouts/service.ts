/**
 * Workout Service
 * Business logic layer for workout management operations
 */

import { insertRow, selectRow, selectRows, updateRow } from '../../core/config/database-helpers.js';
import { supabase } from '../../core/config/database.js';
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
  async create(userId: string, data: CreateWorkoutData): Promise<Unified.Workout> {
    const workoutData: any = {
      user_id: userId,
      name: data.name,
      description: data.description,
      type: data.type,
      duration_minutes: data.duration_minutes,
      difficulty: data.difficulty || 'beginner',
      is_template: data.is_template || false,
      is_public: data.is_public || false,
      target_goal: data.target_goal,
      target_level: data.target_level,
      days_per_week: data.days_per_week,
      equipment_required: data.equipment_required || [],
      user_notes: data.user_notes,
      tags: data.tags || [],
    };

    const { data: workout, error } = await insertRow('workouts', workoutData);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to create workout: ${error.message}`);
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

        const { error: exerciseError } = await supabase
          .from('workout_exercises')
          .insert(exerciseData);

        if (exerciseError) {
          throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to add exercise to workout: ${exerciseError.message}`);
        }
      }
    }

    return mapWorkoutRowToWorkout(workout);
  },

  /**
   * Finds multiple workouts with filters
   */
  async findMany(userId: string, filters: WorkoutFilters): Promise<Unified.PaginatedList<Unified.Workout>> {
    const { page = 1, limit = 20, search, difficulty } = filters;
    const offset = (page - 1) * limit;

    // Build query for counting total records
    let countQuery = supabase
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
    let query = supabase
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
  async findById(id: string, userId: string): Promise<Unified.Workout | null> {
    // Fetch workout with its related exercises
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises(
          *,
          exercise:exercises(*)
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
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
  async delete(id: string, userId: string): Promise<boolean> {
    const { error } = await supabase.from('workouts').delete().eq('id', id).eq('user_id', userId);

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
    // Get the source workout with proper typing
    const { data: sourceWorkout, error: fetchError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', sourceWorkoutId)
      .single() as any;

    if (fetchError || !sourceWorkout) {
      throw new AppError(ErrorCode.NOT_FOUND, `Source workout not found: ${fetchError?.message || 'Unknown error'}`);
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

    // Get workout exercises to copy them
    try {
      const { data: exercises, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_id', sourceWorkoutId) as any;

      if (!exercisesError && exercises && Array.isArray(exercises) && exercises.length > 0) {
        for (const exercise of exercises) {
          await supabase.from('workout_exercises').insert({
            workout_id: (newWorkout as any).id,
            exercise_id: exercise.exercise_id,
            sets: exercise.sets,
            reps: exercise.reps,
            weight_kg: exercise.weight_kg,
            order_index: exercise.order_index,
            rest_seconds: exercise.rest_seconds,
            notes: exercise.notes,
          } as any);
        }
      }
    } catch (err) {
      // Don't fail the whole operation if exercises fail
    }

    return mapWorkoutRowToWorkout(newWorkout);
  },
};

