/**
 * Auth Library
 * Utilities for Supabase Auth integration
 * We use Supabase Auth tokens directly - no custom JWT generation
 */
import { supabase } from '../core/config/database.js';
// ============================================================================
// AUTH RESPONSE HELPERS
// ============================================================================
/**
 * Extract token from Authorization header
 * @param authHeader - The Authorization header value
 * @returns The extracted token or null
 */
export const extractToken = (authHeader) => {
    // If no auth header, return null
    if (!authHeader)
        return null;
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
export const verifySupabaseToken = async (token) => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            // If there is an error or no user, return null
            return null;
        }
        // Return the user
        return user;
    }
    catch (error) {
        console.error('Token verification failed:', error);
        // If there is an error, return null
        return null;
    }
};
