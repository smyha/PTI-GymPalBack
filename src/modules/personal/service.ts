/**
 * Personal Service
 * Business logic layer for personal information and fitness profile operations
 */

import { selectRow, upsertRow } from '../../core/config/database-helpers.js';
import type { UpdatePersonalInfoData, UpdateFitnessProfileData } from './types.js';

export const personalService = {
  /**
   * Gets personal information for a user
   */
  async getPersonalInfo(userId: string): Promise<any> {
    const { data, error } = await selectRow('user_personal_info', (q) => q.eq('user_id', userId));

    if (error) {
      throw new Error(`Failed to get personal info: ${error.message}`);
    }

    return data || {};
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
   */
  async getFitnessProfile(userId: string): Promise<any> {
    const { data, error } = await selectRow('user_fitness_profile', (q) => q.eq('user_id', userId));

    if (error) {
      throw new Error(`Failed to get fitness profile: ${error.message}`);
    }

    return data || {};
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

