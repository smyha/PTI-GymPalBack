/**
 * Rate Limiting Middleware
 * In-memory rate limiting per IP address
 * For production, consider using Redis for distributed rate limiting
 */
import { HTTPException } from 'hono/http-exception';
import { env } from '../../config/env.js';
// In-memory store for rate limiting
// Key: IP address, Value: { count, resetTime }
const rateLimitStore = new Map();
/**
 * Extracts client IP from request headers
 */
const getClientIP = (c) => {
    return (c.req.header('x-forwarded-for') ||
        c.req.header('x-real-ip') ||
        'unknown');
};
/**
 * Rate limiting middleware
 * Limits requests per IP address based on configured window and max requests
 */
export const rateLimitMiddleware = async (c, next) => {
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
            resetTime: now + windowMs
        });
    }
    else {
        // Increment counter
        entry.count++;
        // Check if limit exceeded
        if (entry.count > maxRequests) {
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
    const currentEntry = rateLimitStore.get(clientIP);
    const remaining = Math.max(0, maxRequests - currentEntry.count);
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', new Date(currentEntry.resetTime).toISOString());
    await next();
};
export default rateLimitMiddleware;
