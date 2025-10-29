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
 */
export const rateLimit = createMiddleware(async (c, next) => {
  const clientIP = getClientIP(c);
  const windowMs = parseInt(env.RATE_LIMIT_WINDOW_MS);
  const maxRequests = parseInt(env.RATE_LIMIT_MAX_REQUESTS);
  const now = Date.now();

  // Get or create rate limit entry
  const entry = rateLimitStore.get(clientIP);

  if (!entry || now > entry.resetTime) {
    // First request or window expired - reset counter
    rateLimitStore.set(clientIP, {
      count: 1,
      resetTime: now + windowMs,
    });
  } else {
    // Increment counter
    entry.count++;

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      throw new HTTPException(429, {
        message: 'Too many requests',
      });
    }
  }

  await next();
});

