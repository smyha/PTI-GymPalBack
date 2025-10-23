import { Context } from 'hono';
import { supabase } from '../config/supabase.js';
import { sendSuccess, sendError, sendNotFound, sendValidationError, sendConflict } from '../shared/utils/response.js';
import { API_MESSAGES, ERROR_CODES } from '../shared/constants/index.js';

// Create a new routine
export async function createRoutine(c: Context, body: any) {
  try {
    const userId = c.get('userId');
    const { name, description, difficulty, workouts, tags, is_public, schedule } = body;

    // Validate difficulty
    const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return sendValidationError(c, ['Invalid difficulty level']);
    }

    // Validate workouts
    if (workouts && Array.isArray(workouts)) {
      for (const workout of workouts) {
        if (!workout.workout_id || !workout.day_of_week) {
          return sendValidationError(c, ['Each workout must have workout_id and day_of_week']);
        }
        if (workout.day_of_week < 0 || workout.day_of_week > 6) {
          return sendValidationError(c, ['Day of week must be between 0 and 6']);
        }
      }
    }

    // Validate schedule
    if (schedule) {
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const scheduleDays = Object.keys(schedule);
      const invalidDays = scheduleDays.filter(day => !validDays.includes(day));
      if (invalidDays.length > 0) {
        return sendValidationError(c, [`Invalid schedule days: ${invalidDays.join(', ')}`]);
      }
    }

    // Create routine
    const { data: routine, error } = await supabase
      .from('routines')
      .insert({
        user_id: userId,
        name,
        description,
        difficulty,
        workouts,
        tags,
        is_public: is_public || false,
        schedule,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to create routine', 500, error.message);
    }

    return sendSuccess(c, routine, API_MESSAGES.CREATED);

  } catch (error: any) {
    console.error('Create routine error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get routine by ID
export async function getRoutine(c: Context, routineId: string) {
  try {
    const { data: routine, error } = await supabase
      .from('routines')
      .select(`
        *,
        profiles!routines_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .eq('id', routineId)
      .single();

    if (error || !routine) {
      return sendNotFound(c, API_MESSAGES.ROUTINE_NOT_FOUND);
    }

    return sendSuccess(c, routine, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get routine error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Update routine
export async function updateRoutine(c: Context, routineId: string, body: any) {
  try {
    const userId = c.get('userId');
    const { name, description, difficulty, workouts, tags, is_public, schedule } = body;

    // Check if routine exists and belongs to user
    const { data: existingRoutine, error: checkError } = await supabase
      .from('routines')
      .select('user_id')
      .eq('id', routineId)
      .single();

    if (checkError || !existingRoutine) {
      return sendNotFound(c, API_MESSAGES.ROUTINE_NOT_FOUND);
    }

    if (existingRoutine.user_id !== userId) {
      return sendError(c, ERROR_CODES.FORBIDDEN, 'Not authorized to update this routine', 403);
    }

    // Validate difficulty
    const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return sendValidationError(c, ['Invalid difficulty level']);
    }

    // Update routine
    const { data: routine, error } = await supabase
      .from('routines')
      .update({
        name,
        description,
        difficulty,
        workouts,
        tags,
        is_public,
        schedule,
        updated_at: new Date().toISOString()
      })
      .eq('id', routineId)
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to update routine', 500, error.message);
    }

    return sendSuccess(c, routine, API_MESSAGES.UPDATED);

  } catch (error: any) {
    console.error('Update routine error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Delete routine
export async function deleteRoutine(c: Context, routineId: string) {
  try {
    const userId = c.get('userId');

    // Check if routine exists and belongs to user
    const { data: existingRoutine, error: checkError } = await supabase
      .from('routines')
      .select('user_id')
      .eq('id', routineId)
      .single();

    if (checkError || !existingRoutine) {
      return sendNotFound(c, API_MESSAGES.ROUTINE_NOT_FOUND);
    }

    if (existingRoutine.user_id !== userId) {
      return sendError(c, ERROR_CODES.FORBIDDEN, 'Not authorized to delete this routine', 403);
    }

    // Delete routine
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', routineId);

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to delete routine', 500, error.message);
    }

    return sendSuccess(c, null, API_MESSAGES.DELETED);

  } catch (error: any) {
    console.error('Delete routine error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get user routines
export async function getUserRoutines(c: Context, userId: string, limit: number = 20, offset: number = 0) {
  try {
    const { data: routines, error } = await supabase
      .from('routines')
      .select(`
        *,
        profiles!routines_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .eq('user_id', userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to get routines', 500, error.message);
    }

    return sendSuccess(c, routines, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get user routines error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get public routines
export async function getPublicRoutines(c: Context, limit: number = 20, offset: number = 0, difficulty?: string, tags?: string[]) {
  try {
    let query = supabase
      .from('routines')
      .select(`
        *,
        profiles!routines_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .eq('is_public', true)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Filter by difficulty
    if (difficulty) {
      const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
      if (!validDifficulties.includes(difficulty)) {
        return sendValidationError(c, ['Invalid difficulty level']);
      }
      query = query.eq('difficulty', difficulty);
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      query = query.overlaps('tags', tags);
    }

    const { data: routines, error } = await query;

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to get public routines', 500, error.message);
    }

    return sendSuccess(c, routines, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get public routines error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Search routines
export async function searchRoutines(c: Context, query: string, limit: number = 20, offset: number = 0) {
  try {
    const { data: routines, error } = await supabase
      .from('routines')
      .select(`
        *,
        profiles!routines_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_public', true)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to search routines', 500, error.message);
    }

    return sendSuccess(c, routines, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Search routines error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Like routine
export async function likeRoutine(c: Context, routineId: string) {
  try {
    const userId = c.get('userId');

    // Check if routine exists
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .select('id')
      .eq('id', routineId)
      .single();

    if (routineError || !routine) {
      return sendNotFound(c, API_MESSAGES.ROUTINE_NOT_FOUND);
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('routine_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('routine_id', routineId)
      .single();

    if (existingLike) {
      return sendConflict(c, 'Routine already liked');
    }

    // Create like
    const { data: like, error } = await supabase
      .from('routine_likes')
      .insert({
        user_id: userId,
        routine_id: routineId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to like routine', 500, error.message);
    }

    return sendSuccess(c, like, 'Routine liked successfully');

  } catch (error: any) {
    console.error('Like routine error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Unlike routine
export async function unlikeRoutine(c: Context, routineId: string) {
  try {
    const userId = c.get('userId');

    // Remove like
    const { error } = await supabase
      .from('routine_likes')
      .delete()
      .eq('user_id', userId)
      .eq('routine_id', routineId);

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to unlike routine', 500, error.message);
    }

    return sendSuccess(c, null, 'Routine unliked successfully');

  } catch (error: any) {
    console.error('Unlike routine error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get routine likes
export async function getRoutineLikes(c: Context, routineId: string, limit: number = 20, offset: number = 0) {
  try {
    const { data: likes, error } = await supabase
      .from('routine_likes')
      .select(`
        *,
        profiles!routine_likes_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .eq('routine_id', routineId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to get routine likes', 500, error.message);
    }

    return sendSuccess(c, likes, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get routine likes error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get routine statistics
export async function getRoutineStats(c: Context, routineId: string) {
  try {
    // Get routine
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .select('id, name, user_id')
      .eq('id', routineId)
      .single();

    if (routineError || !routine) {
      return sendNotFound(c, API_MESSAGES.ROUTINE_NOT_FOUND);
    }

    // Get like count
    const { count: likeCount } = await supabase
      .from('routine_likes')
      .select('*', { count: 'exact', head: true })
      .eq('routine_id', routineId);

    // Get comment count
    const { count: commentCount } = await supabase
      .from('routine_comments')
      .select('*', { count: 'exact', head: true })
      .eq('routine_id', routineId);

    // Get completion count
    const { count: completionCount } = await supabase
      .from('routine_completions')
      .select('*', { count: 'exact', head: true })
      .eq('routine_id', routineId);

    const stats = {
      likes: likeCount || 0,
      comments: commentCount || 0,
      completions: completionCount || 0
    };

    return sendSuccess(c, stats, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get routine stats error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Start routine
export async function startRoutine(c: Context, routineId: string) {
  try {
    const userId = c.get('userId');

    // Check if routine exists
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .select('id, name, user_id')
      .eq('id', routineId)
      .single();

    if (routineError || !routine) {
      return sendNotFound(c, API_MESSAGES.ROUTINE_NOT_FOUND);
    }

    // Check if already started
    const { data: existingStart } = await supabase
      .from('routine_starts')
      .select('id')
      .eq('user_id', userId)
      .eq('routine_id', routineId)
      .eq('status', 'active')
      .single();

    if (existingStart) {
      return sendConflict(c, 'Routine already started');
    }

    // Create routine start
    const { data: routineStart, error } = await supabase
      .from('routine_starts')
      .insert({
        user_id: userId,
        routine_id: routineId,
        status: 'active',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to start routine', 500, error.message);
    }

    return sendSuccess(c, routineStart, 'Routine started successfully');

  } catch (error: any) {
    console.error('Start routine error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Complete routine
export async function completeRoutine(c: Context, routineId: string) {
  try {
    const userId = c.get('userId');

    // Check if routine is started
    const { data: routineStart, error: routineStartError } = await supabase
      .from('routine_starts')
      .select('id, status')
      .eq('user_id', userId)
      .eq('routine_id', routineId)
      .eq('status', 'active')
      .single();

    if (routineStartError || !routineStart) {
      return sendNotFound(c, 'Routine not started');
    }

    // Update routine start status
    const { error: updateError } = await supabase
      .from('routine_starts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', routineStart.id);

    if (updateError) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to complete routine', 500, updateError.message);
    }

    // Create routine completion
    const { data: completion, error } = await supabase
      .from('routine_completions')
      .insert({
        user_id: userId,
        routine_id: routineId,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to record completion', 500, error.message);
    }

    return sendSuccess(c, completion, 'Routine completed successfully');

  } catch (error: any) {
    console.error('Complete routine error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// List routines
export async function listRoutines(c: Context, query: any = {}) {
  try {
    const userId = c.get('userId');
    const { page = 1, limit = 20, difficulty } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let queryBuilder = supabase
      .from('routines')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (difficulty) {
      queryBuilder = queryBuilder.eq('difficulty', difficulty);
    }

    const { data: routines, error, count } = await queryBuilder
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to list routines', 500, error.message);
    }

    return sendSuccess(c, routines, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('List routines error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Share routine
export async function shareRoutine(c: Context, routineId: string, body: any) {
  try {
    const { data: routine, error } = await supabase
      .from('routines')
      .update({ is_public: true, shared_at: new Date().toISOString() })
      .eq('id', routineId)
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to share routine', 500, error.message);
    }

    return sendSuccess(c, routine, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Share routine error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Use routine (alias for startRoutine)
export async function useRoutine(c: Context, routineId: string) {
  return startRoutine(c, routineId);
}

// Duplicate routine
export async function duplicateRoutine(c: Context, routineId: string, body: any) {
  try {
    const userId = c.get('userId');

    // Get original routine
    const { data: originalRoutine, error: fetchError } = await supabase
      .from('routines')
      .select('*')
      .eq('id', routineId)
      .single();

    if (fetchError) {
      return sendNotFound(c, 'Routine not found');
    }

    // Create duplicate
    const { data: duplicateRoutine, error: createError } = await supabase
      .from('routines')
      .insert({
        user_id: userId,
        name: `${originalRoutine.name} (Copy)`,
        description: originalRoutine.description,
        difficulty: originalRoutine.difficulty,
        duration_weeks: originalRoutine.duration_weeks,
        days_per_week: originalRoutine.days_per_week,
        is_public: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to duplicate routine', 500, createError.message);
    }

    return sendSuccess(c, duplicateRoutine, API_MESSAGES.ROUTINE_CREATED, 201);

  } catch (error: any) {
    console.error('Duplicate routine error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get routine exercises
export async function getRoutineExercises(c: Context, routineId: string) {
  try {
    const { data: exercises, error } = await supabase
      .from('routine_workouts')
      .select('*')
      .eq('routine_id', routineId)
      .order('day_of_week', { ascending: true });

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to fetch routine exercises', 500, error.message);
    }

    return sendSuccess(c, exercises, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get routine exercises error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Add exercise to routine
export async function addExerciseToRoutine(c: Context, routineId: string, body: any) {
  try {
    const { data: exercise, error } = await supabase
      .from('routine_workouts')
      .insert({
        routine_id: routineId,
        ...body
      })
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to add exercise to routine', 500, error.message);
    }

    return sendSuccess(c, exercise, API_MESSAGES.CREATED, 201);

  } catch (error: any) {
    console.error('Add exercise to routine error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Update routine exercise
export async function updateRoutineExercise(c: Context, routineId: string, exerciseId: string, body: any) {
  try {
    const { data: exercise, error } = await supabase
      .from('routine_workouts')
      .update(body)
      .eq('routine_id', routineId)
      .eq('id', exerciseId)
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to update routine exercise', 500, error.message);
    }

    return sendSuccess(c, exercise, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Update routine exercise error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Remove exercise from routine
export async function removeExerciseFromRoutine(c: Context, routineId: string, exerciseId: string) {
  try {
    const { error } = await supabase
      .from('routine_workouts')
      .delete()
      .eq('routine_id', routineId)
      .eq('id', exerciseId);

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to remove exercise from routine', 500, error.message);
    }

    return sendSuccess(c, null, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Remove exercise from routine error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get routine categories
export async function getRoutineCategories(c: Context) {
  try {
    const categories = [
      { id: 'strength', name: 'Strength Training' },
      { id: 'cardio', name: 'Cardio' },
      { id: 'flexibility', name: 'Flexibility' },
      { id: 'sports', name: 'Sports' },
      { id: 'other', name: 'Other' }
    ];

    return sendSuccess(c, categories, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get routine categories error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get trending routines
export async function getTrendingRoutines(c: Context, query: any = {}) {
  try {
    const { page = 1, limit = 20 } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data: routines, error, count } = await supabase
      .from('routines')
      .select('*', { count: 'exact' })
      .eq('is_public', true)
      .order('likes_count', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to get trending routines', 500, error.message);
    }

    return sendSuccess(c, routines, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get trending routines error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}