/**
 * User Service
 * Business logic layer for user management operations
 */

import { selectRow, selectRows, updateRow } from '../../core/config/database-helpers.js';
import { supabase } from '../../core/config/database.js';
import { AppError, ErrorCode } from '../../core/utils/error-types.js';
import type * as Unified from '../../core/types/unified.types.js';
import type { UpdateProfileData, SearchUsersFilters } from './types.js';

/**
 * Helper function to map profile row to Unified.UserProfile
 */
function mapProfileRowToUserProfile(row: any): Unified.UserProfile {
  return {
    id: row.id,
    email: row.email || '',
    username: row.username,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
    bio: row.bio,
    date_of_birth: row.date_of_birth,
    gender: row.gender,
    fitness_level: row.fitness_level || 'beginner',
    timezone: row.timezone || 'UTC',
    language: row.language || 'en',
    is_active: row.is_active ?? true,
    email_verified: row.email_verified ?? false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const userService = {
  /**
   * Gets the complete profile of a user by their ID
   */
  async getProfile(userId: string): Promise<Unified.UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get profile: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return mapProfileRowToUserProfile(data);
  },

  /**
   * Gets a user's public profile by ID
   */
  async getById(id: string): Promise<Unified.UserProfile | null> {
    const { data, error } = await selectRow('profiles', (q) => q.eq('id', id));

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get user: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return mapProfileRowToUserProfile(data);
  },

  /**
   * Updates a user's profile
   */
  async updateProfile(userId: string, data: UpdateProfileData): Promise<Unified.UserProfile> {
    // Remove fields that don't belong to profiles table
    const { height, weight, ...profileData } = data as any;

    const updateData: any = { ...profileData, updated_at: new Date().toISOString() };

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data: updated, error } = await updateRow('profiles', updateData, (q) => q.eq('id', userId));

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to update profile: ${error.message}`);
    }

    if (!updated) {
      throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
    }

    return mapProfileRowToUserProfile(updated);
  },

  /**
   * Search users by username or full name
   */
  async search(filters: SearchUsersFilters): Promise<{ users: Unified.UserProfile[]; total: number }> {
    let query = supabase.from('profiles').select('*', { count: 'exact' });

    if (filters.q) {
      query = query.or(`username.ilike.%${filters.q}%,full_name.ilike.%${filters.q}%`);
    }

    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;

    const { data, count, error } = await query.range(from, to).order('username');

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to search users: ${error.message}`);
    }

    return {
      users: (data || []).map(mapProfileRowToUserProfile),
      total: count || 0,
    };
  },

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    try {

      // 1. Completed workouts count
      const { count: workoutsCount, error: workoutsError } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      if (workoutsError) {
        // Don't throw, just return 0
      }

      // 2. Created exercises count
      const { count: exercisesCount, error: exercisesError } = await supabase
        .from('exercises')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId);

      if (exercisesError) {
        // Don't throw
      }

      // 3. Total training time (sum of duration_seconds)
      const { data: timeData, error: timeError } = await supabase
        .from('workout_sessions')
        .select('duration_seconds')
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      if (timeError) {
        // Ignore error
      }

      const totalMinutes = timeData
        ? Math.round(timeData.reduce((acc: number, curr: any) => acc + (curr.duration_seconds || 0), 0) / 60)
        : 0;

      // 4. Achievements count (mocked for now as table might differ)
      let achievementsCount = 0;

      return {
        workouts_completed: workoutsCount || 0,
        exercises_created: exercisesCount || 0,
        total_minutes: totalMinutes,
        achievements_unlocked: achievementsCount,
        streak_days: 0,
        level: 1,
      };
    } catch (error: any) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get user stats: ${error.message}`);
    }
  },
};
