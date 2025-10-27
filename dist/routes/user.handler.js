import { Hono } from 'hono';
import { validationMiddleware } from '../shared/middleware/validation.middleware.js';
import { authMiddleware } from '../shared/middleware/auth.middleware.js';
import { getUserProfile, updateProfile, getUserById, searchUsers, getUserStats, getUserAchievements, deleteAccount } from '../services/user.service.js';
import { UserSchemas } from '../doc/schemas.js';
import { sendError } from '../shared/utils/response.js';
import '../shared/types/hono.types.js';
const userHandler = new Hono();
/**
 * @openapi
 * /api/v1/users/profile:
 *   get:
 *     summary: Get user profile
 *     description: Get authenticated user profile information
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfileResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// GET /api/v1/users/profile
userHandler.get('/profile', authMiddleware, async (c) => {
    try {
        return await getUserProfile(c);
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to get user profile', 500);
    }
});
/**
 * @openapi
 * /api/v1/users/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update user profile information including personal details, fitness level, physical measurements, and preferences
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfileResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// PUT /api/v1/users/profile
userHandler.put('/profile', authMiddleware, validationMiddleware({ body: UserSchemas.updateProfileBody }), async (c) => {
    try {
        const body = c.get('validatedBody');
        return await updateProfile(c, body);
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to update profile', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/users/search:
 *   get:
 *     summary: Search users
 *     description: Search for users by username or full name
 *     tags: [Users]
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Users found successfully
 */
// GET /api/v1/users/search
userHandler.get('/search', validationMiddleware({ query: UserSchemas.searchUsersQuery }), async (c) => {
    try {
        const query = c.get('validatedQuery');
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '10');
        const offset = (page - 1) * limit;
        return await searchUsers(c, query.q, limit, offset);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'User search failed';
        return sendError(c, 'INTERNAL_ERROR', 'User search failed', 500, errorMessage);
    }
});
/**
 * @openapi
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Get public user information by user ID
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// GET /api/v1/users/:id
userHandler.get('/:id', validationMiddleware({ params: UserSchemas.getUserParams }), async (c) => {
    try {
        const params = c.get('validatedParams');
        return await getUserById(c, params.id);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get user';
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get user', 500, errorMessage);
    }
});
/**
 * @openapi
 * /api/v1/users/{id}/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Get user workout and activity statistics
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User stats retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// GET /api/v1/users/:id/stats
userHandler.get('/:id/stats', validationMiddleware({ params: UserSchemas.getUserParams }), async (c) => {
    try {
        const params = c.get('validatedParams');
        return await getUserStats(c, params.id);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get user stats';
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get user stats', 500, errorMessage);
    }
});
/**
 * @openapi
 * /api/v1/users/{id}/achievements:
 *   get:
 *     summary: Get user achievements
 *     description: Get list of user achievements with pagination
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *     responses:
 *       200:
 *         description: Achievements retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// GET /api/v1/users/:id/achievements
userHandler.get('/:id/achievements', validationMiddleware({ params: UserSchemas.getUserParams }), validationMiddleware({ query: UserSchemas.paginationQuery }), async (c) => {
    try {
        const params = c.get('validatedParams');
        const query = c.get('validatedQuery');
        return await getUserAchievements(c, params.id, query);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get achievements';
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get achievements', 500, errorMessage);
    }
});
/**
 * @openapi
 * /api/v1/users/account:
 *   delete:
 *     summary: Delete user account
 *     description: Permanently delete authenticated user account. Requires confirmation.
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [confirmation]
 *             properties:
 *               confirmation:
 *                 type: string
 *                 enum: [DELETE]
 *                 description: Must be "DELETE" to confirm
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// DELETE /api/v1/users/account
userHandler.delete('/account', authMiddleware, validationMiddleware({ body: UserSchemas.deleteAccountBody }), async (c) => {
    try {
        const body = c.get('validatedBody');
        return await deleteAccount(c, body);
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to delete account', 500, error.message);
    }
});
export default userHandler;
