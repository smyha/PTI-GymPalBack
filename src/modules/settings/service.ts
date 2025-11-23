/**
 * Settings Service
 * Business logic layer for user settings operations
 */

import { selectRow, upsertRow } from '../../core/config/database-helpers.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  UpdateSettingsData,
  UpdateNotificationSettingsData,
  UpdatePrivacySettingsData,
} from './types.js';

export const settingsService = {
  /**
   * Gets all settings for a user
   */
  async getSettings(userId: string, dbClient?: SupabaseClient): Promise<any> {
    const client = dbClient || (await import('../../core/config/database.js')).supabaseAdmin;
    const { data, error } = await selectRow('user_settings', (q) => q.eq('user_id', userId), client);

    if (error) {
      throw new Error(`Failed to get settings: ${error.message}`);
    }

    if (!data) {
      return {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
      };
    }

    return {
      theme: data.theme || 'light',
      language: data.language || 'en',
      timezone: data.timezone || 'UTC',
    };
  },

  /**
   * Updates general settings for a user
   */
  async updateSettings(userId: string, data: UpdateSettingsData, dbClient?: SupabaseClient): Promise<any> {
    const client = dbClient || (await import('../../core/config/database.js')).supabaseAdmin;
    const settingsData: any = {
      user_id: userId,
    };

    if (data.theme !== undefined) settingsData.theme = data.theme;
    if (data.language !== undefined) settingsData.language = data.language;
    if (data.timezone !== undefined) settingsData.timezone = data.timezone;

    const { data: updated, error } = await upsertRow('user_settings', settingsData, {
      onConflict: 'user_id',
    }, client);

    if (error) {
      throw new Error(`Failed to update settings: ${error.message}`);
    }

    if (!updated) {
      return {
        theme: data.theme || 'light',
        language: data.language || 'en',
        timezone: data.timezone || 'UTC',
      };
    }

    return {
      theme: updated.theme || 'light',
      language: updated.language || 'en',
      timezone: updated.timezone || 'UTC',
    };
  },

  /**
   * Gets notification settings for a user
   */
  async getNotificationSettings(userId: string, dbClient?: SupabaseClient): Promise<any> {
    const client = dbClient || (await import('../../core/config/database.js')).supabaseAdmin;
    const { data, error } = await selectRow('user_settings', (q) => q.eq('user_id', userId), client);

    if (error) {
      throw new Error(`Failed to get notification settings: ${error.message}`);
    }

    if (!data) {
      return {
        email: true,
        push: true,
      };
    }

    return {
      email: data.email_notifications ?? true,
      push: data.push_notifications ?? true,
    };
  },

  /**
   * Updates notification settings for a user
   */
  async updateNotificationSettings(
    userId: string,
    data: UpdateNotificationSettingsData,
    dbClient?: SupabaseClient
  ): Promise<any> {
    const client = dbClient || (await import('../../core/config/database.js')).supabaseAdmin;
    const settingsData: any = {
      user_id: userId,
    };

    if (data.email !== undefined) settingsData.email_notifications = data.email;
    if (data.push !== undefined) settingsData.push_notifications = data.push;

    const { data: updated, error } = await upsertRow('user_settings', settingsData, {
      onConflict: 'user_id',
    }, client);

    if (error) {
      throw new Error(`Failed to update notification settings: ${error.message}`);
    }

    if (!updated) {
      return {
        email: data.email ?? true,
        push: data.push ?? true,
      };
    }

    return {
      email: updated.email_notifications ?? true,
      push: updated.push_notifications ?? true,
    };
  },

  /**
   * Gets privacy settings for a user
   * Note: The database stores boolean values, but we convert them to string enums for the frontend
   */
  async getPrivacySettings(userId: string, dbClient?: SupabaseClient): Promise<any> {
    const client = dbClient || (await import('../../core/config/database.js')).supabaseAdmin;
    const { data, error } = await selectRow('user_settings', (q) => q.eq('user_id', userId), client);

    if (error) {
      throw new Error(`Failed to get privacy settings: ${error.message}`);
    }

    if (!data) {
      return {
        profileVisibility: 'public',
        workoutVisibility: 'public',
        showStats: true,
      };
    }

    // Convert boolean to string enum for profile_visibility
    // true = 'public', false = 'private' (we'll use 'friends' as a middle ground if needed)
    // For now, we'll map: true -> 'public', false -> 'private'
    const profileVisibility = data.profile_visibility === true ? 'public' : 
                              data.profile_visibility === false ? 'private' : 'public';
    
    // Same for workout_visibility
    const workoutVisibility = data.workout_visibility === true ? 'public' : 
                              data.workout_visibility === false ? 'private' : 'public';

    return {
      profileVisibility,
      workoutVisibility,
      showStats: data.progress_visibility ?? true, // Map progress_visibility to showStats
    };
  },

  /**
   * Updates privacy settings for a user
   * Note: The database stores boolean values, but the frontend sends string enums
   * We convert: 'public' -> true, 'friends'/'private' -> false
   */
  async updatePrivacySettings(userId: string, data: UpdatePrivacySettingsData, dbClient?: SupabaseClient): Promise<any> {
    const client = dbClient || (await import('../../core/config/database.js')).supabaseAdmin;
    const settingsData: any = {
      user_id: userId,
    };

    // Convert string enum to boolean for profile_visibility
    // 'public' -> true, 'friends'/'private' -> false
    if (data.profileVisibility !== undefined) {
      settingsData.profile_visibility = data.profileVisibility === 'public';
    }

    // Convert string enum to boolean for workout_visibility
    if (data.workoutVisibility !== undefined) {
      settingsData.workout_visibility = data.workoutVisibility === 'public';
    }

    // Map showStats to progress_visibility
    if (data.showStats !== undefined) {
      settingsData.progress_visibility = data.showStats;
    }

    const { data: updated, error } = await upsertRow('user_settings', settingsData, {
      onConflict: 'user_id',
    }, client);

    if (error) {
      throw new Error(`Failed to update privacy settings: ${error.message}`);
    }

    if (!updated) {
      return {
        profileVisibility: data.profileVisibility || 'public',
        workoutVisibility: data.workoutVisibility || 'public',
        showStats: data.showStats ?? true,
      };
    }

    // Convert back to string enums for response
    const profileVisibility = updated.profile_visibility === true ? 'public' : 
                              updated.profile_visibility === false ? 'private' : 'public';
    const workoutVisibility = updated.workout_visibility === true ? 'public' : 
                              updated.workout_visibility === false ? 'private' : 'public';

    return {
      profileVisibility,
      workoutVisibility,
      showStats: updated.progress_visibility ?? true,
    };
  },
};

