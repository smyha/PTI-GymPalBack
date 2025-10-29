/**
 * Settings Service
 * Business logic layer for user settings operations
 */

import { selectRow, upsertRow } from '../../core/config/database-helpers.js';
import type {
  UpdateSettingsData,
  UpdateNotificationSettingsData,
  UpdatePrivacySettingsData,
} from './types.js';

export const settingsService = {
  /**
   * Gets all settings for a user
   */
  async getSettings(userId: string): Promise<any> {
    const { data, error } = await selectRow('user_settings', (q) => q.eq('user_id', userId));

    if (error) {
      throw new Error(`Failed to get settings: ${error.message}`);
    }

    return data || {};
  },

  /**
   * Updates general settings for a user
   */
  async updateSettings(userId: string, data: UpdateSettingsData): Promise<any> {
    const settingsData: any = {
      user_id: userId,
      theme: data.theme,
      language: data.language,
      timezone: data.timezone,
    };

    const { data: updated, error } = await upsertRow('user_settings', settingsData, {
      onConflict: 'user_id',
    });

    if (error) {
      throw new Error(`Failed to update settings: ${error.message}`);
    }

    return updated || {};
  },

  /**
   * Gets notification settings for a user
   */
  async getNotificationSettings(userId: string): Promise<any> {
    const { data, error } = await selectRow('user_settings', (q) => q.eq('user_id', userId));

    if (error) {
      throw new Error(`Failed to get notification settings: ${error.message}`);
    }

    if (!data) {
      return {};
    }

    return {
      email: data.email_notifications,
      push: data.push_notifications,
      sms: data.sms_notifications,
    };
  },

  /**
   * Updates notification settings for a user
   */
  async updateNotificationSettings(
    userId: string,
    data: UpdateNotificationSettingsData
  ): Promise<any> {
    const settingsData: any = {
      user_id: userId,
      email_notifications: data.email,
      push_notifications: data.push,
      sms_notifications: data.sms,
    };

    const { data: updated, error } = await upsertRow('user_settings', settingsData, {
      onConflict: 'user_id',
    });

    if (error) {
      throw new Error(`Failed to update notification settings: ${error.message}`);
    }

    return updated || {};
  },

  /**
   * Gets privacy settings for a user
   */
  async getPrivacySettings(userId: string): Promise<any> {
    const { data, error } = await selectRow('user_settings', (q) => q.eq('user_id', userId));

    if (error) {
      throw new Error(`Failed to get privacy settings: ${error.message}`);
    }

    if (!data) {
      return {};
    }

    return {
      profileVisibility: data.profile_visibility,
      workoutVisibility: data.workout_visibility,
      showStats: data.show_stats,
    };
  },

  /**
   * Updates privacy settings for a user
   */
  async updatePrivacySettings(userId: string, data: UpdatePrivacySettingsData): Promise<any> {
    const settingsData: any = {
      user_id: userId,
      profile_visibility: data.profileVisibility,
      workout_visibility: data.workoutVisibility,
      show_stats: data.showStats,
    };

    const { data: updated, error } = await upsertRow('user_settings', settingsData, {
      onConflict: 'user_id',
    });

    if (error) {
      throw new Error(`Failed to update privacy settings: ${error.message}`);
    }

    return updated || {};
  },
};

