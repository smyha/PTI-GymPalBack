import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { env } from '../core/config/env.js';
import { sendError } from '../core/utils/response.js';
import { ERROR_CODES } from '../core/constants/api.js';

// In-memory store for rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Extracts client IP from request headers
 */
const getClientIP = (c: any): string => {
  return (
    c.req.header('x-forwarded-for') ||
    c.req.header('x-real-ip') ||
    'unknown'
  );
};

/**
 * Rate limiting middleware
 * 
 * Uses user ID for authenticated requests to provide better rate limiting
 * for authenticated users vs anonymous users. For authenticated requests,
 * uses user ID; for anonymous requests, uses IP address.
 */
export const rateLimit = createMiddleware(async (c, next) => {
  // Use user ID if authenticated (may not be set if auth middleware runs after)
  // Otherwise fall back to IP address
  let identifier: string;
  try {
    const user = c.get('user') as { id?: string } | undefined;
    identifier = user?.id || getClientIP(c);
  } catch {
    // If user not in context yet (auth middleware runs after), use IP
    identifier = getClientIP(c);
  }
  
  const windowMs = parseInt(env.RATE_LIMIT_WINDOW_MS);
  const maxRequests = parseInt(env.RATE_LIMIT_MAX_REQUESTS);
  const now = Date.now();

  // Get or create rate limit entry
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    // First request or window expired - reset counter
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
  } else {
    // Increment counter
    entry.count++;

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      // Return proper error response instead of throwing 429
      return c.json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
          retryAfter,
        },
      }, 429);
    }
  }

  await next();
});

