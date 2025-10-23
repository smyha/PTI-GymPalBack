import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { apiReference } from '@scalar/hono-api-reference';
import { readFile } from 'fs/promises';
import dotenv from 'dotenv';
import { env, corsOrigins, corsCredentials } from './config/env.js';
import { rateLimitMiddleware } from './shared/middleware/rate-limit.middleware.js';
import { errorHandler } from './shared/middleware/error.middleware.js';
// Import route handlers
import authHandler from './routes/auth.handler.js';
import userHandler from './routes/user.handler.js';
import exercisesHandler from './routes/exercises.handler.js';
import workoutHandler from './routes/workout.handler.js';
import socialHandler from './routes/social.handler.js';
import personalHandler from './routes/personal.handler.js';
import routinesHandler from './routes/routines.handler.js';
import dashboardHandler from './routes/dashboard.handler.js';
import settingsHandler from './routes/settings.handler.js';
// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================
dotenv.config();
// ============================================================================
// ERROR HANDLERS
// ============================================================================
// ============================================================================
// APPLICATION SETUP
// ============================================================================
/**
 * Create and configure the Hono application
 * @returns Configured Hono app instance
 */
async function createApp() {
    const app = new Hono();
    // Load OpenAPI specification
    const openapi = JSON.parse(await readFile(new URL('../openapi.json', import.meta.url), 'utf-8'));
    // ============================================================================
    // GLOBAL MIDDLEWARE
    // ============================================================================
    app.use('*', logger());
    app.use('*', prettyJSON());
    app.use('*', cors({
        origin: corsOrigins,
        credentials: corsCredentials,
    }));
    app.use('*', rateLimitMiddleware);
    // ============================================================================
    // SYSTEM ENDPOINTS
    // ============================================================================
    /**
     * @openapi
     * /health:
     *   get:
     *     summary: Health check
     *     description: Check if the API is running and healthy
     *     tags:
     *       - System
     *     responses:
     *       200:
     *         description: API is healthy
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: ok
     *                 environment:
     *                   type: string
     *                   example: development
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     *                 uptime:
     *                   type: number
     *                   description: Server uptime in seconds
     *                 version:
     *                   type: string
     *                   example: 1.0.0
     */
    app.get('/health', (c) => {
        return c.json({
            status: 'ok',
            environment: env.NODE_ENV,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0'
        });
    });
    /**
     * @openapi
     * /:
     *   get:
     *     summary: Root endpoint
     *     description: Get API information and available endpoints
     *     tags:
     *       - System
     *     responses:
     *       200:
     *         description: API information and available endpoints
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: GymPal Backend API
     *                 version:
     *                   type: string
     *                   example: 1.0.0
     *                 description:
     *                   type: string
     *                 documentation:
     *                   type: object
     *                   properties:
     *                     reference:
     *                       type: string
     *                       example: /reference
     *                     openapi:
     *                       type: string
     *                       example: /openapi.json
     *                     health:
     *                       type: string
     *                       example: /health
     *                 endpoints:
     *                   type: object
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     */
    app.get('/', (c) => {
        return c.json({
            message: 'GymPal Backend API',
            version: '1.0.0',
            description: 'Complete API for the GymPal fitness application with social features, AI, and analytics',
            documentation: {
                reference: '/reference',
                openapi: '/openapi.json',
                health: '/health'
            },
            endpoints: {
                auth: '/api/v1/auth',
                users: '/api/v1/users',
                exercises: '/api/v1/exercises',
                workouts: '/api/v1/workouts',
                social: '/api/v1/social',
                personal: '/api/v1/personal',
                routines: '/api/v1/routines',
                dashboard: '/api/v1/dashboard',
                settings: '/api/v1/settings'
            },
            timestamp: new Date().toISOString()
        });
    });
    // ============================================================================
    // API DOCUMENTATION
    // ============================================================================
    /**
       * OpenAPI JSON specification
       * @openapi
       * /openapi.json:
       *   get:
       *     summary: OpenAPI JSON specification
       *     description: Get the OpenAPI JSON specification for this API
       *     tags:
       *       - System
       *     responses:
       *       200:
       *         description: OpenAPI JSON specification
       *         content:
       *           application/json:
       *             schema:
       *               type: object
       */
    app.get('/openapi.json', (c) => {
        return c.json(openapi);
    });
    /**
     * Interactive API documentation (Scalar)
     * @openapi
     * /reference:
     *   get:
     *     summary: Interactive API documentation
     *     description: Get the interactive API documentation powered by Scalar
     *     tags:
     *       - System
     *     responses:
     *       200:
     *         description: Interactive API documentation
     *         content:
     *           text/html:
     *             schema:
     *               type: string
     */
    app.get('/reference', apiReference({
        spec: {
            url: '/openapi.json',
        },
    }));
    // ============================================================================
    // API ROUTES
    // ============================================================================
    app.route('/api/v1/auth', authHandler);
    app.route('/api/v1/users', userHandler);
    app.route('/api/v1/exercises', exercisesHandler);
    app.route('/api/v1/workouts', workoutHandler);
    app.route('/api/v1/social', socialHandler);
    app.route('/api/v1/personal', personalHandler);
    app.route('/api/v1/routines', routinesHandler);
    app.route('/api/v1/dashboard', dashboardHandler);
    app.route('/api/v1/settings', settingsHandler);
    // ============================================================================
    // ERROR HANDLING
    // ============================================================================
    app.onError(errorHandler);
    /**
     * @openapi
     * components:
     *   responses:
     *     NotFound:
     *       description: The requested endpoint does not exist
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               success:
     *                 type: boolean
     *                 example: false
     *               error:
     *                 type: object
     *                 properties:
     *                   code:
     *                     type: string
     *                     example: NOT_FOUND
     *                   message:
     *                     type: string
     *                     example: The requested endpoint does not exist
     *                   path:
     *                     type: string
     *                     example: /api/v1/unknown
     */
    app.notFound((c) => {
        return c.json({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: 'The requested endpoint does not exist',
                path: c.req.path
            }
        }, 404);
    });
    return app;
}
// ============================================================================
// APPLICATION STARTUP
// ============================================================================
/**
 * Main application entry point
 */
async function main() {
    try {
        // Create the Hono application
        const app = await createApp();
        // Parse port from environment
        const port = parseInt(env.PORT, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
            throw new Error(`Invalid port number: ${env.PORT}`);
        }
        // Start the server
        console.log('🚀 Starting GymPal Backend API...');
        console.log(`📦 Environment: ${env.NODE_ENV}`);
        console.log(`🔧 Port: ${port}`);
        serve({
            fetch: app.fetch,
            port,
        });
        console.log(`\n✅ Server running on http://localhost:${port}`);
        console.log(`📚 API Documentation: http://localhost:${port}/reference`);
        console.log(`📋 OpenAPI Spec: http://localhost:${port}/openapi.json`);
        console.log(`🏥 Health Check: http://localhost:${port}/health`);
        console.log(`\n💡 Press Ctrl+C to stop the server\n`);
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Start the application
main();
