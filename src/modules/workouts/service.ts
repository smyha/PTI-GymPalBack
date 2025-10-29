/**
 * Workout Service
 * Business logic layer for workout management operations
 */

import { insertRow, selectRow, selectRows, updateRow } from '../../core/config/database-helpers.js';
import { supabase } from '../../core/config/database.js';
import type { CreateWorkoutData, UpdateWorkoutData, WorkoutFilters, Workout } from './types.js';

/**
 * Helper function to map workout row to Workout
 */
function mapWorkoutRowToWorkout(row: any): Workout {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    duration: row.duration,
    difficulty: row.difficulty,
    exercises: row.exercises || [],
    tags: row.tags || [],
    is_public: row.is_public || false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const workoutService = {
  /**
   * Creates a new workout
   */
  async create(userId: string, data: CreateWorkoutData): Promise<Workout> {
    const workoutData: any = {
      user_id: userId,
      name: data.name,
      description: data.description,
      duration: data.duration,
      difficulty: data.difficulty,
      tags: data.tags || [],
      is_public: data.is_public || false,
    };

    const { data: workout, error } = await insertRow('workouts', workoutData);

    if (error) {
      throw new Error(`Failed to create workout: ${error.message}`);
    }

    if (!workout) {
      throw new Error('Failed to create workout');
    }

    return mapWorkoutRowToWorkout(workout);
  },

  /**
   * Finds multiple workouts with filters
   */
  async findMany(userId: string, filters: WorkoutFilters): Promise<Workout[]> {
    const { page = 1, limit = 20, search, difficulty } = filters;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('workouts')
      .select('*')
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
      throw new Error(`Failed to get workouts: ${error.message}`);
    }

    return (data || []).map(mapWorkoutRowToWorkout);
  },

  /**
   * Finds a workout by ID
   */
  async findById(id: string, userId: string): Promise<Workout | null> {
    const { data, error } = await selectRow('workouts', (q) => q.eq('id', id).eq('user_id', userId));

    if (error) {
      throw new Error(`Failed to get workout: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return mapWorkoutRowToWorkout(data);
  },

  /**
   * Updates a workout
   */
  async update(id: string, userId: string, data: UpdateWorkoutData): Promise<Workout> {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.is_public !== undefined) updateData.is_public = data.is_public;

    const { data: updated, error } = await updateRow('workouts', updateData, (q) =>
      q.eq('id', id).eq('user_id', userId)
    );

    if (error) {
      throw new Error(`Failed to update workout: ${error.message}`);
    }

    if (!updated) {
      throw new Error('Workout not found or access denied');
    }

    return mapWorkoutRowToWorkout(updated);
  },

  /**
   * Deletes a workout
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const { error } = await supabase.from('workouts').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete workout: ${error.message}`);
    }

    return true;
  },
};

