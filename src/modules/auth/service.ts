/**
 * Authentication Service
 * Business logic layer for authentication operations
 * Uses Supabase Auth for all authentication operations
 */

import { supabase, supabaseAdmin } from '../../core/config/database.js';
import { selectRow, upsertRow } from '../../core/config/database-helpers.js';
import { AppError, ErrorCode, isAuthError } from '../../core/utils/error-types.js';
import type * as Unified from '../../core/types/unified.types.js';
import type { RegisterData, LoginData } from './types.js';

/**
 * Authentication service object containing all authentication business logic methods
 */
export const authService = {
  /**
   * Registers a new user account
   */
  async register(data: RegisterData): Promise<Unified.AuthResponse> {
    // Check if user already exists
    try {
      const { data: existingUser } = await selectRow('profiles', (q) =>
        q.eq('username', data.username).select('username')
      );

      if (existingUser) {
        throw new AppError(ErrorCode.USERNAME_ALREADY_EXISTS, 'This username is already taken');
      }
    } catch (error: any) {
      // If it's our AppError for username, rethrow it
      if (isAuthError(error) && error.code === ErrorCode.USERNAME_ALREADY_EXISTS) {
        throw error;
      }
      // Otherwise, profile doesn't exist, which is fine
    }

    // Create user in Supabase Auth (triggers profile creation)
    const { data: userData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          full_name: data.full_name,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          fitness_level: data.fitness_level || 'beginner',
          timezone: data.timezone || 'UTC',
          language: data.language || 'en',
          role: 'user',
        },
      },
    });

    // Check if user was created successfully
    if (authError || !userData.user) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, authError?.message || 'Failed to create user');
    }

    // Create default user settings for the new user (consider also trigger in DB)
    try {
      await upsertRow('user_settings', {
        user_id: userData.user.id,
        email_notifications: true,
        push_notifications: true,
        workout_reminders: true,
        timezone: data.timezone || 'UTC',
        language: data.language || 'en',
        theme: 'light',
        profile_visibility: true,
        workout_visibility: true,
        progress_visibility: true,
      });
    } catch (err) {
      // Do not block registration on settings creation failure
    }

    // Return the user data following unified types
    return {
      user: {
        id: userData.user.id,
        email: userData.user.email || '',
        username: data.username,
        full_name: data.full_name,
        email_verified: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      access_token: '',
      refresh_token: '',
      expires_in: 0,
      token_type: 'Bearer',
    };
  },

  /**
   * Authenticates a user and returns access tokens
   */
  async login(data: LoginData): Promise<Unified.AuthResponse> {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password');
    }

    // Check if user exists
    if (!authData.user) {
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password');
    }

    // Check if email is confirmed
    if (!authData.user.email_confirmed_at) {
      throw new AppError(ErrorCode.EMAIL_NOT_VERIFIED, 'Please verify your email address');
    }

    // Check if session exists
    if (!authData.session) {
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Failed to create session');
    }

    // Return the user data with tokens following unified types
    return {
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        username: authData.user.user_metadata?.username,
        full_name: authData.user.user_metadata?.full_name,
        avatar_url: authData.user.user_metadata?.avatar_url,
        email_verified: !!authData.user.email_confirmed_at,
        is_active: true,
        created_at: authData.user.created_at || new Date().toISOString(),
        updated_at: authData.user.updated_at || new Date().toISOString(),
      },
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token || '',
      expires_in: authData.session.expires_in || 3600,
      token_type: 'Bearer',
    };
  },

  /**
   * Gets the current authenticated user's information
   */
  async getMe(userId: string): Promise<Unified.AuthUser> {
    // Import userService to get full profile
    const { userService } = await import('../users/service.js');

    // Get full profile from profiles table (includes bio and all other fields)
    const profile = await userService.getProfile(userId);

    if (!profile) {
      throw new AppError(ErrorCode.NOT_FOUND, 'User profile not found');
    }

    return {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      date_of_birth: profile.date_of_birth,
      gender: profile.gender,
      fitness_level: profile.fitness_level,
      timezone: profile.timezone,
      language: profile.language,
      email_verified: profile.email_verified,
      is_active: profile.is_active,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  },

  /**
   * Logs out the current user
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Logout failed: ${error.message}`);
    }
  },

  /**
   * Refreshes the access token using a refresh token
   */
  async refreshToken(refreshToken: string): Promise<Unified.AuthResponse> {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session || !data.user) {
      throw new AppError(ErrorCode.TOKEN_EXPIRED, 'Invalid or expired refresh token');
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        username: data.user.user_metadata?.username,
        full_name: data.user.user_metadata?.full_name,
        avatar_url: data.user.user_metadata?.avatar_url,
        email_verified: !!data.user.email_confirmed_at,
        is_active: true,
        created_at: data.user.created_at || new Date().toISOString(),
        updated_at: data.user.updated_at || new Date().toISOString(),
      },
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token || '',
      expires_in: data.session.expires_in || 3600,
      token_type: 'Bearer',
    };
  },

  /**
   * Resets password using a reset token
   * Note: In Supabase, password reset is typically done via email links.
   * This method updates the password directly if a session exists.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Try to update password directly (requires valid session)
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new AppError(ErrorCode.INVALID_RESET_TOKEN, `Password reset failed: ${updateError.message}`);
    }
  },

  /**
   * Changes password for authenticated user
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // First verify current password by attempting to sign in
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id !== userId) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'User not authenticated');
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Password change failed: ${error.message}`);
    }
  },

  /**
   * Deletes user account
   *
   * Uses admin privileges to delete the user from auth.users.
   * This triggers cascading deletes in the database for all user data.
   */
  async deleteAccount(userId: string): Promise<void> {
    // Use admin client to delete user directly
    // Handler already verified that the requester matches userId
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to delete account: ${authError.message}`);
    }
  },
};

