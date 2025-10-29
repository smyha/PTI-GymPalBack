import { serve } from '@hono/node-server';
import { logger } from './core/config/logger.js';
import { env } from './core/config/env.js';
import { createApp } from './app.js';

/**
 * Main application entry point
 * 
 * Initializes the Hono application, configures the server, and starts
 * listening for incoming HTTP requests. Handles startup errors gracefully
 * and logs important server information.
 * 
 * @async
 * @function main
 */
async function main() {
  try {
    // Create and configure the Hono application with all middleware and routes
    const app = await createApp();

    // Parse and validate port number from environment variables
    const port = parseInt(env.PORT, 10);

    // Validate port is a valid number in the acceptable range
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid port number: ${env.PORT}`);
    }

    // Start the HTTP server
    logger.info('🚀 Starting GymPal Backend API...');
    logger.info(`📦 Environment: ${env.NODE_ENV}`);
    logger.info(`🔧 Port: ${port}`);
    logger.info(`📊 Log Level: ${env.LOG_LEVEL}`);

    serve({
      fetch: app.fetch,
      port,
    });

    logger.info(`\n✅ Server running on http://localhost:${port}`);
    logger.info(`📚 API Documentation: http://localhost:${port}/reference`);
    logger.info(`📋 OpenAPI Spec: http://localhost:${port}/openapi.json`);
    logger.info(`🏥 Health Check: http://localhost:${port}/health`);
    logger.info(`\n💡 Press Ctrl+C to stop the server\n`);

  } catch (error) {
    logger.error({ error }, '❌ Failed to start server');
    process.exit(1);
  }
}

// Start the application
main();

