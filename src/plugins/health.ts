import { createMiddleware } from 'hono/factory';
import { env } from '../core/config/env.js';

/**
 * Health check plugin
 */
export const healthPlugin = createMiddleware(async (c, next) => {
  if (c.req.path === '/health') {
    return c.json({
      status: 'ok',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    });
  }
  
  await next();
});

