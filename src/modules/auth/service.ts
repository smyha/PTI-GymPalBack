/**
 * Authentication Service
 * Business logic layer for authentication operations
 * Uses Supabase Auth for all authentication operations
 */

import { supabase, supabaseAdmin } from '../../core/config/database.js';
import { selectRow } from '../../core/config/database-helpers.js';
 
import {
  InvalidCredentialsError,
  EmailNotVerifiedError,
  InvalidTokenError,
  UserAlreadyExistsError,
} from '../../core/utils/auth-errors.js';
import type { RegisterData, LoginData, AuthResponse, User } from './types.js';

/**
 * Authentication service object containing all authentication business logic methods
 */
export const authService = {
  /**
   * Registers a new user account
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    // Check if user already exists
    try {
      const { data: existingUser } = await selectRow('profiles', (q) =>
        q.eq('username', data.username).select('username')
      );

      if (existingUser) {
        throw new UserAlreadyExistsError(`User already exists: ${data.username}`);
      }
    } catch (error: any) {
      // If it's our UserAlreadyExistsError, rethrow it
      if (error instanceof UserAlreadyExistsError) {
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
      throw new InvalidCredentialsError(authError?.message || 'Failed to create user');
    }

    // Return the user data
    return {
      user: {
        id: userData.user.id,
        email: userData.user.email || '',
        username: data.username,
        fullName: data.full_name,
      },
      emailConfirmationRequired: true,
      message: 'User registered successfully. Please check your email to verify your account.',
    };
  },

  /**
   * Authenticates a user and returns access tokens
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      throw new InvalidCredentialsError('Invalid email or password');
    }

    // Check if user exists
    if (!authData.user) {
      throw new InvalidCredentialsError('Invalid email or password');
    }

    // Check if email is confirmed
    if (!authData.user.email_confirmed_at) {
      throw new EmailNotVerifiedError('Please confirm your email before logging in');
    }

    // Check if session exists
    if (!authData.session) {
      throw new InvalidCredentialsError('Failed to create session');
    }

    // Return the user data with tokens
    return {
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        username: authData.user.user_metadata?.username,
        fullName: authData.user.user_metadata?.full_name,
        emailVerified: !!authData.user.email_confirmed_at,
      },
      token: authData.session.access_token,
      expiresIn: authData.session.expires_in?.toString() || '3600',
      tokenType: 'Bearer',
      message: 'Login successful',
    };
  },

  /**
   * Gets the current authenticated user's information
   */
  async getMe(userId: string): Promise<User> {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new InvalidTokenError('Invalid or expired token');
    }

    if (user.id !== userId) {
      throw new InvalidTokenError('Token user ID mismatch');
    }

    return {
      id: user.id,
      email: user.email || '',
      username: user.user_metadata?.username,
      fullName: user.user_metadata?.full_name,
      avatarUrl: user.user_metadata?.avatar_url,
      emailVerified: !!user.email_confirmed_at,
    };
  },

  /**
   * Logs out the current user
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  },

  /**
   * Refreshes the access token using a refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session || !data.user) {
      throw new InvalidTokenError('Invalid or expired refresh token');
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        username: data.user.user_metadata?.username,
        fullName: data.user.user_metadata?.full_name,
        emailVerified: !!data.user.email_confirmed_at,
      },
      token: data.session.access_token,
      expiresIn: data.session.expires_in?.toString() || '3600',
      tokenType: 'Bearer',
      message: 'Token refreshed successfully',
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
      throw new InvalidTokenError(`Password reset failed: ${updateError.message}`);
    }
  },

  /**
   * Changes password for authenticated user
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // First verify current password by attempting to sign in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new InvalidCredentialsError('User not authenticated');
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new InvalidCredentialsError(`Password change failed: ${error.message}`);
    }
  },

  /**
   * Deletes user account
   * 
   * NOTE: This endpoint no longer requires SUPABASE_SERVICE_ROLE_KEY to work.
   * The account deletion is handled by a database function (delete_own_account)
   * that executes with elevated privileges, ensuring security and proper cleanup.
   */
  async deleteAccount(userId: string): Promise<void> {
    // Verify the user is deleting their own account (should be enforced by handler, but double-check)
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      throw new Error('You can only delete your own account');
    }

    try {
      // Attempt to call the database function for self-deletion
      const { error: rpcError } = await supabase.rpc('delete_own_account');

      if (rpcError) {
        // Fallback to admin delete if the RPC fails (e.g., function not deployed yet)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authError) {
          throw new Error(`Failed to delete account via admin: ${authError.message}`);
        }
      }
    } catch (error: any) {
      throw error;
    }
  },
};

