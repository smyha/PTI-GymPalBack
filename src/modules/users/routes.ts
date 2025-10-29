/**
 * User Routes Module
 * 
 * This module defines all user-related routes:
 * - Profile management (get and update)
 * - User search
 * - User statistics and achievements
 * - Account deletion
 * 
 * All routes require authentication and use schema validation.
 */

import { Hono } from 'hono';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { userSchemas } from './schemas.js';
import { userHandlers } from './handlers.js';
import { USER_ROUTES } from '../../core/routes.js';

// Hono router instance for user routes
const userRoutes = new Hono();

// Apply authentication to all routes
userRoutes.use('*', auth);

/**
 * @openapi
 * /api/v1/users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get user profile
 *     description: Get current user profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags: [Users]
 *     summary: Update user profile
 *     description: Update current user profile
 *     security:
 *       - bearerAuth: []
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
userRoutes.get(USER_ROUTES.PROFILE, userHandlers.getProfile);

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
userRoutes.put(USER_ROUTES.PROFILE, validate(userSchemas.updateProfile, 'body'), userHandlers.updateProfile);

/**
 * @openapi
 * /api/v1/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: Get public user information by user ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User information retrieved successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
userRoutes.get(USER_ROUTES.BY_ID, validate(userSchemas.params, 'params'), userHandlers.getById);

/**
 * @openapi
 * /api/v1/users/search:
 *   get:
 *     tags: [Users]
 *     summary: Search users
 *     description: Search for users by username or full name
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
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Users found successfully
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
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
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
 * - limit: Results per page (default: 20)
 * 
 * Note: This endpoint does NOT require authentication (public search)
 * 
 * Responses:
 * - 200: Search results retrieved successfully
 * - 400: Validation error in parameters
 * - 500: Internal server error
 */
userRoutes.get('/search', validate(userSchemas.search, 'query'), userHandlers.search);

/**
 * @openapi
 * /api/v1/users/{id}/stats:
 *   get:
 *     tags: [Users]
 *     summary: Get user statistics
 *     description: Get user workout and activity statistics
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
userRoutes.get('/stats', userHandlers.getStats);

export default userRoutes;

