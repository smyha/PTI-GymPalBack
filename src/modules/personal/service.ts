import { supabase, supabaseAdmin } from '../../core/config/database.js';
import { selectRow, insertRow, updateRow } from '../../core/config/database-helpers.js';
import { AppError, ErrorCode } from '../../core/utils/error-types.js';
import type * as Unified from '../../core/types/unified.types.js';
import type { UpdatePersonalInfoData, UpdateFitnessProfileData, UpdateDietaryPreferencesData, UpdateUserStatsData } from './types.js';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../core/types/index.js';

export const personalService = {
  /**
   * Gets personal information for a user
   * Returns object with null values by default instead of empty object
   */
  async getPersonalInfo(userId: string, client?: SupabaseClient<Database>): Promise<Partial<Unified.UserPersonalInfo>> {
    const { data, error } = await selectRow('user_personal_info', (q) => q.eq('user_id', userId), client);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get personal info: ${error.message}`);
    }

    // Return object with null values if no data exists (instead of empty object)
    // This prevents 404 errors when user hasn't set personal info yet
    if (!data) {
      return {
        age: undefined,
        weight_kg: undefined,
        height_cm: undefined,
        body_fat_percentage: undefined,
        updated_at: new Date().toISOString(),
      };
    }

    return {
      id: data.id,
      user_id: data.user_id,
      age: data.age,
      weight_kg: data.weight_kg,
      height_cm: data.height_cm,
      bmi: data.bmi,
      body_fat_percentage: data.body_fat_percentage,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  /**
   * Updates personal information for a user
   */
  async updatePersonalInfo(userId: string, data: UpdatePersonalInfoData, client?: SupabaseClient<Database>): Promise<Partial<Unified.UserPersonalInfo>> {
    // First, check if personal info exists
    const { data: existing } = await selectRow('user_personal_info', (q) => q.eq('user_id', userId), client);

    if (existing) {
      // Update existing record
      const updateData: any = {
        age: data.age,
        weight_kg: data.weight_kg,
        height_cm: data.height_cm,
        body_fat_percentage: data.body_fat_percentage,
      };

      const { data: updated, error } = await updateRow('user_personal_info', updateData, (q) => q.eq('user_id', userId), client);

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to update personal info: ${error.message}`);
      }

      if (!updated) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update personal info');
      }

      const updatedData = updated as any;
      return {
        id: updatedData.id,
        user_id: updatedData.user_id,
        age: updatedData.age,
        weight_kg: updatedData.weight_kg,
        height_cm: updatedData.height_cm,
        bmi: updatedData.bmi,
        body_fat_percentage: updatedData.body_fat_percentage,
        created_at: updatedData.created_at,
        updated_at: updatedData.updated_at,
      };
    } else {
      // Insert new record
      const infoData: any = {
        user_id: userId,
        age: data.age,
        weight_kg: data.weight_kg,
        height_cm: data.height_cm,
        body_fat_percentage: data.body_fat_percentage,
      };

      const { data: inserted, error } = await insertRow('user_personal_info', infoData, client);

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to create personal info: ${error.message}`);
      }

      if (!inserted) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create personal info');
      }

      const insertedData = inserted as any;
      return {
        id: insertedData.id,
        user_id: insertedData.user_id,
        age: insertedData.age,
        weight_kg: insertedData.weight_kg,
        height_cm: insertedData.height_cm,
        bmi: insertedData.bmi,
        body_fat_percentage: insertedData.body_fat_percentage,
        created_at: insertedData.created_at,
        updated_at: insertedData.updated_at,
      };
    }
  },

  /**
   * Gets fitness profile for a user
   * Returns object with null values by default instead of empty object
   */
  async getFitnessProfile(userId: string, client?: SupabaseClient<Database>): Promise<any> {
    const { data, error } = await selectRow('user_fitness_profile', (q) => q.eq('user_id', userId), client);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get fitness profile: ${error.message}`);
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
  async updateFitnessProfile(userId: string, data: UpdateFitnessProfileData, client?: SupabaseClient<Database>): Promise<any> {
    // First, check if fitness profile exists
    const { data: existing } = await selectRow('user_fitness_profile', (q) => q.eq('user_id', userId), client);

    if (existing) {
      // Update existing record
      const profileData: any = {
        experience_level: data.experience_level,
        primary_goal: data.primary_goal,
        secondary_goals: data.secondary_goals,
        workout_frequency: data.workout_frequency,
        preferred_workout_duration: data.preferred_workout_duration,
        available_equipment: data.available_equipment,
        workout_preferences: data.workout_preferences,
        injury_history: data.injury_history,
        medical_restrictions: data.medical_restrictions,
        fitness_goals_timeline: data.fitness_goals_timeline,
        motivation_level: data.motivation_level,
      };

      // Remove undefined values
      Object.keys(profileData).forEach(key => profileData[key] === undefined && delete profileData[key]);

      const { data: updated, error } = await updateRow('user_fitness_profile', profileData, (q) => q.eq('user_id', userId), client);

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to update fitness profile: ${error.message}`);
      }

      if (!updated) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update fitness profile');
      }

      return updated;
    } else {
      // Insert new record
      const profileData: any = {
        user_id: userId,
        experience_level: data.experience_level,
        primary_goal: data.primary_goal,
        secondary_goals: data.secondary_goals,
        workout_frequency: data.workout_frequency,
        preferred_workout_duration: data.preferred_workout_duration,
        available_equipment: data.available_equipment,
        workout_preferences: data.workout_preferences,
        injury_history: data.injury_history,
        medical_restrictions: data.medical_restrictions,
        fitness_goals_timeline: data.fitness_goals_timeline,
        motivation_level: data.motivation_level,
      };

      // Remove undefined values
      Object.keys(profileData).forEach(key => profileData[key] === undefined && delete profileData[key]);

      const { data: inserted, error } = await insertRow('user_fitness_profile', profileData, client);

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to create fitness profile: ${error.message}`);
      }

      if (!inserted) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create fitness profile');
      }

      return inserted;
    }
  },

  /**
   * Gets dietary preferences for a user
   * Returns object with null values by default instead of empty object
   */
  async getDietaryPreferences(userId: string, client?: SupabaseClient<Database>): Promise<any> {
    const { data, error } = await selectRow('user_dietary_preferences', (q) => q.eq('user_id', userId), client);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get dietary preferences: ${error.message}`);
    }

    // Return object with null values if no data exists
    return data || {
      dietary_restrictions: null,
      allergies: null,
      preferred_cuisines: null,
      disliked_foods: null,
      daily_calorie_target: null,
      protein_target_percentage: null,
      carb_target_percentage: null,
      fat_target_percentage: null,
      meal_preferences: null,
      updated_at: null,
    };
  },

  /**
   * Updates dietary preferences for a user
   */
  async updateDietaryPreferences(userId: string, data: UpdateDietaryPreferencesData, client?: SupabaseClient<Database>): Promise<any> {
    // First, check if dietary preferences exist
    const { data: existing } = await selectRow('user_dietary_preferences', (q) => q.eq('user_id', userId), client);

    if (existing) {
      // Update existing record
      const preferencesData: any = {
        dietary_restrictions: data.dietary_restrictions,
        allergies: data.allergies,
        preferred_cuisines: data.preferred_cuisines,
        disliked_foods: data.disliked_foods,
        daily_calorie_target: data.daily_calorie_target,
        protein_target_percentage: data.protein_target_percentage,
        carb_target_percentage: data.carb_target_percentage,
        fat_target_percentage: data.fat_target_percentage,
        meal_preferences: data.meal_preferences,
      };

      // Remove undefined values
      Object.keys(preferencesData).forEach(key => preferencesData[key] === undefined && delete preferencesData[key]);

      const { data: updated, error } = await updateRow('user_dietary_preferences', preferencesData, (q) => q.eq('user_id', userId), client);

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to update dietary preferences: ${error.message}`);
      }

      if (!updated) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update dietary preferences');
      }

      return updated;
    } else {
      // Insert new record
      const preferencesData: any = {
        user_id: userId,
        dietary_restrictions: data.dietary_restrictions,
        allergies: data.allergies,
        preferred_cuisines: data.preferred_cuisines,
        disliked_foods: data.disliked_foods,
        daily_calorie_target: data.daily_calorie_target,
        protein_target_percentage: data.protein_target_percentage,
        carb_target_percentage: data.carb_target_percentage,
        fat_target_percentage: data.fat_target_percentage,
        meal_preferences: data.meal_preferences,
      };

      // Remove undefined values
      Object.keys(preferencesData).forEach(key => preferencesData[key] === undefined && delete preferencesData[key]);

      const { data: inserted, error } = await insertRow('user_dietary_preferences', preferencesData, client);

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to create dietary preferences: ${error.message}`);
      }

      if (!inserted) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create dietary preferences');
      }

      return inserted;
    }
  },

  /**
   * Gets user stats for a user
   * Returns the most recent stats entry
   */
  async getUserStats(userId: string, client?: SupabaseClient<Database>): Promise<any> {
    const supabaseClient = client || supabase;
    const { data, error } = await supabaseClient
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get user stats: ${error.message}`);
    }

    // Return object with null values if no data exists
    return data || {
      height_cm: null,
      weight_kg: null,
      body_fat_percentage: null,
      target_weight_kg: null,
      recorded_at: null,
    };
  },

  /**
   * Updates user stats for a user
   * Creates a new entry in user_stats (historical tracking)
   */
  async updateUserStats(userId: string, data: UpdateUserStatsData, client?: SupabaseClient<Database>): Promise<any> {
    const statsData: any = {
      user_id: userId,
      height_cm: data.height_cm,
      weight_kg: data.weight_kg,
      body_fat_percentage: data.body_fat_percentage,
      target_weight_kg: data.target_weight_kg,
      recorded_at: data.recorded_at || new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(statsData).forEach(key => statsData[key] === undefined && delete statsData[key]);

    const { data: inserted, error } = await insertRow('user_stats', statsData, client);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to create user stats: ${error.message}`);
    }

    if (!inserted) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create user stats');
    }

    return inserted;
  },
};
