import { createMiddleware } from 'hono/factory';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendUnauthorized } from '../core/utils/response.js';
import { API_MESSAGES, ERROR_CODES } from '../core/constants/api.js';
import { logger, authLogger } from '../core/config/logger.js';
import { verifySupabaseToken, extractToken } from '../core/utils/auth.js';
import { env } from '../core/config/env.js';
import type { Database } from '../core/types/index.js';

/**
 * Authentication middleware
 * Validates JWT tokens and sets user context
 * Creates a per-request Supabase client with proper RLS context
 */
export const auth = createMiddleware(async (c, next) => {
  try {
    // Try to extract token from Authorization header first
    const authHeader = c.req.header('Authorization');
    let token: string | null = null;
    if (authHeader) {
      token = extractToken(authHeader);
    }

    // If no Authorization header token, try cookies (access_token or gp_access_token)
    if (!token) {
      const cookieHeader = c.req.header('cookie') || c.req.header('Cookie') || '';
      if (cookieHeader) {
        // simple cookie parse: find access_token or gp_access_token
        const match = cookieHeader.match(/(?:^|; )(?:gp_access_token|access_token)=([^;]+)/i);
        if (match) token = decodeURIComponent(match[1]);
      }
    }

    if (!token) {
      return sendUnauthorized(c, API_MESSAGES.UNAUTHORIZED);
    }

    // Verify token and get user data
    const user = await verifySupabaseToken(token);
    if (!user) {
      return sendUnauthorized(c, ERROR_CODES.TOKEN_INVALID);
    }

    // Create a per-request Supabase client with the user's token
    // This ensures RLS policies can properly identify the authenticated user via auth.uid()
    const userSupabase: SupabaseClient<Database> = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Set user context for downstream handlers
    c.set('userId', user.id);
    c.set('userEmail', user.email || '');
    c.set('user', user);
    c.set('supabase', userSupabase);

    await next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    authLogger.error({ error: errorMessage }, 'Auth middleware error');
    logger.error({ error }, 'Auth middleware failed');
    return sendUnauthorized(c, API_MESSAGES.UNAUTHORIZED);
  }
});

