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

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * Register a new user
 */
export async function registerUser(dto: RegisterUserDTO): Promise<AuthResponse> {
  
  // Check if user already exists
  const { data: existingUser, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', dto.username)
    .single();

  if (existingUser) {
    throw new UserAlreadyExistsError('User already exists ' + existingUser.username);
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
  if (authError) {
    throw new InvalidCredentialsError(authError.message);
  }

  // Return the user data
  return {
    user: {
      id: userData.user.id, 
      email: userData.user.email,
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
  const { data, error } = await supabase.auth.signInWithPassword({
    email: dto.email,
    password: dto.password,
  });

  if (error) {
    throw new InvalidCredentialsError('Invalid email or password');
  }

  if (!data.user) {
    throw new InvalidCredentialsError('Invalid email or password');
  }

  if (!data.user.email_confirmed_at) {
    throw new EmailNotVerifiedError('Please confirm your email before logging in');
  }

  if (!data.session) {
    throw new InvalidCredentialsError('Failed to create session');
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
export async function updatePassword(newPassword: string): Promise<void> {
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
