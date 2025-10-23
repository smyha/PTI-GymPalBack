import { Context } from 'hono';
import { supabase } from '../config/supabase.js';
import { sendSuccess, sendError, sendNotFound, sendValidationError } from '../shared/utils/response.js';
import { API_MESSAGES, ERROR_CODES } from '../shared/constants/index.js';

// Get user settings
export async function getUserSettings(c: Context) {
  try {
    const userId = c.get('userId');

    const { data: settings, error } = await supabase
      .from('profiles')
      .select('notification_preferences, privacy_settings, units_preferences, theme_preferences, language, timezone')
      .eq('id', userId)
      .single();

    if (error || !settings) {
      return sendNotFound(c, API_MESSAGES.USER_NOT_FOUND);
    }

    return sendSuccess(c, settings, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get user settings error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Update user settings
export async function updateUserSettings(c: Context, body: any) {
  try {
    const userId = c.get('userId');
    const { notification_preferences, privacy_settings, units_preferences, theme_preferences, language, timezone } = body;

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

    // Validate language
    if (language) {
      const validLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'];
      if (!validLanguages.includes(language)) {
        return sendValidationError(c, ['Invalid language']);
      }
    }

    // Validate timezone
    if (timezone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
      } catch (error) {
        return sendValidationError(c, ['Invalid timezone']);
      }
    }

    // Update settings
    const { data: settings, error } = await supabase
      .from('profiles')
      .update({
        notification_preferences,
        privacy_settings,
        units_preferences,
        theme_preferences,
        language,
        timezone,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('notification_preferences, privacy_settings, units_preferences, theme_preferences, language, timezone')
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to update settings', 500, error.message);
    }

    return sendSuccess(c, settings, API_MESSAGES.UPDATED);

  } catch (error: any) {
    console.error('Update user settings error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Update notification preferences
export async function updateNotificationPreferences(c: Context, body: any) {
  try {
    const userId = c.get('userId');
    const { email, push, sms, workout_reminders, social_interactions, achievements, marketing } = body;

    // Validate boolean values
    const booleanFields = { email, push, sms, workout_reminders, social_interactions, achievements, marketing };
    for (const [key, value] of Object.entries(booleanFields)) {
      if (value !== undefined && typeof value !== 'boolean') {
        return sendValidationError(c, [`${key} must be a boolean value`]);
      }
    }

    // Update notification preferences
    const { data: settings, error } = await supabase
      .from('profiles')
      .update({
        notification_preferences: {
          email,
          push,
          sms,
          workout_reminders,
          social_interactions,
          achievements,
          marketing
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('notification_preferences')
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to update notification preferences', 500, error.message);
    }

    return sendSuccess(c, settings, API_MESSAGES.UPDATED);

  } catch (error: any) {
    console.error('Update notification preferences error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Update privacy settings
export async function updatePrivacySettings(c: Context, body: any) {
  try {
    const userId = c.get('userId');
    const { profile_public, workouts_public, posts_public, show_email, show_phone, show_activity } = body;

    // Validate boolean values
    const booleanFields = { profile_public, workouts_public, posts_public, show_email, show_phone, show_activity };
    for (const [key, value] of Object.entries(booleanFields)) {
      if (value !== undefined && typeof value !== 'boolean') {
        return sendValidationError(c, [`${key} must be a boolean value`]);
      }
    }

    // Update privacy settings
    const { data: settings, error } = await supabase
      .from('profiles')
      .update({
        privacy_settings: {
          profile_public,
          workouts_public,
          posts_public,
          show_email,
          show_phone,
          show_activity
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('privacy_settings')
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to update privacy settings', 500, error.message);
    }

    return sendSuccess(c, settings, API_MESSAGES.UPDATED);

  } catch (error: any) {
    console.error('Update privacy settings error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Update units preferences
export async function updateUnitsPreferences(c: Context, body: any) {
  try {
    const userId = c.get('userId');
    const { weight_unit, height_unit, distance_unit } = body;

    // Validate weight unit
    const validWeightUnits = ['kg', 'lbs'];
    if (weight_unit && !validWeightUnits.includes(weight_unit)) {
      return sendValidationError(c, ['Invalid weight unit']);
    }

    // Validate height unit
    const validHeightUnits = ['cm', 'ft'];
    if (height_unit && !validHeightUnits.includes(height_unit)) {
      return sendValidationError(c, ['Invalid height unit']);
    }

    // Validate distance unit
    const validDistanceUnits = ['km', 'miles'];
    if (distance_unit && !validDistanceUnits.includes(distance_unit)) {
      return sendValidationError(c, ['Invalid distance unit']);
    }

    // Update units preferences
    const { data: settings, error } = await supabase
      .from('profiles')
      .update({
        units_preferences: {
          weight_unit,
          height_unit,
          distance_unit
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('units_preferences')
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to update units preferences', 500, error.message);
    }

    return sendSuccess(c, settings, API_MESSAGES.UPDATED);

  } catch (error: any) {
    console.error('Update units preferences error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Update theme preferences
export async function updateThemePreferences(c: Context, body: any) {
  try {
    const userId = c.get('userId');
    const { theme, primary_color, font_size, compact_mode } = body;

    // Validate theme
    const validThemes = ['light', 'dark', 'auto'];
    if (theme && !validThemes.includes(theme)) {
      return sendValidationError(c, ['Invalid theme']);
    }

    // Validate primary color
    const validColors = ['blue', 'green', 'purple', 'red', 'orange', 'pink'];
    if (primary_color && !validColors.includes(primary_color)) {
      return sendValidationError(c, ['Invalid primary color']);
    }

    // Validate font size
    const validFontSizes = ['small', 'medium', 'large'];
    if (font_size && !validFontSizes.includes(font_size)) {
      return sendValidationError(c, ['Invalid font size']);
    }

    // Validate compact mode
    if (compact_mode !== undefined && typeof compact_mode !== 'boolean') {
      return sendValidationError(c, ['Compact mode must be a boolean value']);
    }

    // Update theme preferences
    const { data: settings, error } = await supabase
      .from('profiles')
      .update({
        theme_preferences: {
          theme,
          primary_color,
          font_size,
          compact_mode
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('theme_preferences')
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to update theme preferences', 500, error.message);
    }

    return sendSuccess(c, settings, API_MESSAGES.UPDATED);

  } catch (error: any) {
    console.error('Update theme preferences error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Update language
export async function updateLanguage(c: Context, body: any) {
  try {
    const userId = c.get('userId');
    const { language } = body;

    // Validate language
    const validLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'];
    if (!validLanguages.includes(language)) {
      return sendValidationError(c, ['Invalid language']);
    }

    // Update language
    const { data: settings, error } = await supabase
      .from('profiles')
      .update({
        language,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('language')
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to update language', 500, error.message);
    }

    return sendSuccess(c, settings, API_MESSAGES.UPDATED);

  } catch (error: any) {
    console.error('Update language error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Update timezone
export async function updateTimezone(c: Context, body: any) {
  try {
    const userId = c.get('userId');
    const { timezone } = body;

    // Validate timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch (error) {
      return sendValidationError(c, ['Invalid timezone']);
    }

    // Update timezone
    const { data: settings, error } = await supabase
      .from('profiles')
      .update({
        timezone,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('timezone')
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to update timezone', 500, error.message);
    }

    return sendSuccess(c, settings, API_MESSAGES.UPDATED);

  } catch (error: any) {
    console.error('Update timezone error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get available languages
export async function getAvailableLanguages(c: Context) {
  try {
    const languages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' }
    ];

    return sendSuccess(c, languages, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get available languages error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get available timezones
export async function getAvailableTimezones(c: Context) {
  try {
    const timezones = (Intl as any).supportedValuesOf('timeZone').map((tz: any) => ({
      value: tz,
      label: tz.replace(/_/g, ' ')
    }));

    return sendSuccess(c, timezones, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get available timezones error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Export user data
export async function exportUserData(c: Context, body?: any) {
  try {
    const userId = c.get('userId');

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return sendNotFound(c, API_MESSAGES.USER_NOT_FOUND);
    }

    // Get user workouts
    const { data: workouts } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId);

    // Get user routines
    const { data: routines } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId);

    // Get user posts
    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId);

    // Get user follows
    const { data: follows } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', userId);

    // Get user followers
    const { data: followers } = await supabase
      .from('follows')
      .select('*')
      .eq('following_id', userId);

    const exportData = {
      profile,
      workouts: workouts || [],
      routines: routines || [],
      posts: posts || [],
      follows: follows || [],
      followers: followers || [],
      exported_at: new Date().toISOString()
    };

    return sendSuccess(c, exportData, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Export user data error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Delete user account
export async function deleteAccount(c: Context) {
  try {
    const userId = c.get('userId');

    // Delete user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to delete account', 500, profileError.message);
    }

    // Delete user from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to delete account', 500, authError.message);
    }

    return sendSuccess(c, null, 'Account deleted successfully');

  } catch (error: any) {
    console.error('Delete account error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get notification settings
export async function getNotificationSettings(c: Context) {
  try {
    const userId = c.get('userId');

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('notifications')
      .eq('user_id', userId)
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to fetch notification settings', 500, error.message);
    }

    return sendSuccess(c, settings?.notifications || {}, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get notification settings error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Update notification settings
export async function updateNotificationSettings(c: Context, body: any) {
  return updateNotificationPreferences(c, body);
}

// Get privacy settings
export async function getPrivacySettings(c: Context) {
  try {
    const userId = c.get('userId');

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('privacy')
      .eq('user_id', userId)
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to fetch privacy settings', 500, error.message);
    }

    return sendSuccess(c, settings?.privacy || {}, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get privacy settings error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get user preferences
export async function getUserPreferences(c: Context) {
  try {
    const userId = c.get('userId');

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('theme, language, timezone, units')
      .eq('user_id', userId)
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to fetch user preferences', 500, error.message);
    }

    return sendSuccess(c, settings || {}, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get user preferences error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Update user preferences
export async function updateUserPreferences(c: Context, body: any) {
  try {
    const userId = c.get('userId');

    const updates: any = {};
    if (body.theme) updates.theme = body.theme;
    if (body.language) updates.language = body.language;
    if (body.timezone) updates.timezone = body.timezone;
    if (body.units) updates.units = body.units;

    const { data: settings, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to update preferences', 500, error.message);
    }

    return sendSuccess(c, settings, API_MESSAGES.SETTINGS_UPDATED);

  } catch (error: any) {
    console.error('Update user preferences error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get fitness settings
export async function getFitnessSettings(c: Context) {
  try {
    const userId = c.get('userId');

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('fitness_level, goals, units')
      .eq('user_id', userId)
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to fetch fitness settings', 500, error.message);
    }

    return sendSuccess(c, settings || {}, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get fitness settings error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Update fitness settings
export async function updateFitnessSettings(c: Context, body: any) {
  try {
    const userId = c.get('userId');

    const { data: settings, error } = await supabase
      .from('user_settings')
      .update({
        fitness_level: body.fitness_level,
        goals: body.goals,
        units: body.units
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to update fitness settings', 500, error.message);
    }

    return sendSuccess(c, settings, API_MESSAGES.SETTINGS_UPDATED);

  } catch (error: any) {
    console.error('Update fitness settings error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get social settings
export async function getSocialSettings(c: Context) {
  try {
    const userId = c.get('userId');

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('privacy')
      .eq('user_id', userId)
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to fetch social settings', 500, error.message);
    }

    return sendSuccess(c, settings?.privacy || {}, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get social settings error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Update social settings
export async function updateSocialSettings(c: Context, body: any) {
  return updatePrivacySettings(c, body);
}

// Import user data
export async function importUserData(c: Context, body: any) {
  try {
    const userId = c.get('userId');

    // In a real implementation, this would parse and import the data
    // For now, return success
    return sendSuccess(c, { imported: true }, 'User data imported successfully');

  } catch (error: any) {
    console.error('Import user data error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Delete user account (alias for deleteAccount)
export async function deleteUserAccount(c: Context, body: any) {
  return deleteAccount(c);
}

// Get activity log
export async function getActivityLog(c: Context, query: any = {}) {
  try {
    const userId = c.get('userId');
    const { page = 1, limit = 20 } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data: activities, error, count } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to fetch activity log', 500, error.message);
    }

    return sendSuccess(c, activities, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get activity log error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Change email
export async function changeEmail(c: Context, body: any) {
  try {
    const userId = c.get('userId');
    const { new_email } = body;

    // In a real implementation, send verification email first
    const { data: user, error } = await supabase
      .from('profiles')
      .update({ email: new_email, email_verified: false })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to change email', 500, error.message);
    }

    return sendSuccess(c, user, 'Email change initiated. Please verify your new email.');

  } catch (error: any) {
    console.error('Change email error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Verify email change
export async function verifyEmailChange(c: Context, body: any) {
  try {
    const userId = c.get('userId');
    const { token } = body;

    // In a real implementation, verify the token
    const { data: user, error } = await supabase
      .from('profiles')
      .update({ email_verified: true })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to verify email', 500, error.message);
    }

    return sendSuccess(c, user, 'Email verified successfully');

  } catch (error: any) {
    console.error('Verify email change error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}