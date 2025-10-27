/**
 * Auth Service
 * Business logic layer for authentication operations
 * Uses Supabase Auth for all authentication operations
 */

import { supabase } from '../config/supabase.js';
import { 
  InvalidCredentialsError, 
  EmailNotVerifiedError,
  InvalidTokenError,
  UserAlreadyExistsError,
} from '../lib/auth/errors.js';
import { 
  RegisterUserDTO,
  LoginUserDTO,
  AuthResponse 
} from '../lib/auth.js';
import { authLogger, logAuthAttempt, logTokenRefresh, logError } from '../lib/logger.js';

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * Register a new user
 */
export async function registerUser(dto: RegisterUserDTO): Promise<AuthResponse> {
  authLogger.info({ email: dto.email, username: dto.username }, 'User registration attempt');
  
  // Check if user already exists
  const { data: existingUser, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', dto.username)
    .single();

  if (existingUser) {
    authLogger.warn({ username: dto.username }, 'Registration failed: username already exists');
    throw new UserAlreadyExistsError('User already exists ' + (existingUser as { username: string }).username);
  } 
  
  // Create user in Supabase Auth (triggers profile creation)
  const { data: userData, error : authError} = await supabase.auth.signUp({
    email: dto.email,
    password: dto.password,
    options: {
      data: {
        // Required fields
        username: dto.username,
        full_name: dto.full_name,
        date_of_birth: dto.date_of_birth,
        gender: dto.gender,

        // Not required fields
        bio: dto.bio || '',
        avatar_url: dto.avatar_url || '',
        fitness_level: dto.fitness_level || 'beginner',
        timezone: dto.timezone || 'UTC',
        language: dto.language || 'en',
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
      username: dto.username,
      fullName: dto.full_name,
    },
    emailConfirmationRequired: true,
  };
}

// ============================================================================
// LOGIN
// ============================================================================

/**
 * Login user with email and password
 */
export async function loginUser(dto: LoginUserDTO): Promise<AuthResponse> {
  authLogger.info({ email: dto.email }, 'User login attempt');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: dto.email,
    password: dto.password,
  });

  if (error) {
    authLogger.warn({ email: dto.email, error: error.message }, 'Login failed: invalid credentials');
    logAuthAttempt(dto.email, false);
    throw new InvalidCredentialsError('Invalid email or password');
  }

  // Check if user exists
  if (!data.user) {
    authLogger.warn({ email: dto.email }, 'Login failed: no user data');
    logAuthAttempt(dto.email, false);
    throw new InvalidCredentialsError('Invalid email or password');
  }

  // Check if email is confirmed
  if (!data.user.email_confirmed_at) {
    authLogger.warn({ email: dto.email, userId: data.user.id }, 'Login failed: email not verified');
    logAuthAttempt(dto.email, false);
    throw new EmailNotVerifiedError('Please confirm your email before logging in');
  }

  // Check if session exists
  if (!data.session) {
    authLogger.error({ email: dto.email, userId: data.user.id }, 'Login failed: no session created');
    logAuthAttempt(dto.email, false);
    throw new InvalidCredentialsError('Failed to create session');
  }

  // Log successful login
  authLogger.info({ 
    email: dto.email, 
    userId: data.user.id,
    username: data.user.user_metadata?.username 
  }, 'User login successful');
  logAuthAttempt(dto.email, true);

  // Return the user data
  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      username: data.user.user_metadata?.username,
      fullName: data.user.user_metadata?.full_name,
      emailVerified: !!data.user.email_confirmed_at,
    },
    token: data.session.access_token,
    expiresIn: data.session.expires_in.toString(),
    tokenType: 'Bearer',
  };
}

// ============================================================================
// LOGOUT
// ============================================================================

/**
 * Logout user
 */
export async function logoutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new InvalidTokenError('Failed to logout');
  }
}

// ============================================================================
// TOKEN REFRESH
// ============================================================================

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(refreshToken: string): Promise<AuthResponse> {
  if (!refreshToken) {
    throw new InvalidTokenError('Refresh token is required');
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  // Check for errors
  if (error) {
    throw new InvalidTokenError('Invalid refresh token');
  }

  // Check if session data was returned
  if (!data.session) {
    throw new InvalidTokenError('Failed to refresh token');
  }

  // Check if user data was returned
  if (!data.user) {
    throw new InvalidTokenError('Failed to refresh token');
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      username: data.user.user_metadata?.username,
      fullName: data.user.user_metadata?.full_name,
      emailVerified: !!data.user.email_confirmed_at,
    },
    token: data.session.access_token,
    expiresIn: data.session.expires_in.toString(),
    tokenType: 'Bearer',
  };
}

// ============================================================================
// PASSWORD RESET
// ============================================================================


/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new InvalidTokenError('Invalid or expired reset token');
  }
}

/**
 * Update user password
 */
export async function updatePassword(currentPassword: string, newPassword: string): Promise<void> {
  // Note: Supabase doesn't verify the old password in updateUser
  // You may need to verify it separately if needed
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new InvalidCredentialsError(error.message);
  }
}

// ============================================================================
// USER INFO
// ============================================================================

/**
 * Get current user from session token
 */
export async function getCurrentUser(token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new InvalidTokenError('Invalid or expired token');
  }

  return user;
}

// ============================================================================
// ACCOUNT DELETION
// ============================================================================

/**
 * Delete user account (both auth and profile data)
 */
export async function deleteAccount(userId: string): Promise<void> {
  // Delete user profile from database
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) {
    throw new Error(`Failed to delete profile: ${profileError.message}`);
  }

  // Delete user from Supabase Auth using admin client
  const { supabaseAdmin } = await import('../config/supabase.js');
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (authError) {
    throw new Error(`Failed to delete account: ${authError.message}`);
  }
}
