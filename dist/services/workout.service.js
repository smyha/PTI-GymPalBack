import { supabase } from '../config/supabase.js';
import { sendSuccess, sendError, sendNotFound, sendValidationError, sendConflict } from '../shared/utils/response.js';
import { API_MESSAGES, ERROR_CODES } from '../shared/constants/index.js';
// Create a new workout
export async function createWorkout(c, body) {
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
            return sendValidationError(c, ['Duration must be between 1 and 600 minutes']);
        }
        // Validate exercises
        if (exercises && Array.isArray(exercises)) {
            for (const exercise of exercises) {
                if (!exercise.exercise_id || !exercise.sets || !exercise.reps) {
                    return sendValidationError(c, ['Each exercise must have exercise_id, sets, and reps']);
                }
                if (exercise.sets < 1 || exercise.sets > 50) {
                    return sendValidationError(c, ['Sets must be between 1 and 50']);
                }
                if (exercise.reps < 1 || exercise.reps > 1000) {
                    return sendValidationError(c, ['Reps must be between 1 and 1000']);
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
    }
    catch (error) {
        console.error('Create workout error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Get workout by ID
export async function getWorkout(c, workoutId) {
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
    }
    catch (error) {
        console.error('Get workout error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Update workout
export async function updateWorkout(c, workoutId, body) {
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
        const existingWorkoutData = existingWorkout;
        if (existingWorkoutData.user_id !== userId) {
            return sendError(c, ERROR_CODES.FORBIDDEN, 'Not authorized to update this workout', 403);
        }
        // Validate difficulty
        const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
        if (difficulty && !validDifficulties.includes(difficulty)) {
            return sendValidationError(c, ['Invalid difficulty level']);
        }
        // Validate duration
        if (duration && (duration < 1 || duration > 600)) {
            return sendValidationError(c, ['Duration must be between 1 and 600 minutes']);
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
    }
    catch (error) {
        console.error('Update workout error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Delete workout
export async function deleteWorkout(c, workoutId) {
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
        const existingWorkoutData = existingWorkout;
        if (existingWorkoutData.user_id !== userId) {
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
    }
    catch (error) {
        console.error('Delete workout error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Get user workouts
export async function getUserWorkouts(c, userId, limit = 20, offset = 0) {
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
    }
    catch (error) {
        console.error('Get user workouts error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Get public workouts
export async function getPublicWorkouts(c, limit = 20, offset = 0, difficulty, tags) {
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
    }
    catch (error) {
        console.error('Get public workouts error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Search workouts
export async function searchWorkouts(c, query, limit = 20, offset = 0) {
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
    }
    catch (error) {
        console.error('Search workouts error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Like workout
export async function likeWorkout(c, workoutId) {
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
    }
    catch (error) {
        console.error('Like workout error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Unlike workout
export async function unlikeWorkout(c, workoutId) {
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
    }
    catch (error) {
        console.error('Unlike workout error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Get workout likes
export async function getWorkoutLikes(c, workoutId, limit = 20, offset = 0) {
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
    }
    catch (error) {
        console.error('Get workout likes error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Get workout statistics
export async function getWorkoutStats(c, workoutId) {
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
    }
    catch (error) {
        console.error('Get workout stats error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// List workouts
export async function listWorkouts(c, query = {}) {
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
    }
    catch (error) {
        console.error('List workouts error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Get workout exercises
export async function getWorkoutExercises(c, workoutId) {
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
    }
    catch (error) {
        console.error('Get workout exercises error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Add exercise to workout
export async function addExerciseToWorkout(c, workoutId, body) {
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
    }
    catch (error) {
        console.error('Add exercise to workout error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Update workout exercise
export async function updateWorkoutExercise(c, workoutId, exerciseId, body) {
    try {
        const { data: exercise, error } = await supabase
            .from('workout_exercises')
            // @ts-expect-error - type mismatch
            .update(body)
            .eq('workout_id', workoutId)
            .eq('id', exerciseId)
            .select()
            .single();
        if (error) {
            return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to update workout exercise', 500, error.message);
        }
        return sendSuccess(c, exercise, API_MESSAGES.SUCCESS);
    }
    catch (error) {
        console.error('Update workout exercise error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Remove exercise from workout
export async function removeExerciseFromWorkout(c, workoutId, exerciseId) {
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
    }
    catch (error) {
        console.error('Remove exercise from workout error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Start workout session
export async function startWorkoutSession(c, workoutId, body) {
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
    }
    catch (error) {
        console.error('Start workout session error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Complete workout session
export async function completeWorkoutSession(c, sessionId, body) {
    try {
        const { data: session, error } = await supabase
            .from('workout_sessions')
            // @ts-expect-error - type mismatch
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
    }
    catch (error) {
        console.error('Complete workout session error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// List workout sessions
export async function listWorkoutSessions(c, query = {}) {
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
    }
    catch (error) {
        console.error('List workout sessions error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Get workout session
export async function getWorkoutSession(c, sessionId) {
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
    }
    catch (error) {
        console.error('Get workout session error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Update workout session
export async function updateWorkoutSession(c, sessionId, body) {
    try {
        const { data: session, error } = await supabase
            .from('workout_sessions')
            // @ts-expect-error - type mismatch
            .update(body)
            .eq('id', sessionId)
            .select()
            .single();
        if (error) {
            return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to update workout session', 500, error.message);
        }
        return sendSuccess(c, session, API_MESSAGES.SUCCESS);
    }
    catch (error) {
        console.error('Update workout session error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Delete workout session
export async function deleteWorkoutSession(c, sessionId) {
    try {
        const { error } = await supabase
            .from('workout_sessions')
            .delete()
            .eq('id', sessionId);
        if (error) {
            return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to delete workout session', 500, error.message);
        }
        return sendSuccess(c, null, API_MESSAGES.SUCCESS);
    }
    catch (error) {
        console.error('Delete workout session error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
