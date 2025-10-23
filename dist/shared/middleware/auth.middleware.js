import { createMiddleware } from 'hono/factory';
import { verifySupabaseToken, extractToken } from '../../lib/auth.js';
import { supabase } from '../../config/supabase.js';
import { sendUnauthorized, sendError } from '../utils/response.js';
import { API_MESSAGES, ERROR_CODES } from '../constants/index.js';
import '../types/hono.types.js';
export const authMiddleware = createMiddleware(async (c, next) => {
    try {
        const authHeader = c.req.header('Authorization');
        if (!authHeader) {
            return sendUnauthorized(c, API_MESSAGES.UNAUTHORIZED);
        }
        const token = extractToken(authHeader);
        if (!token) {
            return sendUnauthorized(c, API_MESSAGES.UNAUTHORIZED);
        }
        // Verify Supabase token and get user
        const user = await verifySupabaseToken(token);
        if (!user) {
            return sendUnauthorized(c, API_MESSAGES.TOKEN_INVALID);
        }
        // Set authenticated Supabase client with user's token for RLS
        const authedSupabase = supabase;
        await authedSupabase.auth.setSession({
            access_token: token,
            refresh_token: '', // Not needed for server-side operations
        });
        // Add user info to context
        c.set('userId', user.id);
        c.set('userEmail', user.email);
        c.set('user', user);
        c.set('supabase', authedSupabase); // Supabase client with user's session
        await next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
    }
});
