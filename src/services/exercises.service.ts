import { Context } from 'hono';
import { supabase } from '../config/supabase.js';
import { sendSuccess, sendCreated, sendError, sendNotFound, sendValidationError } from '../shared/utils/response.js';
import { API_MESSAGES, ERROR_CODES } from '../shared/constants/index.js';

// ============================================================================
// EXERCISE SERVICE
// ============================================================================

// Create a new exercise
export async function createExercise(c: Context, body: any) {
  try {
    const userId = c.get('userId');
    
    if (!userId) {
      return sendError(c, ERROR_CODES.UNAUTHORIZED, API_MESSAGES.UNAUTHORIZED, 401);
    }

    const exerciseData = body;

    // Create exercise
    const { data: exercise, error } = await supabase
      .from('exercises')
      .insert({
        ...exerciseData,
        user_id: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating exercise:', error);
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
    }

    return sendCreated(c, exercise, API_MESSAGES.CREATED);

  } catch (error: any) {
    console.error('Create exercise error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
  }
}

// Get all exercises
export async function getAllExercises(c: Context) {
  const query = c.req.query();
  try {
    const userId = c.get('userId');
    
    if (!userId) {
      return sendError(c, ERROR_CODES.UNAUTHORIZED, API_MESSAGES.UNAUTHORIZED, 401);
    }

    const { page = 1, limit = 20, search, muscle_group, equipment, difficulty, tags, is_public, sort_by = 'name', sort_order = 'asc' } = query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    let queryBuilder = supabase
      .from('exercises')
      .select('*')
      .or(`user_id.eq.${userId},is_public.eq.true`);

    // Apply filters
    if (search) {
      queryBuilder = queryBuilder.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (muscle_group) {
      queryBuilder = queryBuilder.eq('muscle_group', muscle_group);
    }

    if (equipment && equipment.length > 0) {
      queryBuilder = queryBuilder.overlaps('equipment', equipment);
    }

    if (difficulty) {
      queryBuilder = queryBuilder.eq('difficulty', difficulty);
    }

    if (tags && tags.length > 0) {
      queryBuilder = queryBuilder.overlaps('tags', tags);
    }

    if (is_public !== undefined) {
      queryBuilder = queryBuilder.eq('is_public', is_public);
    }

    // Apply sorting
    queryBuilder = queryBuilder.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    queryBuilder = queryBuilder.range(from, to);

    const { data: exercises, error } = await queryBuilder;

    if (error) {
      console.error('Error fetching exercises:', error);
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${userId},is_public.eq.true`);

    return sendSuccess(c, {
      exercises: exercises || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        pages: Math.ceil((count || 0) / limitNum)
      }
    }, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get exercises error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
  }
}

// Get exercise by ID
export async function getExerciseById(c: Context) {
  try {
    const exerciseId = c.req.param('id');
    const userId = c.get('userId');

    if (!userId) {
      return sendError(c, ERROR_CODES.UNAUTHORIZED, API_MESSAGES.UNAUTHORIZED, 401);
    }

    const { data: exercise, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .or(`user_id.eq.${userId},is_public.eq.true`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return sendNotFound(c, 'Exercise not found');
      }
      console.error('Error fetching exercise:', error);
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
    }

    return sendSuccess(c, exercise, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get exercise error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
  }
}

// Update exercise
export async function updateExercise(c: Context, exerciseId: string, body: any) {
  try {
    const userId = c.get('userId');
    
    if (!userId) {
      return sendError(c, ERROR_CODES.UNAUTHORIZED, API_MESSAGES.UNAUTHORIZED, 401);
    }

    // Check if exercise exists and belongs to user
    const { data: existingExercise, error: fetchError } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return sendNotFound(c, 'Exercise not found');
      }
      console.error('Error fetching exercise:', fetchError);
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
    }

    // Update exercise
    const bodyData = body as Record<string, unknown>;
    const { data: exercise, error } = await supabase
      .from('exercises')
      .update({
        ...bodyData,
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', exerciseId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating exercise:', error);
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
    }

    return sendSuccess(c, exercise, API_MESSAGES.UPDATED);

  } catch (error: unknown) {
    console.error('Update exercise error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
  }
}

// Delete exercise
export async function deleteExercise(c: Context, exerciseId: string) {
  try {
    const userId = c.get('userId');
    
    if (!userId) {
      return sendError(c, ERROR_CODES.UNAUTHORIZED, API_MESSAGES.UNAUTHORIZED, 401);
    }

    // Check if exercise exists and belongs to user
    const { data: existingExercise, error: fetchError } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return sendNotFound(c, 'Exercise not found');
      }
      console.error('Error fetching exercise:', fetchError);
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
    }

    // Delete exercise
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', exerciseId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting exercise:', error);
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
    }

    return sendSuccess(c, null, API_MESSAGES.DELETED);

  } catch (error: any) {
    console.error('Delete exercise error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
  }
}

// Get exercise categories (muscle groups)
export async function getExerciseCategories(c: Context) {
  try {
    const { data: categories, error } = await supabase
      .from('exercises')
      .select('muscle_group')
      .not('muscle_group', 'is', null);

    if (error) {
      console.error('Error fetching categories:', error);
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
    }

    type CategoryData = { muscle_group: string };
    const categoriesData = (categories || []) as CategoryData[];

    // Get unique categories
    const uniqueCategories = [...new Set(categoriesData.map(cat => cat.muscle_group))];

    return sendSuccess(c, uniqueCategories, API_MESSAGES.SUCCESS);

  } catch (error: unknown) {
    console.error('Get categories error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
  }
}

// Get muscle groups (alias for getExerciseCategories)
export async function getMuscleGroups(c: Context) {
  return getExerciseCategories(c);
}

// Get equipment types
export async function getEquipmentTypes(c: Context) {
  try {
    const { data: equipment, error } = await supabase
      .from('exercises')
      .select('equipment')
      .not('equipment', 'is', null);

    if (error) {
      console.error('Error fetching equipment:', error);
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
    }

    type EquipmentData = { equipment: string[] | null };
    const equipmentData = (equipment || []) as EquipmentData[];

    // Flatten and get unique equipment
    const allEquipment = equipmentData.flatMap(ex => ex.equipment || []);
    const uniqueEquipment = [...new Set(allEquipment)];

    return sendSuccess(c, uniqueEquipment, API_MESSAGES.SUCCESS);

  } catch (error: unknown) {
    console.error('Get equipment error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
  }
}

// Search exercises
export async function searchExercises(c: Context, query: any) {
  try {
    const userId = c.get('userId');
    
    if (!userId) {
      return sendError(c, ERROR_CODES.UNAUTHORIZED, API_MESSAGES.UNAUTHORIZED, 401);
    }

    const { search, limit = 10 } = query;

    if (!search) {
      return sendValidationError(c, ['Search query is required']);
    }

    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('*')
      .or(`user_id.eq.${userId},is_public.eq.true`)
      .or(`name.ilike.%${search}%,description.ilike.%${search}%,muscle_group.ilike.%${search}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching exercises:', error);
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
    }

    return sendSuccess(c, exercises || [], API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Search exercises error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
  }
}

// Get user's exercises
export async function getUserExercises(c: Context) {
  try {
    const userId = c.get('userId');
    
    if (!userId) {
      return sendError(c, ERROR_CODES.UNAUTHORIZED, API_MESSAGES.UNAUTHORIZED, 401);
    }

    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user exercises:', error);
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
    }

    return sendSuccess(c, exercises || [], API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get user exercises error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
  }
}
