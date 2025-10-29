/**
 * User Service
 * Business logic layer for user management operations
 */

import { selectRow, selectRows, updateRow } from '../../core/config/database-helpers.js';
import { supabase } from '../../core/config/database.js';
import type { UpdateProfileData, SearchUsersFilters, UserProfile } from './types.js';

/**
 * Helper function to map profile row to UserProfile
 */
function mapProfileRowToUserProfile(row: any): UserProfile {
  return {
    id: row.id,
    username: row.username,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
    bio: row.bio,
    fitness_level: row.fitness_level,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const userService = {
  /**
   * Gets the complete profile of a user by their ID
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await selectRow('profiles', (q) => q.eq('id', userId));

    if (error) {
      throw new Error(`Failed to get profile: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return mapProfileRowToUserProfile(data);
  },

  /**
   * Gets a user's public profile by ID
   */
  async getById(id: string): Promise<UserProfile | null> {
    const { data, error } = await selectRow('profiles', (q) => q.eq('id', id));

    if (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return mapProfileRowToUserProfile(data);
  },

  /**
   * Updates a user's profile
   */
  async updateProfile(userId: string, data: UpdateProfileData): Promise<UserProfile> {
    const updateData: any = {};

    if (data.full_name !== undefined) updateData.full_name = data.full_name;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.fitness_level !== undefined) updateData.fitness_level = data.fitness_level;
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
    if (data.date_of_birth !== undefined) updateData.date_of_birth = data.date_of_birth;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.height !== undefined) updateData.height = data.height;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.language !== undefined) updateData.language = data.language;

    const { data: updated, error } = await updateRow('profiles', updateData, (q) => q.eq('id', userId));

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    if (!updated) {
      throw new Error('Profile not found');
    }

    return mapProfileRowToUserProfile(updated);
  },

  /**
   * Searches for users by query string
   */
  async search(filters: SearchUsersFilters): Promise<UserProfile[]> {
    const { q, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const { data, error } = await selectRows('profiles', (query) =>
      query
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .range(offset, offset + limit - 1)
    );

    if (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }

    return (data || []).map(mapProfileRowToUserProfile);
  },

  /**
   * Gets user statistics
   */
  async getUserStats(userId: string): Promise<any> {
    // Get workout count
    const { count: workoutCount } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get exercise count
    const { count: exerciseCount } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get post count
    const { count: postCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      workout_count: workoutCount || 0,
      exercise_count: exerciseCount || 0,
      post_count: postCount || 0,
    };
  },
};

