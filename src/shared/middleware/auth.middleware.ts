/**
 * Authentication Middleware
 * Validates JWT tokens and sets user context
 */

import { createMiddleware } from 'hono/factory';
import { verifySupabaseToken, extractToken } from '../../lib/auth.js';
import { supabase } from '../../config/supabase.js';
import { sendUnauthorized, sendError } from '../utils/response.js';
import { API_MESSAGES, ERROR_CODES } from '../constants/index.js';
import { authLogger, logError } from '../../lib/logger.js';
import '../types/hono.types.js';

/**
 * Authenticates requests using Supabase JWT tokens
 * Sets user context (userId, userEmail, user, supabase) for authenticated requests
 */
export const authMiddleware = createMiddleware(async (c, next) => {
  try {
    // Extract authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return sendUnauthorized(c, API_MESSAGES.UNAUTHORIZED);
    }

    // Extract and validate token
    const token = extractToken(authHeader);
    if (!token) {
      return sendUnauthorized(c, API_MESSAGES.UNAUTHORIZED);
    }

    // Verify token and get user data
    const user = await verifySupabaseToken(token);
    if (!user) {
      return sendUnauthorized(c, API_MESSAGES.TOKEN_INVALID);
    }

    // Set Supabase session for Row Level Security (RLS)
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: '', // Not needed for server-side operations
    });

    // Set user context for downstream handlers
    c.set('userId', user.id);
    c.set('userEmail', user.email || '');
    c.set('user', user);
    c.set('supabase', supabase);

    await next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    authLogger.error({ error: errorMessage }, 'Auth middleware error');
    if (error instanceof Error) {
      logError(error, { middleware: 'auth' });
    }
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500);
  }
});

export default authMiddleware;
