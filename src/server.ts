import { serve } from '@hono/node-server';
import https from 'node:https';
import fs from 'node:fs';
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
    const app = await createApp();

    const port = Number.parseInt(env.PORT, 10);
    if (Number.isNaN(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid port number: ${env.PORT}`);
    }

    logger.info('🚀 Starting GymPal Backend API...');
    logger.info(`📦 Environment: ${env.NODE_ENV}`);
    logger.info(`🔧 Port: ${port}`);
    logger.info(`📊 Log Level: ${env.LOG_LEVEL}`);

    const protocol = env.TLS_ENABLED ? 'https' : 'http';

    const serveOptions: any = {
      fetch: app.fetch,
      port,
    };

    if (env.TLS_ENABLED) {
      const certPath = env.TLS_CERT_FILE;
      const keyPath = env.TLS_KEY_FILE;
      if (!certPath || !keyPath) {
        throw new Error('TLS_ENABLED is true but TLS_CERT_FILE or TLS_KEY_FILE is not set');
      }
      const cert = fs.readFileSync(certPath);
      const key = fs.readFileSync(keyPath);
      serveOptions.createServer = https.createServer;
      serveOptions.serverOptions = { key, cert };
    }

    serve(serveOptions, () => {
      logger.info(`\n✅ Server running on ${protocol}://localhost:${port}`);
      logger.info(`📚 API Documentation: ${protocol}://localhost:${port}/api/reference`);
      logger.info(`📋 OpenAPI Spec: ${protocol}://localhost:${port}/api/openapi.json`);
      logger.info(`🏥 Health Check: ${protocol}://localhost:${port}/api/health`);
      logger.info(`\n💡 Press Ctrl+C to stop the server\n`);
    });
  } catch (error) {
    logger.error({ error }, '❌ Failed to start server');
    process.exit(1);
  }
}

main();

