/**
 * User Handlers Module
 * 
 * This module manages all user-related operations:
 * - Profile management (get and update)
 * - User search
 * - User statistics and achievements
 * - Account deletion
 * 
 * All modification routes require authentication and data validation.
 */

import { Hono } from 'hono';
import { validationMiddleware } from '../shared/middleware/validation.middleware.js';
import { authMiddleware } from '../shared/middleware/auth.middleware.js';
import { getUserProfile, updateProfile, getUserById, searchUsers, getUserStats, getUserAchievements, deleteAccount } from '../services/user.service.js';
import { UserSchemas } from '../doc/schemas.js';
import { sendError } from '../shared/utils/response.js';
import '../shared/types/hono.types.js';

// Hono router instance for user routes
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
/**
 * Handler: Get authenticated user profile
 * 
 * Endpoint: GET /api/v1/users/profile
 * 
 * Process:
 * 1. Validates user authentication via middleware
 * 2. Retrieves complete profile of authenticated user from database
 * 3. Returns all profile information (personal data, settings, etc.)
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Profile retrieved successfully
 * - 401: User not authenticated
 * - 500: Internal server error
 */
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
/**
 * Handler: Update authenticated user profile
 * 
 * Endpoint: PUT /api/v1/users/profile
 * 
 * Process:
 * 1. Validates authentication and request body data
 * 2. Updates provided profile fields (allows partial updates)
 * 3. Returns updated profile
 * 
 * Updatable fields:
 * - Personal information (name, username, bio, avatar)
 * - Fitness level and physical measurements
 * - Preferences and settings
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Profile updated successfully
 * - 400: Validation error in provided data
 * - 401: User not authenticated
 * - 500: Internal server error
 */
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
/**
 * Handler: Search users
 * 
 * Endpoint: GET /api/v1/users/search
 * 
 * Process:
 * 1. Validates search parameters (query, page, limit)
 * 2. Performs search by username or full name
 * 3. Returns paginated results of users matching the search
 * 
 * Search parameters:
 * - q: Search term (required)
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 10)
 * 
 * Note: This endpoint does NOT require authentication (public search)
 * 
 * Responses:
 * - 200: Search results retrieved successfully
 * - 400: Validation error in parameters
 * - 500: Internal server error
 */
userHandler.get('/search', validationMiddleware({ query: UserSchemas.searchUsersQuery }), async (c) => {
    try {
        const query = c.get('validatedQuery');
        // Calculates pagination
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
/**
 * Handler: Get public user information by ID
 * 
 * Endpoint: GET /api/v1/users/:id
 * 
 * Process:
 * 1. Validates user ID is a valid UUID
 * 2. Retrieves public user information from database
 * 3. Returns visible data according to user's privacy settings
 * 
 * Returned information:
 * - Basic public information (username, name, avatar)
 * - Public statistics (if enabled)
 * - Public achievements (if enabled)
 * 
 * Note: This endpoint does NOT require authentication, but respects
 * the privacy settings of the queried user
 * 
 * Responses:
 * - 200: User information retrieved successfully
 * - 404: User not found
 * - 500: Internal server error
 */
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
/**
 * Handler: Get user statistics
 * 
 * Endpoint: GET /api/v1/users/:id/stats
 * 
 * Process:
 * 1. Validates user ID
 * 2. Calculates and aggregates user statistics (completed workouts, exercises performed, etc.)
 * 3. Returns user's public statistics
 * 
 * Included statistics:
 * - Total completed workouts
 * - Total exercises performed
 * - Total training time
 * - Unlocked achievements
 * - Ranking and position
 * 
 * Note: Respects user's privacy settings
 * 
 * Responses:
 * - 200: Statistics retrieved successfully
 * - 404: User not found
 * - 500: Internal server error
 */
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
/**
 * Handler: Get user achievements
 * 
 * Endpoint: GET /api/v1/users/:id/achievements
 * 
 * Process:
 * 1. Validates user ID and pagination parameters
 * 2. Retrieves list of achievements unlocked by the user
 * 3. Returns achievements with detailed information (unlock date, description, etc.)
 * 
 * Pagination parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20)
 * 
 * Achievement information:
 * - Achievement type (e.g., "First workout", "100 workouts completed")
 * - Unlock date
 * - Description and reward
 * 
 * Responses:
 * - 200: Achievements retrieved successfully
 * - 404: User not found
 * - 500: Internal server error
 */
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
/**
 * Handler: Delete authenticated user account
 * 
 * Endpoint: DELETE /api/v1/users/account
 * 
 * Process:
 * 1. Validates authentication and deletion confirmation
 * 2. Verifies body contains required confirmation (body.confirmation === "DELETE")
 * 3. Executes complete account deletion and all its data
 * 
 * Warning: This operation is IRREVERSIBLE
 * 
 * Requires:
 * - Valid authentication token
 * - Explicit confirmation in body: { confirmation: "DELETE" }
 * 
 * Responses:
 * - 200: Account deleted successfully
 * - 400: Confirmation not provided or invalid
 * - 401: User not authenticated
 * - 500: Internal server error
 */
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
