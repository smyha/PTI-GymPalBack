import { supabase } from '../config/supabase.js';
import { sendSuccess, sendError, sendCreated } from '../shared/utils/response.js';
import { API_MESSAGES, ERROR_CODES } from '../shared/constants/index.js';
/**
 * Personal Information Service
 * Handles user personal info (physical stats) and fitness profile
 */
// ============================================================================
// PERSONAL INFO (Physical Stats)
// ============================================================================
/**
 * Get user's personal physical information
 */
export async function getPersonalInfo(c) {
    try {
        const userId = c.get('userId');
        const { data, error } = await supabase
            .from('user_personal_info')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching personal info:', error);
            return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to fetch personal information', 500, error.message);
        }
        // If no data exists, return empty object with success
        if (!data) {
            return sendSuccess(c, {}, 'No personal information found');
        }
        return sendSuccess(c, data, API_MESSAGES.SUCCESS);
    }
    catch (error) {
        console.error('Unexpected error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
    }
}
/**
 * Create or update user's personal physical information
 */
export async function upsertPersonalInfo(c, body) {
    try {
        const userId = c.get('userId');
        const { age, weight_kg, height_cm, body_fat_percentage } = body;
        // Verify that the user profile exists in the profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .single();
        if (profileError || !profile) {
            console.error('Profile not found for user:', userId, profileError);
            return sendError(c, ERROR_CODES.DATABASE_ERROR, 'User profile not found. Please ensure your account is properly set up.', 404, profileError?.message);
        }
        // Check if personal info exists
        const { data: existing } = await supabase
            .from('user_personal_info')
            .select('id')
            .eq('user_id', userId)
            .single();
        const personalData = {
            user_id: userId,
            age: age || null,
            weight_kg: weight_kg || null,
            height_cm: height_cm || null,
            body_fat_percentage: body_fat_percentage || null,
            updated_at: new Date().toISOString(),
        };
        if (existing) {
            // Update existing record
            const { data, error } = await supabase
                .from('user_personal_info')
                .update(personalData)
                .eq('user_id', userId)
                .select()
                .single();
            if (error) {
                console.error('Error updating personal info:', error);
                return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to update personal information', 500, error.message);
            }
            return sendSuccess(c, data, 'Personal information updated successfully');
        }
        else {
            // Create new record
            const { data, error } = await supabase
                .from('user_personal_info')
                .insert({ ...personalData, created_at: new Date().toISOString() })
                .select()
                .single();
            if (error) {
                console.error('Error creating personal info:', error);
                return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to create personal information', 500, error.message);
            }
            return sendCreated(c, data, 'Personal information created successfully');
        }
    }
    catch (error) {
        console.error('Unexpected error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
    }
}
// ============================================================================
// FITNESS PROFILE
// ============================================================================
/**
 * Get user's fitness profile
 */
export async function getFitnessProfile(c) {
    try {
        const userId = c.get('userId');
        const { data, error } = await supabase
            .from('user_fitness_profile')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching fitness profile:', error);
            return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to fetch fitness profile', 500, error.message);
        }
        if (!data) {
            return sendSuccess(c, {}, 'No fitness profile found');
        }
        return sendSuccess(c, data, API_MESSAGES.SUCCESS);
    }
    catch (error) {
        console.error('Unexpected error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
    }
}
/**
 * Create or update user's fitness profile
 */
export async function upsertFitnessProfile(c, body) {
    try {
        const userId = c.get('userId');
        const { experience_level, primary_goal, secondary_goals, workout_frequency, preferred_workout_duration, available_equipment, workout_preferences, injury_history, medical_restrictions, fitness_goals_timeline, motivation_level, } = body;
        // Verify that the user profile exists in the profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .single();
        if (profileError || !profile) {
            console.error('Profile not found for user:', userId, profileError);
            return sendError(c, ERROR_CODES.DATABASE_ERROR, 'User profile not found. Please ensure your account is properly set up.', 404, profileError?.message);
        }
        // Check if fitness profile exists
        const { data: existing } = await supabase
            .from('user_fitness_profile')
            .select('id')
            .eq('user_id', userId)
            .single();
        const fitnessData = {
            user_id: userId,
            experience_level: experience_level || 'beginner',
            primary_goal,
            secondary_goals: secondary_goals || [],
            workout_frequency: workout_frequency || null,
            preferred_workout_duration: preferred_workout_duration || null,
            available_equipment: available_equipment || [],
            workout_preferences: workout_preferences || {},
            injury_history: injury_history || [],
            medical_restrictions: medical_restrictions || [],
            fitness_goals_timeline: fitness_goals_timeline || null,
            motivation_level: motivation_level || null,
            updated_at: new Date().toISOString(),
        };
        if (existing) {
            // Update existing record
            const { data, error } = await supabase
                .from('user_fitness_profile')
                .update(fitnessData)
                .eq('user_id', userId)
                .select()
                .single();
            if (error) {
                console.error('Error updating fitness profile:', error);
                return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to update fitness profile', 500, error.message);
            }
            return sendSuccess(c, data, 'Fitness profile updated successfully');
        }
        else {
            // Create new record
            const { data, error } = await supabase
                .from('user_fitness_profile')
                .insert({ ...fitnessData, created_at: new Date().toISOString() })
                .select()
                .single();
            if (error) {
                console.error('Error creating fitness profile:', error);
                return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to create fitness profile', 500, error.message);
            }
            return sendCreated(c, data, 'Fitness profile created successfully');
        }
    }
    catch (error) {
        console.error('Unexpected error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
    }
}
/**
 * Get complete personal data (both physical info and fitness profile)
 */
export async function getCompletePersonalData(c) {
    try {
        const userId = c.get('userId');
        const [personalInfo, fitnessProfile] = await Promise.all([
            supabase
                .from('user_personal_info')
                .select('*')
                .eq('user_id', userId)
                .single(),
            supabase
                .from('user_fitness_profile')
                .select('*')
                .eq('user_id', userId)
                .single(),
        ]);
        const data = {
            personal_info: personalInfo.data || {},
            fitness_profile: fitnessProfile.data || {},
        };
        return sendSuccess(c, data, API_MESSAGES.SUCCESS);
    }
    catch (error) {
        console.error('Unexpected error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
    }
}
