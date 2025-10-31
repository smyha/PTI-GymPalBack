/**
 * Personal Service
 * Business logic layer for personal information and fitness profile operations
 */

import { selectRow, upsertRow } from '../../core/config/database-helpers.js';
import type { UpdatePersonalInfoData, UpdateFitnessProfileData } from './types.js';

export const personalService = {
  /**
   * Gets personal information for a user
   * Returns object with null values by default instead of empty object
   */
  async getPersonalInfo(userId: string): Promise<any> {
    const { data, error } = await selectRow('user_personal_info', (q) => q.eq('user_id', userId));

    if (error) {
      throw new Error(`Failed to get personal info: ${error.message}`);
    }

    // Return object with null values if no data exists (instead of empty object)
    // This prevents 404 errors when user hasn't set personal info yet
    return data || {
      age: null,
      weight_kg: null,
      height_cm: null,
      body_fat_percentage: null,
      updated_at: null,
    };
  },

  /**
   * Updates personal information for a user
   */
  async updatePersonalInfo(userId: string, data: UpdatePersonalInfoData): Promise<any> {
    const infoData: any = {
      user_id: userId,
      age: data.age,
      weight_kg: data.weight_kg,
      height_cm: data.height_cm,
      body_fat_percentage: data.body_fat_percentage,
    };

    const { data: updated, error } = await upsertRow('user_personal_info', infoData, {
      onConflict: 'user_id',
    });

    if (error) {
      throw new Error(`Failed to update personal info: ${error.message}`);
    }

    return updated || {};
  },

  /**
   * Gets fitness profile for a user
   * Returns object with null values by default instead of empty object
   */
  async getFitnessProfile(userId: string): Promise<any> {
    const { data, error } = await selectRow('user_fitness_profile', (q) => q.eq('user_id', userId));

    if (error) {
      throw new Error(`Failed to get fitness profile: ${error.message}`);
    }

    // Return object with null values if no data exists (instead of empty object)
    return data || {
      experience_level: null,
      primary_goal: null,
      secondary_goals: null,
      workout_frequency: null,
      updated_at: null,
    };
  },

  /**
   * Updates fitness profile for a user
   */
  async updateFitnessProfile(userId: string, data: UpdateFitnessProfileData): Promise<any> {
    const profileData: any = {
      user_id: userId,
      experience_level: data.experience_level,
      primary_goal: data.primary_goal,
      secondary_goals: data.secondary_goals,
      workout_frequency: data.workout_frequency,
    };

    const { data: updated, error } = await upsertRow('user_fitness_profile', profileData, {
      onConflict: 'user_id',
    });

    if (error) {
      throw new Error(`Failed to update fitness profile: ${error.message}`);
    }

    return updated || {};
  },
};

