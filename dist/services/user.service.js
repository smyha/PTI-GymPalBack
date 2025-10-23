import { supabase, supabaseAdmin } from '../config/supabase.js';
import { sendSuccess, sendError, sendNotFound, sendValidationError } from '../shared/utils/response.js';
import { API_MESSAGES, ERROR_CODES } from '../shared/constants/index.js';
import { processAvatarForUpdate } from '../shared/utils/avatar.utils.js';
// Get user profile by ID
export async function getUserProfile(c) {
    const userId = c.get('userId');
    return getUserById(c, userId);
}
export async function getUserById(c, userId) {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, bio, fitness_level, created_at, updated_at')
            .eq('id', userId)
            .single();
        if (error || !profile) {
            return sendNotFound(c, API_MESSAGES.USER_NOT_FOUND);
        }
        return sendSuccess(c, profile, API_MESSAGES.SUCCESS);
    }
    catch (error) {
        console.error('Get user profile error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
    }
}
// Update user profile
export async function updateProfile(c, body) {
    try {
        const userId = c.get('userId');
        const { full_name, bio, fitness_level, avatar_url, date_of_birth, gender, height, weight, timezone, language } = body;
        // Validate fitness level
        const validFitnessLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
        if (fitness_level && !validFitnessLevels.includes(fitness_level)) {
            return sendValidationError(c, ['Invalid fitness level']);
        }
        // Validate gender
        const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
        if (gender && !validGenders.includes(gender)) {
            return sendValidationError(c, ['Invalid gender']);
        }
        // Validate language
        const validLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'];
        if (language && !validLanguages.includes(language)) {
            return sendValidationError(c, ['Invalid language']);
        }
        // Validate height and weight
        if (height && (height < 50 || height > 300)) {
            return sendValidationError(c, ['Height must be between 50 and 300 cm']);
        }
        if (weight && (weight < 20 || weight > 500)) {
            return sendValidationError(c, ['Weight must be between 20 and 500 kg']);
        }
        // Get current profile for avatar processing
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('full_name, gender, email, avatar_url')
            .eq('id', userId)
            .single();
        // Process avatar URL - assign default if not provided or invalid
        const processedAvatarUrl = processAvatarForUpdate(avatar_url, currentProfile);
        // Update profile
        const { data: profile, error } = await supabase
            .from('profiles')
            .update({
            full_name,
            bio,
            fitness_level,
            avatar_url: processedAvatarUrl,
            date_of_birth,
            gender,
            timezone,
            language,
            updated_at: new Date().toISOString()
        })
            .eq('id', userId)
            .select()
            .single();
        // Update personal info if height/weight provided
        if (height || weight) {
            const { error: personalInfoError } = await supabase
                .from('user_personal_info')
                .upsert({
                user_id: userId,
                height_cm: height,
                weight_kg: weight
            });
            if (personalInfoError) {
                console.error('Failed to update personal info:', personalInfoError);
            }
        }
        if (error) {
            return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to update profile', 500, error.message);
        }
        return sendSuccess(c, profile, API_MESSAGES.UPDATED);
    }
    catch (error) {
        console.error('Update profile error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
    }
}
// Get user settings
export async function getUserSettings(c) {
    try {
        const userId = c.get('userId');
        const { data: settings, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error || !settings) {
            return sendNotFound(c, API_MESSAGES.USER_NOT_FOUND);
        }
        return sendSuccess(c, settings, API_MESSAGES.SUCCESS);
    }
    catch (error) {
        console.error('Get user settings error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
    }
}
// Update user settings
export async function updateUserSettings(c, body) {
    try {
        const userId = c.get('userId');
        const { notification_preferences, privacy_settings, units_preferences, theme_preferences } = body;
        // Validate notification preferences
        if (notification_preferences) {
            const validKeys = ['email', 'push', 'sms', 'workout_reminders', 'social_interactions', 'achievements', 'marketing'];
            const invalidKeys = Object.keys(notification_preferences).filter(key => !validKeys.includes(key));
            if (invalidKeys.length > 0) {
                return sendValidationError(c, [`Invalid notification preference keys: ${invalidKeys.join(', ')}`]);
            }
        }
        // Validate privacy settings
        if (privacy_settings) {
            const validKeys = ['profile_public', 'workouts_public', 'posts_public', 'show_email', 'show_phone', 'show_activity'];
            const invalidKeys = Object.keys(privacy_settings).filter(key => !validKeys.includes(key));
            if (invalidKeys.length > 0) {
                return sendValidationError(c, [`Invalid privacy setting keys: ${invalidKeys.join(', ')}`]);
            }
        }
        // Validate units preferences
        if (units_preferences) {
            const validWeightUnits = ['kg', 'lbs'];
            const validHeightUnits = ['cm', 'ft'];
            const validDistanceUnits = ['km', 'miles'];
            if (units_preferences.weight_unit && !validWeightUnits.includes(units_preferences.weight_unit)) {
                return sendValidationError(c, ['Invalid weight unit']);
            }
            if (units_preferences.height_unit && !validHeightUnits.includes(units_preferences.height_unit)) {
                return sendValidationError(c, ['Invalid height unit']);
            }
            if (units_preferences.distance_unit && !validDistanceUnits.includes(units_preferences.distance_unit)) {
                return sendValidationError(c, ['Invalid distance unit']);
            }
        }
        // Validate theme preferences
        if (theme_preferences) {
            const validThemes = ['light', 'dark', 'auto'];
            const validColors = ['blue', 'green', 'purple', 'red', 'orange', 'pink'];
            if (theme_preferences.theme && !validThemes.includes(theme_preferences.theme)) {
                return sendValidationError(c, ['Invalid theme']);
            }
            if (theme_preferences.primary_color && !validColors.includes(theme_preferences.primary_color)) {
                return sendValidationError(c, ['Invalid primary color']);
            }
        }
        // Update settings in user_settings table
        const { data: settings, error } = await supabase
            .from('user_settings')
            .upsert({
            user_id: userId,
            email_notifications: notification_preferences?.email,
            push_notifications: notification_preferences?.push,
            workout_reminders: notification_preferences?.workout_reminders,
            timezone: units_preferences?.timezone || 'UTC',
            language: units_preferences?.language || 'en',
            theme: theme_preferences?.theme || 'light',
            profile_visibility: privacy_settings?.profile_public,
            workout_visibility: privacy_settings?.workouts_public,
            progress_visibility: privacy_settings?.posts_public,
            updated_at: new Date().toISOString()
        })
            .select('*')
            .single();
        if (error) {
            return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to update settings', 500, error.message);
        }
        return sendSuccess(c, settings, API_MESSAGES.UPDATED);
    }
    catch (error) {
        console.error('Update user settings error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
    }
}
// Delete user account
export async function deleteAccount(c, body) {
    try {
        const userId = c.get('userId');
        // Delete user profile
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);
        if (profileError) {
            return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to delete profile', 500, profileError.message);
        }
        // Delete user from Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authError) {
            return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to delete account', 500, authError.message);
        }
        return sendSuccess(c, null, 'Account deleted successfully');
    }
    catch (error) {
        console.error('Delete account error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
    }
}
// Get user statistics
export async function getUserStats(c, targetUserId) {
    try {
        const userId = targetUserId || c.get('userId');
        // Get workout count
        const { count: workoutCount } = await supabase
            .from('workouts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        // Get workout session count
        const { count: sessionCount } = await supabase
            .from('workout_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        // Get post count
        const { count: postCount } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        // Get follower count
        const { count: followerCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId);
        // Get following count
        const { count: followingCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', userId);
        const stats = {
            workouts: workoutCount || 0,
            sessions: sessionCount || 0,
            posts: postCount || 0,
            followers: followerCount || 0,
            following: followingCount || 0
        };
        return sendSuccess(c, stats, API_MESSAGES.SUCCESS);
    }
    catch (error) {
        console.error('Get user stats error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
    }
}
// Search users
export async function searchUsers(c, query, limit = 10, offset = 0) {
    try {
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
            .range(offset, offset + limit - 1);
        if (error) {
            return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to search users', 500, error.message);
        }
        return sendSuccess(c, users || [], API_MESSAGES.SUCCESS);
    }
    catch (error) {
        console.error('Search users error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
    }
}
// Get user following
export async function getUserAchievements(c, userId, query = {}) {
    try {
        const { page = 1, limit = 20 } = query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { data: achievements, error, count } = await supabase
            .from('achievements')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('earned_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);
        if (error) {
            return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to fetch achievements', 500, error.message);
        }
        return sendSuccess(c, achievements, API_MESSAGES.SUCCESS);
    }
    catch (error) {
        console.error('Get user achievements error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
    }
}
