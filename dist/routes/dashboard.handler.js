import { Hono } from 'hono';
import { validationMiddleware } from '../shared/middleware/validation.middleware.js';
import { authMiddleware } from '../shared/middleware/auth.middleware.js';
import * as DashboardService from '../services/dashboard.service.js';
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
        const result = await DashboardService.getUserDashboard(c);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get dashboard data', 500, error.message);
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
        const result = await DashboardService.getDashboardStats(c, query);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get dashboard stats', 500, error.message);
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
        const result = await DashboardService.getRecentActivity(c, query);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get recent activity', 500, error.message);
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
        const result = await DashboardService.getWorkoutProgress(c, query);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get workout progress', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/dashboard/achievements:
 *   get:
 *     summary: Get user achievements
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of achievements to return
 *     responses:
 *       200:
 *         description: Achievements retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AchievementsResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
dashboardHandler.get('/achievements', authMiddleware, validationMiddleware({ query: DashboardSchemas.achievementsQuery }), async (c) => {
    try {
        const query = c.get('validatedQuery');
        const result = await DashboardService.getUserAchievements(c, query);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get achievements', 500, error.message);
    }
});
/**
* @openapi
* /api/v1/dashboard/goals:
*   get:
*     summary: Get user goals
*     tags:
*       - Dashboard
*     security:
*       - bearerAuth: []
*     responses:
*       200:
*         description: Goals retrieved successfully
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/GoalsResponse'
*       401:
*         description: Unauthorized
*       500:
*         description: Internal error
*/
dashboardHandler.get('/goals', authMiddleware, async (c) => {
    try {
        const result = await DashboardService.getUserGoals(c);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get user goals', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/dashboard/goals:
 *   post:
 *     summary: Create a new user goal
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGoalBody'
 *     responses:
 *       200:
 *         description: Goal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GoalResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
dashboardHandler.post('/goals', authMiddleware, validationMiddleware({ body: DashboardSchemas.createGoalBody }), async (c) => {
    try {
        const body = c.get('validatedBody');
        const result = await DashboardService.createGoal(c, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to create goal', 500, error.message);
    }
});
/**
* @openapi
* /api/v1/dashboard/goals/:id
*   put:
*     summary: Update a user goal
*     tags:
*       - Dashboard
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: path
*         name: id
*         schema:
*           type: string
*         description: Goal ID
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/UpdateGoalBody'
*     responses:
*       200:
*         description: Goal updated successfully
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/GoalResponse'
*       401:
*         description: Unauthorized
*       500:
*         description: Internal error
*/
dashboardHandler.put('/goals/:id', authMiddleware, validationMiddleware({
    params: DashboardSchemas.goalParams,
    body: DashboardSchemas.updateGoalBody
}), async (c) => {
    try {
        const params = c.get('validatedParams');
        const body = c.get('validatedBody');
        const result = await DashboardService.updateGoal(c, params.id, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to update goal', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/dashboard/goals/:id
 *   delete:
 *     summary: Delete a user goal
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: Goal ID
 *     responses:
 *       200:
 *         description: Goal deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GoalResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
dashboardHandler.delete('/goals/:id', authMiddleware, validationMiddleware({ params: DashboardSchemas.goalParams }), async (c) => {
    try {
        const params = c.get('validatedParams');
        const result = await DashboardService.deleteGoal(c, params.id);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to delete goal', 500, error.message);
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
        const result = await DashboardService.getAnalytics(c, query);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get analytics', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/dashboard/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of notifications to return
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [new_like, new_comment, new_follow, new_message, new_post, new_achievement, new_goal, new_notification]
 *           default: new_like
 *         description: Notification type filter
 *       - in: query
 *         name: unread_only
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Show only unread notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationsResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
dashboardHandler.get('/notifications', authMiddleware, validationMiddleware({ query: DashboardSchemas.notificationsQuery }), async (c) => {
    try {
        const query = c.get('validatedQuery');
        const result = await DashboardService.getNotifications(c, query);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get notifications', 500, error.message);
    }
});
/**
* @openapi
* /api/v1/dashboard/notifications/:id/read
*   put:
*     summary: Mark a notification as read
*     tags:
*       - Dashboard
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: path
*         name: id
*         schema:
*           type: string
*         description: Notification ID
*     responses:
*       200:
*         description: Notification marked as read
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/NotificationResponse'
*       401:
*         description: Unauthorized
*       500:
*         description: Internal error
*/
dashboardHandler.put('/notifications/:id/read', authMiddleware, validationMiddleware({ params: DashboardSchemas.notificationParams }), async (c) => {
    try {
        const params = c.get('validatedParams');
        const result = await DashboardService.markNotificationAsRead(c, params.id);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to mark notification as read', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/dashboard/notifications/read-all
 *   put:
 *     summary: Mark all notifications as read
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
dashboardHandler.put('/notifications/read-all', authMiddleware, async (c) => {
    try {
        const result = await DashboardService.markAllNotificationsAsRead(c);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to mark all notifications as read', 500, error.message);
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
        const result = await DashboardService.getLeaderboard(c, query);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get leaderboard', 500, error.message);
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
        const result = await DashboardService.getCalendarData(c, query);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get calendar data', 500, error.message);
    }
});
export default dashboardHandler;
