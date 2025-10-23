import { HTTPException } from 'hono/http-exception';
import { env } from '../../config/env.js';
// Simple in-memory rate limiting store
const rateLimitStore = new Map();
// Rate limiting middleware
export const rateLimitMiddleware = async (c, next) => {
    const clientIP = (c.req.header('x-forwarded-for') ||
        c.req.header('x-real-ip') ||
        'unknown');
    const windowMs = parseInt(env.RATE_LIMIT_WINDOW_MS);
    const maxRequests = parseInt(env.RATE_LIMIT_MAX_REQUESTS);
    const now = Date.now();
    const resetTime = now + windowMs;
    // Get or create rate limit entry for this IP
    const entry = rateLimitStore.get(clientIP);
    if (!entry || now > entry.resetTime) {
        // First request or window has expired
        rateLimitStore.set(clientIP, { count: 1, resetTime });
    }
    else {
        // Increment count
        entry.count++;
        if (entry.count > maxRequests) {
            // Rate limit exceeded
            const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
            throw new HTTPException(429, {
                message: 'Too many requests',
                cause: {
                    retryAfter,
                    limit: maxRequests,
                    remaining: 0,
                    resetTime: new Date(entry.resetTime).toISOString(),
                },
            });
        }
    }
    // Add rate limit headers
    const remaining = Math.max(0, maxRequests - (entry?.count || 1));
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', new Date(entry?.resetTime || resetTime).toISOString());
    await next();
};
