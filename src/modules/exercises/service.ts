/**
 * Exercise Service
 * Business logic layer for exercise management operations
 */

import { insertRow, selectRow, selectRows, updateRow } from '../../core/config/database-helpers.js';
import { supabase } from '../../core/config/database.js';
import { AppError, ErrorCode } from '../../core/utils/error-types.js';
import type * as Unified from '../../core/types/unified.types.js';
import type { CreateExerciseData, UpdateExerciseData, ExerciseFilters } from './types.js';

/**
 * Helper function to map exercise row to Unified.Exercise
 */
function mapExerciseRowToExercise(row: any): Unified.Exercise {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    muscle_group: row.muscle_group,
    muscle_groups: row.muscle_group ? [row.muscle_group] : [],
    equipment: row.equipment || [],
    difficulty: row.difficulty || 'beginner',
    instructions: row.instructions,
    video_url: row.video_url,
    image_url: row.image_url,
    tags: row.tags || [],
    is_public: row.is_public || false,
    created_by: row.user_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const exerciseService = {
  /**
   * Gets exercise categories
   */
  async getCategories(): Promise<string[]> {
    // Return static categories for now
    // In production, these could be fetched from database
    const categories = [
      'Strength Training',
      'Cardio',
      'Flexibility',
      'Balance',
      'Sports',
      'Yoga',
      'Pilates',
      'HIIT',
      'CrossFit',
      'Swimming',
    ];

    return categories;
  },

  /**
   * Gets muscle groups
   */
  async getMuscleGroups(): Promise<string[]> {
    // Return static muscle groups for now
    // In production, these could be fetched from database
    const groups = [
      'Chest',
      'Back',
      'Shoulders',
      'Biceps',
      'Triceps',
      'Forearms',
      'Abs',
      'Obliques',
      'Legs',
      'Glutes',
      'Hamstrings',
      'Quadriceps',
      'Calves',
    ];

    return groups;
  },

  /**
   * Gets equipment types
   */
  async getEquipmentTypes(): Promise<string[]> {
    const { data, error } = await supabase.from('exercises').select('equipment');

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get equipment types: ${error.message}`);
    }

    const equipmentSet = new Set<string>();
    (data || []).forEach((exercise: any) => {
      if (Array.isArray(exercise.equipment)) {
        exercise.equipment.forEach((eq: string) => equipmentSet.add(eq));
      } else if (exercise.equipment) {
        equipmentSet.add(exercise.equipment);
      }
    });

    return Array.from(equipmentSet);
  },

  /**
   * Creates a new exercise
   */
  async create(userId: string, data: CreateExerciseData): Promise<Unified.Exercise> {
    const exerciseData: any = {
      user_id: userId,
      name: data.name,
      description: data.description,
      muscle_group: data.muscle_group,
      equipment: Array.isArray(data.equipment) ? data.equipment : data.equipment ? [data.equipment] : [],
      difficulty: data.difficulty,
      tags: data.tags || [],
      is_public: data.is_public || false,
    };

    const { data: exercise, error } = await insertRow('exercises', exerciseData);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to create exercise: ${error.message}`);
    }

    if (!exercise) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create exercise');
    }

    return mapExerciseRowToExercise(exercise);
  },

  /**
   * Finds multiple exercises with filters
   */
  async findMany(userId: string, filters: ExerciseFilters): Promise<Unified.Exercise[]> {
    const { page = 1, limit = 20, search, muscle_group, equipment, difficulty } = filters;
    const offset = (page - 1) * limit;

    // Get public exercises and user exercises separately, then combine
    // This avoids issues with OR queries when user_id might be null for system exercises
    const [publicExercisesResult, userExercisesResult] = await Promise.all([
      supabase
        .from('exercises')
        .select('*')
        .eq('is_public', true),
      supabase
        .from('exercises')
        .select('*')
        .eq('user_id', userId),
    ]);

    if (publicExercisesResult.error && userExercisesResult.error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get exercises: ${publicExercisesResult.error.message}`);
    }

    // Combine exercises, removing duplicates (user exercises that are also public)
    const publicExercises = publicExercisesResult.data || [];
    const userExercises = (userExercisesResult.data || []).filter(
      (e: any) => !e.is_public // Only include user exercises that aren't public
    );
    let combined = [...publicExercises, ...userExercises];

    // Apply filters
    if (search) {
      combined = combined.filter((e: any) =>
        e.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (muscle_group) {
      combined = combined.filter((e: any) => {
        // Check muscle_group column
        if (e.muscle_group === muscle_group) return true;
        
        // Check muscle_groups array column
        if (Array.isArray(e.muscle_groups)) {
           // Check if array contains exact match
           if (e.muscle_groups.includes(muscle_group)) return true;
           
           // Check if any element in array contains the muscle group string (partial match)
           // This handles cases like "chest, triceps" stored as single string in array or similar variants
           if (e.muscle_groups.some((mg: string) => mg.toLowerCase().includes(muscle_group.toLowerCase()))) return true;
        }
        
        return false;
      });
    }

    if (equipment) {
      combined = combined.filter((e: any) =>
        Array.isArray(e.equipment) ? e.equipment.includes(equipment) : e.equipment === equipment
      );
    }

    if (difficulty) {
      combined = combined.filter((e: any) => e.difficulty === difficulty);
    }

    // Sort by created_at descending
    combined.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    // Apply pagination
    const paginated = combined.slice(offset, offset + limit);

    return paginated.map(mapExerciseRowToExercise);
  },

  /**
   * Finds an exercise by ID
   */
  async findById(id: string, userId: string): Promise<Unified.Exercise | null> {
    const { data, error } = await selectRow('exercises', (q) =>
      q.eq('id', id).or(`user_id.eq.${userId},is_public.eq.true`)
    );

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get exercise: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return mapExerciseRowToExercise(data);
  },

  /**
   * Updates an exercise
   */
  async update(id: string, userId: string, data: UpdateExerciseData): Promise<Unified.Exercise> {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.muscle_group !== undefined) updateData.muscle_group = data.muscle_group;
    if (data.equipment !== undefined)
      updateData.equipment = Array.isArray(data.equipment) ? data.equipment : [data.equipment];
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.is_public !== undefined) updateData.is_public = data.is_public;

    const { data: updated, error } = await updateRow('exercises', updateData, (q) =>
      q.eq('id', id).eq('user_id', userId)
    );

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to update exercise: ${error.message}`);
    }

    if (!updated) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Exercise not found or access denied');
    }

    return mapExerciseRowToExercise(updated);
  },

  /**
   * Deletes an exercise
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const { error } = await supabase.from('exercises').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to delete exercise: ${error.message}`);
    }

    return true;
  },
};

