import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { corsOrigins, corsCredentials } from './core/config/env.js';
import { errorHandler } from './middleware/error.js';
import { logging } from './middleware/logging.js';
import { rateLimit } from './middleware/rate-limit.js';
import { healthPlugin } from './plugins/health.js';
import { openapiPlugin } from './plugins/openapi.js';
import { BASE_ROUTES, SYSTEM_ROUTES } from './core/routes.js';

// Import modules
import authRoutes from './modules/auth/routes.js';
import userRoutes from './modules/users/routes.js';
import workoutRoutes from './modules/workouts/routes.js';
import exerciseRoutes from './modules/exercises/routes.js';
import socialRoutes from './modules/social/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';
import personalRoutes from './modules/personal/routes.js';
import settingsRoutes from './modules/settings/routes.js';

/**
 * Creates and configures the Hono application instance
 * 
 * This function sets up the main application with all middleware, plugins,
 * routes, and error handlers. It's the central configuration point for
 * the entire API server.
 * 
 * @returns {Promise<Hono>} Configured Hono application instance
 * 
 * @example
 * const app = await createApp();
 * // App is ready to handle requests
 */
export async function createApp() {
  const app = new Hono();

  // ============================================================================
  // GLOBAL MIDDLEWARE
  // ============================================================================
  // Pretty JSON formatting for readable API responses
  app.use('*', prettyJSON());
  
  // Request/response logging middleware
  app.use('*', logging);
  
  // CORS configuration for cross-origin requests
  app.use('*', cors({
    origin: corsOrigins,
    credentials: corsCredentials,
  }));
  
  // Rate limiting to prevent abuse
  app.use('*', rateLimit);

  // ============================================================================
  // PLUGINS
  // ============================================================================
  // Health check endpoint for monitoring
  app.use('*', healthPlugin);
  
  // OpenAPI documentation endpoints
  app.use('*', openapiPlugin);

  // ============================================================================
  // SYSTEM ENDPOINTS
  // ============================================================================
  app.get(SYSTEM_ROUTES.ROOT, (c) => {
    return c.json({
      message: 'GymPal Backend API',
      version: '1.0.0',
      description: 'Complete API for the GymPal fitness application with social features, AI, and analytics',
      documentation: {
        reference: SYSTEM_ROUTES.REFERENCE,
        openapi: SYSTEM_ROUTES.OPENAPI,
        health: SYSTEM_ROUTES.HEALTH,
      },
      endpoints: {
        auth: BASE_ROUTES.AUTH,
        users: BASE_ROUTES.USERS,
        exercises: BASE_ROUTES.EXERCISES,
        workouts: BASE_ROUTES.WORKOUTS,
        social: BASE_ROUTES.SOCIAL,
        personal: BASE_ROUTES.PERSONAL,
        dashboard: BASE_ROUTES.DASHBOARD,
        settings: BASE_ROUTES.SETTINGS,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // ============================================================================
  // API ROUTES
  // ============================================================================
  // Mount all module routes with their base paths
  app.route(BASE_ROUTES.AUTH, authRoutes);
  app.route(BASE_ROUTES.USERS, userRoutes);
  app.route(BASE_ROUTES.WORKOUTS, workoutRoutes);
  app.route(BASE_ROUTES.EXERCISES, exerciseRoutes);
  app.route(BASE_ROUTES.SOCIAL, socialRoutes);
  app.route(BASE_ROUTES.DASHBOARD, dashboardRoutes);
  app.route(BASE_ROUTES.PERSONAL, personalRoutes);
  app.route(BASE_ROUTES.SETTINGS, settingsRoutes);

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================
  // Global error handler for all unhandled errors
  app.onError(errorHandler);

  // Handler for 404 Not Found errors
  app.notFound((c) => {
    return c.json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint does not exist',
        path: c.req.path,
      },
    }, 404);
  });

  return app;
}

