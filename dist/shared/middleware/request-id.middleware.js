/**
 * Request ID Middleware
 * Adds a unique request ID to each request for traceability
 */
import { randomUUID } from 'crypto';
export const requestIdMiddleware = async (c, next) => {
    // Check if request ID already exists (from load balancer, etc.)
    const existingId = c.req.header('X-Request-ID') || c.req.header('X-Correlation-ID');
    // Generate or use existing request ID
    const requestId = existingId || randomUUID();
    // Set request ID in context for use in handlers and logging
    c.set('requestId', requestId);
    // Add request ID to response headers for client-side tracing
    c.header('X-Request-ID', requestId);
    await next();
};
