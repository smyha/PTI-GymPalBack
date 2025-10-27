import { Hono } from 'hono';
import { validationMiddleware } from '../shared/middleware/validation.middleware.js';
import { authMiddleware } from '../shared/middleware/auth.middleware.js';
import { getUserDashboard, getDashboardStats, getRecentActivity, getWorkoutProgress, getAnalytics, getLeaderboard, getCalendarData } from '../services/dashboard.service.js';
import { DashboardSchemas } from '../doc/schemas.js';
import { sendError } from '../shared/utils/response.js';
import '../shared/types/hono.types.js';
const dashboardHandler = new Hono();
/**
 * @openapi
 * /api/v1/dashboard:
 *   get:
 *     summary: Get dashboard data for the current user
 *     tags:
 *       - Dashboard
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
 *       500:
 *         description: Internal error
 */
dashboardHandler.get('/', authMiddleware, async (c) => {
    try {
        const result = await getUserDashboard(c);
        return result;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get dashboard data', 500, message);
    }
});
/**
* @openapi
* /api/v1/dashboard/stats:
*   get:
*     summary: Get user dashboard statistics
*     tags:
*       - Dashboard
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: query
*         name: timeframe
*         schema:
*           type: string
*           enum: [week, month, year, all]
*           default: month
*         description: Time period for statistics
*       - in: query
*         name: include_social
*         schema:
*           type: boolean
*           default: true
*         description: Include social activity metrics
*     responses:
*       200:
*         description: Dashboard statistics retrieved successfully
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/DashboardStatsResponse'
*       401:
*         description: Unauthorized
*       500:
*         description: Internal error
*/
dashboardHandler.get('/stats', authMiddleware, validationMiddleware({ query: DashboardSchemas.statsQuery }), async (c) => {
    try {
        const query = c.get('validatedQuery');
        const result = await getDashboardStats(c, query);
        return result;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get dashboard stats', 500, message);
    }
});
/**
 * @openapi
 * /api/v1/dashboard/recent-activity:
 *   get:
 *     summary: Get recent user activity
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of activities to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecentActivityResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
dashboardHandler.get('/recent-activity', authMiddleware, validationMiddleware({ query: DashboardSchemas.recentActivityQuery }), async (c) => {
    try {
        const query = c.get('validatedQuery');
        const result = await getRecentActivity(c, query);
        return result;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get recent activity', 500, message);
    }
});
/**
* @openapi
* /api/v1/dashboard/workout-progress:
*   get:
*     summary: Get workout progress for the current user
*     tags:
*       - Dashboard
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: query
*         name: period
*         schema:
*           type: string
*           enum: [week, month, year, all]
*           default: month
*         description: Time period for progress
*     responses:
*       200:
*         description: Workout progress retrieved successfully
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/WorkoutProgressResponse'
*       401:
*         description: Unauthorized
*       500:
*         description: Internal error
*/
dashboardHandler.get('/workout-progress', authMiddleware, validationMiddleware({ query: DashboardSchemas.workoutProgressQuery }), async (c) => {
    try {
        const query = c.get('validatedQuery');
        const result = await getWorkoutProgress(c, query);
        return result;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get workout progress', 500, message);
    }
});
/**
 * @openapi
 * /api/v1/dashboard/analytics
 *   get:
 *     summary: Get user analytics
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year, all]
 *           default: month
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
dashboardHandler.get('/analytics', authMiddleware, validationMiddleware({ query: DashboardSchemas.analyticsQuery }), async (c) => {
    try {
        const query = c.get('validatedQuery');
        const result = await getAnalytics(c, query);
        return result;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get analytics', 500, message);
    }
});
/**
 * @openapi
 * /api/v1/dashboard/leaderboard:
 *   get:
 *     summary: Get user leaderboard
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [workouts, achievements, goals, posts, likes, comments, followers, following]
 *           default: workouts
 *         description: Leaderboard type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of leaderboard entries to return
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaderboardResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
dashboardHandler.get('/leaderboard', authMiddleware, validationMiddleware({ query: DashboardSchemas.leaderboardQuery }), async (c) => {
    try {
        const query = c.get('validatedQuery');
        const result = await getLeaderboard(c, query);
        return result;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get leaderboard', 500, message);
    }
});
/**
 * @openapi
 * /api/v1/dashboard/calendar:
 *   get:
 *     summary: Get user calendar data
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           format: date
 *         description: Month to get data for
 *       - in: query
 *         name: year
 *         schema:
 *           type: string
 *           format: date
 *         description: Year to get data for
 *     responses:
 *       200:
 *         description: Calendar data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CalendarResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
dashboardHandler.get('/calendar', authMiddleware, validationMiddleware({ query: DashboardSchemas.calendarQuery }), async (c) => {
    try {
        const query = c.get('validatedQuery');
        const result = await getCalendarData(c, query);
        return result;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get calendar data', 500, message);
    }
});
export default dashboardHandler;
