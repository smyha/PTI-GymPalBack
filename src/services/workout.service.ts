import { Context } from 'hono';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { sendSuccess, sendError, sendNotFound, sendValidationError, sendConflict } from '../shared/utils/response.js';
import { API_MESSAGES, ERROR_CODES } from '../shared/constants/index.js';

// Create a new workout
export async function createWorkout(c: Context, body: any) {
  try {
    const userId = c.get('userId');
    const { name, description, duration, difficulty, exercises, tags, is_public } = body;

    // Validate difficulty
    const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return sendValidationError(c, ['Invalid difficulty level']);
    }

    // Validate duration
    if (duration && (duration < 1 || duration > 600)) {
      return sendValidationError(c, [ 'Duration must be between 1 and 600 minutes']);
    }

    // Validate exercises
    if (exercises && Array.isArray(exercises)) {
      for (const exercise of exercises) {
        if (!exercise.exercise_id || !exercise.sets || !exercise.reps) {
          return sendValidationError(c, [ 'Each exercise must have exercise_id, sets, and reps']);
        }
        if (exercise.sets < 1 || exercise.sets > 50) {
          return sendValidationError(c, [ 'Sets must be between 1 and 50']);
        }
        if (exercise.reps < 1 || exercise.reps > 1000) {
          return sendValidationError(c, [ 'Reps must be between 1 and 1000']);
        }
      }
    }

    // Create workout
    const { data: workout, error } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        name,
        description,
        duration,
        difficulty,
        exercises,
        tags,
        is_public: is_public || false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to create workout', 500, error.message);
    }

    return sendSuccess(c, workout, API_MESSAGES.CREATED);

  } catch (error: any) {
    console.error('Create workout error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get workout by ID
export async function getWorkout(c: Context, workoutId: string) {
  try {
    const { data: workout, error } = await supabase
      .from('workouts')
      .select(`
        *,
        profiles!workouts_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .eq('id', workoutId)
      .single();

    if (error || !workout) {
      return sendNotFound(c, API_MESSAGES.WORKOUT_NOT_FOUND);
    }

    return sendSuccess(c, workout, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get workout error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Update workout
export async function updateWorkout(c: Context, workoutId: string, body: any) {
  try {
    const userId = c.get('userId');
    const { name, description, duration, difficulty, exercises, tags, is_public } = body;

    // Check if workout exists and belongs to user
    const { data: existingWorkout, error: checkError } = await supabase
      .from('workouts')
      .select('user_id')
      .eq('id', workoutId)
      .single();

    if (checkError || !existingWorkout) {
      return sendNotFound(c, API_MESSAGES.WORKOUT_NOT_FOUND);
    }

    if (existingWorkout.user_id !== userId) {
      return sendError(c, ERROR_CODES.FORBIDDEN, 'Not authorized to update this workout', 403);
    }

    // Validate difficulty
    const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return sendValidationError(c, ['Invalid difficulty level']);
    }

    // Validate duration
    if (duration && (duration < 1 || duration > 600)) {
      return sendValidationError(c, [ 'Duration must be between 1 and 600 minutes']);
    }

    // Update workout
    const { data: workout, error } = await supabase
      .from('workouts')
      .update({
        name,
        description,
        duration,
        difficulty,
        exercises,
        tags,
        is_public,
        updated_at: new Date().toISOString()
      })
      .eq('id', workoutId)
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to update workout', 500, error.message);
    }

    return sendSuccess(c, workout, API_MESSAGES.UPDATED);

  } catch (error: any) {
    console.error('Update workout error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Delete workout
export async function deleteWorkout(c: Context, workoutId: string) {
  try {
    const userId = c.get('userId');

    // Check if workout exists and belongs to user
    const { data: existingWorkout, error: checkError } = await supabase
      .from('workouts')
      .select('user_id')
      .eq('id', workoutId)
      .single();

    if (checkError || !existingWorkout) {
      return sendNotFound(c, API_MESSAGES.WORKOUT_NOT_FOUND);
    }

    if (existingWorkout.user_id !== userId) {
      return sendError(c, ERROR_CODES.FORBIDDEN, 'Not authorized to delete this workout', 403);
    }

    // Delete workout
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId);

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to delete workout', 500, error.message);
    }

    return sendSuccess(c, null, API_MESSAGES.DELETED);

  } catch (error: any) {
    console.error('Delete workout error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get user workouts
export async function getUserWorkouts(c: Context, userId: string, limit: number = 20, offset: number = 0) {
  try {
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select(`
        *,
        profiles!workouts_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .eq('user_id', userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to get workouts', 500, error.message);
    }

    return sendSuccess(c, workouts, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get user workouts error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get public workouts
export async function getPublicWorkouts(c: Context, limit: number = 20, offset: number = 0, difficulty?: string, tags?: string[]) {
  try {
    let query = supabase
      .from('workouts')
      .select(`
        *,
        profiles!workouts_user_id_fkey (
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

    const { data: workouts, error } = await query;

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to get public workouts', 500, error.message);
    }

    return sendSuccess(c, workouts, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get public workouts error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Search workouts
export async function searchWorkouts(c: Context, query: string, limit: number = 20, offset: number = 0) {
  try {
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select(`
        *,
        profiles!workouts_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_public', true)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to search workouts', 500, error.message);
    }

    return sendSuccess(c, workouts, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Search workouts error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Like workout
export async function likeWorkout(c: Context, workoutId: string) {
  try {
    const userId = c.get('userId');

    // Check if workout exists
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('id')
      .eq('id', workoutId)
      .single();

    if (workoutError || !workout) {
      return sendNotFound(c, API_MESSAGES.WORKOUT_NOT_FOUND);
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('workout_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('workout_id', workoutId)
      .single();

    if (existingLike) {
      return sendConflict(c, 'Workout already liked');
    }

    // Create like
    const { data: like, error } = await supabase
      .from('workout_likes')
      .insert({
        user_id: userId,
        workout_id: workoutId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to like workout', 500, error.message);
    }

    return sendSuccess(c, like, 'Workout liked successfully');

  } catch (error: any) {
    console.error('Like workout error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Unlike workout
export async function unlikeWorkout(c: Context, workoutId: string) {
  try {
    const userId = c.get('userId');

    // Remove like
    const { error } = await supabase
      .from('workout_likes')
      .delete()
      .eq('user_id', userId)
      .eq('workout_id', workoutId);

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to unlike workout', 500, error.message);
    }

    return sendSuccess(c, null, 'Workout unliked successfully');

  } catch (error: any) {
    console.error('Unlike workout error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get workout likes
export async function getWorkoutLikes(c: Context, workoutId: string, limit: number = 20, offset: number = 0) {
  try {
    const { data: likes, error } = await supabase
      .from('workout_likes')
      .select(`
        *,
        profiles!workout_likes_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .eq('workout_id', workoutId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to get workout likes', 500, error.message);
    }

    return sendSuccess(c, likes, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get workout likes error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get workout statistics
export async function getWorkoutStats(c: Context, workoutId: string) {
  try {
    // Get workout
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('id, name, user_id')
      .eq('id', workoutId)
      .single();

    if (workoutError || !workout) {
      return sendNotFound(c, API_MESSAGES.WORKOUT_NOT_FOUND);
    }

    // Get like count
    const { count: likeCount } = await supabase
      .from('workout_likes')
      .select('*', { count: 'exact', head: true })
      .eq('workout_id', workoutId);

    // Get comment count
    const { count: commentCount } = await supabase
      .from('workout_comments')
      .select('*', { count: 'exact', head: true })
      .eq('workout_id', workoutId);

    // Get completion count
    const { count: completionCount } = await supabase
      .from('workout_completions')
      .select('*', { count: 'exact', head: true })
      .eq('workout_id', workoutId);

    const stats = {
      likes: likeCount || 0,
      comments: commentCount || 0,
      completions: completionCount || 0
    };

    return sendSuccess(c, stats, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get workout stats error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// List workouts
export async function listWorkouts(c: Context, query: any = {}) {
  try {
    const userId = c.get('userId');
    const { page = 1, limit = 20, difficulty, tags } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let queryBuilder = supabase
      .from('workouts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (difficulty) {
      queryBuilder = queryBuilder.eq('difficulty', difficulty);
    }

    const { data: workouts, error, count } = await queryBuilder
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to list workouts', 500, error.message);
    }

    return sendSuccess(c, workouts, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('List workouts error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get workout exercises
export async function getWorkoutExercises(c: Context, workoutId: string) {
  try {
    const { data: exercises, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to fetch workout exercises', 500, error.message);
    }

    return sendSuccess(c, exercises, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get workout exercises error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Add exercise to workout
export async function addExerciseToWorkout(c: Context, workoutId: string, body: any) {
  try {
    const { data: exercise, error } = await supabase
      .from('workout_exercises')
      .insert({
        workout_id: workoutId,
        ...body
      })
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to add exercise to workout', 500, error.message);
    }

    return sendSuccess(c, exercise, API_MESSAGES.CREATED, 201);

  } catch (error: any) {
    console.error('Add exercise to workout error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Update workout exercise
export async function updateWorkoutExercise(c: Context, workoutId: string, exerciseId: string, body: any) {
  try {
    const { data: exercise, error } = await supabase
      .from('workout_exercises')
      .update(body)
      .eq('workout_id', workoutId)
      .eq('id', exerciseId)
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to update workout exercise', 500, error.message);
    }

    return sendSuccess(c, exercise, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Update workout exercise error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Remove exercise from workout
export async function removeExerciseFromWorkout(c: Context, workoutId: string, exerciseId: string) {
  try {
    const { error } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('workout_id', workoutId)
      .eq('id', exerciseId);

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to remove exercise from workout', 500, error.message);
    }

    return sendSuccess(c, null, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Remove exercise from workout error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Start workout session
export async function startWorkoutSession(c: Context, workoutId: string, body: any) {
  try {
    const userId = c.get('userId');

    const { data: session, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        workout_id: workoutId,
        started_at: new Date().toISOString(),
        status: 'in_progress',
        ...body
      })
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to start workout session', 500, error.message);
    }

    return sendSuccess(c, session, API_MESSAGES.SESSION_STARTED, 201);

  } catch (error: any) {
    console.error('Start workout session error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Complete workout session
export async function completeWorkoutSession(c: Context, sessionId: string, body: any) {
  try {
    const { data: session, error } = await supabase
      .from('workout_sessions')
      .update({
        completed_at: new Date().toISOString(),
        status: 'completed',
        ...body
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to complete workout session', 500, error.message);
    }

    return sendSuccess(c, session, API_MESSAGES.SESSION_COMPLETED);

  } catch (error: any) {
    console.error('Complete workout session error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// List workout sessions
export async function listWorkoutSessions(c: Context, query: any = {}) {
  try {
    const userId = c.get('userId');
    const { page = 1, limit = 20 } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data: sessions, error, count } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to list workout sessions', 500, error.message);
    }

    return sendSuccess(c, sessions, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('List workout sessions error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get workout session
export async function getWorkoutSession(c: Context, sessionId: string) {
  try {
    const { data: session, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      return sendNotFound(c, 'Workout session not found');
    }

    return sendSuccess(c, session, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get workout session error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Update workout session
export async function updateWorkoutSession(c: Context, sessionId: string, body: any) {
  try {
    const { data: session, error } = await supabase
      .from('workout_sessions')
      .update(body)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to update workout session', 500, error.message);
    }

    return sendSuccess(c, session, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Update workout session error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Delete workout session
export async function deleteWorkoutSession(c: Context, sessionId: string) {
  try {
    const { error } = await supabase
      .from('workout_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to delete workout session', 500, error.message);
    }

    return sendSuccess(c, null, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Delete workout session error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}