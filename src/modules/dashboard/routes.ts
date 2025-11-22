/**
 * Dashboard Routes Module
 * 
 * This module defines all dashboard and analytics routes:
 * - User dashboard overview
 * - Statistics and metrics
 * - Recent activity feed
 * - Workout progress tracking
 * - Analytics and insights
 * - Leaderboards
 * - Calendar data
 * 
 * All routes require authentication and provide personalized data
 * based on the authenticated user.
 */

import { Hono } from 'hono';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { dashboardSchemas } from './schemas.js';
import { dashboardHandlers } from './handlers.js';
import { DASHBOARD_ROUTES } from '../../core/routes.js';

// Hono router instance for dashboard routes
const dashboardRoutes = new Hono();

// Apply authentication to all routes
dashboardRoutes.use('*', auth);

/**
 * @openapi
 * /api/v1/dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard data
 *     description: Get dashboard data for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Handler: Get dashboard overview
 * 
 * Endpoint: GET /api/v1/dashboard
 * 
 * Process:
 * 1. Validates authentication
 * 2. Aggregates data from multiple sources (workouts, social, statistics)
 * 3. Returns comprehensive dashboard overview for authenticated user
 * 
 * Dashboard includes:
 * - Quick stats (total workouts, exercises, progress)
 * - Recent activity feed
 * - Upcoming workouts
 * - Achievement highlights
 * - Social activity summary
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Dashboard data retrieved successfully
 * - 401: User not authenticated
 * - 500: Internal server error
 */
dashboardRoutes.get(DASHBOARD_ROUTES.OVERVIEW, validate(dashboardSchemas.overview, 'query'), dashboardHandlers.getOverview);

/**
 * @openapi
 * /api/v1/dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get user dashboard statistics
 *     description: Get user dashboard statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           enum: [week, month, year, all]
 *           default: month
 *         description: Time frame for statistics
 *       - name: include_social
 *         in: query
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include social activity statistics
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardStatsResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Handler: Get user dashboard statistics
 * 
 * Endpoint: GET /api/v1/dashboard/stats
 * 
 * Process:
 * 1. Validates authentication and query parameters
 * 2. Calculates statistics for the specified timeframe
 * 3. Aggregates workout, exercise, and social metrics
 * 4. Returns comprehensive statistics
 * 
 * Query parameters:
 * - period: Time period (week, month, year, all) - default: month
 * - include_social: Include social activity metrics - default: true
 * 
 * Statistics include:
 * - Workout statistics (completed, duration, frequency)
 * - Exercise statistics (total exercises, volume, progression)
 * - Social statistics (posts, likes, followers) - if enabled
 * - Achievement progress
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Statistics retrieved successfully
 * - 401: User not authenticated
 * - 500: Internal server error
 */
dashboardRoutes.get(DASHBOARD_ROUTES.STATS, validate(dashboardSchemas.stats, 'query'), dashboardHandlers.getStats);

/**
 * @openapi
 * /api/v1/dashboard/recent-activity:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get recent user activity
 *     description: Get recent user activity
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Maximum number of activities to return
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of activities to skip
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     activities:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Handler: Get recent user activity
 * 
 * Endpoint: GET /api/v1/dashboard/recent-activity
 * 
 * Process:
 * 1. Validates authentication and pagination parameters
 * 2. Retrieves recent activities from multiple sources
 * 3. Combines and sorts activities by timestamp
 * 4. Returns paginated activity feed
 * 
 * Query parameters:
 * - limit: Maximum number of activities (default: 20, max: 100)
 * - offset: Number of activities to skip (default: 0)
 * 
 * Activity types include:
 * - Workout completions
 * - Exercise achievements
 * - Social interactions (posts, comments, likes)
 * - Goal milestones
 * - Friend connections
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Recent activity retrieved successfully
 * - 401: User not authenticated
 * - 500: Internal server error
 */
dashboardRoutes.get(DASHBOARD_ROUTES.RECENT_ACTIVITY, validate(dashboardSchemas.activity, 'query'), dashboardHandlers.getRecentActivity);

export default dashboardRoutes;

