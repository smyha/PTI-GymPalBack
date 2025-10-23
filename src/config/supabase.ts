import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';
import type { Database } from '../shared/types/database.js';

// ============================================================================
// SUPABASE CLIENTS
// ============================================================================

/**
 * Supabase client for client-side operations (with anon key)
 * Used for user-facing operations that require authentication
 *
 * @ts-ignore - Database types cause complex inference issues, using any for now
 */
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
) as any;

/**
 * Supabase admin client for server-side operations (with service role key)
 * Used for administrative operations that bypass RLS
 *
 * @ts-ignore - Database types cause complex inference issues, using any for now
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
) as any;

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * Get user from JWT token
 * @param token - JWT token
 * @returns User object or null if invalid
 */
export const getUserFromToken = async (token: string) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
};

/**
 * Verify JWT token and return user data
 * @param token - JWT token
 * @returns User object or null if invalid
 */
export const verifyToken = async (token: string) => {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};
