/**
 * Auth Library
 * Utilities for Supabase Auth integration
 * We use Supabase Auth tokens directly - no custom JWT generation
 */

import { supabase } from '../config/supabase.js';

// ============================================================================
// TYPES
// ============================================================================

// RegisterUserDTO
export interface RegisterUserDTO {
  email: string;
  password: string;
  username: string;
  full_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  terms_accepted: boolean;
  privacy_policy_accepted: boolean;
  bio?: string;
  avatar_url?: string;
  fitness_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  timezone?: string;
  language?: string;
}

// LoginUserDTO
export interface LoginUserDTO {
  email: string;
  password: string;
}

// AuthResponse
export interface AuthResponse {
  user: any;
  token?: string;
  expiresIn?: string;
  [key: string]: any; 
}

// ============================================================================
// AUTH RESPONSE HELPERS
// ============================================================================


/**
 * Extract token from Authorization header
 * @param authHeader - The Authorization header value
 * @returns The extracted token or null
 */
export const extractToken = (authHeader: string | undefined): string | null => {
  // If no auth header, return null
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    // If not a valid Bearer token, return null
    return null;
  }

  // Return the token
  return parts[1];
};

/**
 * Verify Supabase token and get user
 * @param token - The Supabase access token
 * @returns The user object or null
 */
export const verifySupabaseToken = async (token: string) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      // If there is an error or no user, return null
      return null;
    }

    // Return the user
    return user;
  } catch (error) {
    console.error('Token verification failed:', error);
    // If there is an error, return null
    return null;
  }
};


