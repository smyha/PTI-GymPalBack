import { createMiddleware } from 'hono/factory';
import { supabase } from '../core/config/database.js';
import { sendUnauthorized } from '../core/utils/response.js';
import { API_MESSAGES, ERROR_CODES } from '../core/constants/api.js';
import { logger, authLogger } from '../core/config/logger.js';
import { verifySupabaseToken, extractToken } from '../core/utils/auth.js';

/**
 * Authentication middleware
 * Validates JWT tokens and sets user context
 */
export const auth = createMiddleware(async (c, next) => {
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
      return sendUnauthorized(c, ERROR_CODES.TOKEN_INVALID);
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
    logger.error({ error }, 'Auth middleware failed');
    return sendUnauthorized(c, API_MESSAGES.UNAUTHORIZED);
  }
});

