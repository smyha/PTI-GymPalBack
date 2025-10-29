import { createMiddleware } from 'hono/factory';
import { apiLogger } from '../core/config/logger.js';

/**
 * Logging middleware
 * Logs all incoming requests
 */
export const logging = createMiddleware(async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  apiLogger.info({
    method,
    path,
    status,
    duration,
  }, `${method} ${path} - ${status} - ${duration}ms`);
});

