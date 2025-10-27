/**
 * Logging Middleware for Hono
 * Provides request/response logging with performance metrics
 */

import type { HonoContext, HonoNext } from '../types/hono.types.js';
import { logger, logRequest, logError, logPerformance } from '../../lib/logger.js';

export const loggingMiddleware = async (c: HonoContext, next: HonoNext) => {
  const start = Date.now();
  const method = c.req.method;
  const url = c.req.url;
  const userAgent = c.req.header('user-agent') || 'unknown';
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  
  // Log incoming request in npm-style format
  const timestamp = new Date().toISOString();
  const requestId = c.get('requestId') || 'unknown';
  
  // Log request start
  console.log(`→ ${method} ${url} ${timestamp} [${requestId}]`);

  try {
    await next();
    
    const duration = Date.now() - start;
    const statusCode = c.res.status;
    
    // Determine status color and arrow
    let statusColor = '';
    let arrow = '→';
    
    if (statusCode >= 200 && statusCode < 300) {
      statusColor = '\x1b[32m'; // Green
      arrow = '✓';
    } else if (statusCode >= 300 && statusCode < 400) {
      statusColor = '\x1b[33m'; // Yellow
      arrow = '→';
    } else if (statusCode >= 400 && statusCode < 500) {
      statusColor = '\x1b[31m'; // Red
      arrow = '✗';
    } else if (statusCode >= 500) {
      statusColor = '\x1b[31m'; // Red
      arrow = '✗';
    }
    
    const resetColor = '\x1b[0m';
    
    // Log response in npm-style format
    console.log(`${arrow} ${statusColor}${statusCode}${resetColor} ${method} ${url} ${duration}ms [${requestId}]`);
    
    // Log structured data
    logRequest(
      { method, url, headers: { 'user-agent': userAgent }, connection: { remoteAddress: ip } },
      { statusCode },
      duration
    );
    
    // Log performance if request took longer than 1 second
    if (duration > 1000) {
      logPerformance('slow_request', duration, {
        method,
        url,
        statusCode,
      });
    }
    
  } catch (error) {
    const duration = Date.now() - start;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log error in npm-style format
    console.log(`✗ \x1b[31mERROR\x1b[0m ${method} ${url} ${duration}ms [${requestId}] - ${errorMessage}`);

    // Log structured data
    if (error instanceof Error) {
      logError(error, {
        method,
        url,
        duration,
        requestId: c.get('requestId'),
      });
    }

    // Re-throw the error to be handled by error middleware
    throw error;
  }
};

// Specialized logging middleware for authentication routes
export const authLoggingMiddleware = async (c: HonoContext, next: HonoNext) => {
  const start = Date.now();
  const method = c.req.method;
  const url = c.req.url;
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  
  logger.info({
    method,
    url,
    ip,
    requestId: c.get('requestId'),
    type: 'auth_request',
  }, `Auth request: ${method} ${url}`);

  try {
    await next();
    
    const duration = Date.now() - start;
    const statusCode = c.res.status;
    
    logger.info({
      method,
      url,
      statusCode,
      duration,
      requestId: c.get('requestId'),
      type: 'auth_response',
    }, `Auth response: ${statusCode} in ${duration}ms`);
    
  } catch (error) {
    const duration = Date.now() - start;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error({
      method,
      url,
      error: errorMessage,
      duration,
      requestId: c.get('requestId'),
      type: 'auth_error',
    }, `Auth error: ${errorMessage}`);

    throw error;
  }
};

// Logging middleware for API routes
export const apiLoggingMiddleware = async (c: HonoContext, next: HonoNext) => {
  const start = Date.now();
  const method = c.req.method;
  const url = c.req.url;
  const userAgent = c.req.header('user-agent') || 'unknown';
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  
  logger.info({
    method,
    url,
    userAgent,
    ip,
    requestId: c.get('requestId'),
    type: 'api_request',
  }, `API request: ${method} ${url}`);

  try {
    await next();
    
    const duration = Date.now() - start;
    const statusCode = c.res.status;
    
    logger.info({
      method,
      url,
      statusCode,
      duration,
      requestId: c.get('requestId'),
      type: 'api_response',
    }, `API response: ${statusCode} in ${duration}ms`);
    
  } catch (error) {
    const duration = Date.now() - start;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error({
      method,
      url,
      error: errorMessage,
      duration,
      requestId: c.get('requestId'),
      type: 'api_error',
    }, `API error: ${errorMessage}`);

    throw error;
  }
};
