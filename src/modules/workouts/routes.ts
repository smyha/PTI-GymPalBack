/**
 * Workout Routes Module
 * 
 * This module defines all workout-related routes:
 * - Workout plan CRUD operations
 * - Exercise management within workouts
 * - Workout session management (start, complete, track)
 * - Workout history and statistics
 * 
 * All routes require authentication and use schema validation.
 */

import { Hono } from 'hono';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { workoutSchemas } from './schemas.js';
import { workoutHandlers } from './handlers.js';
import { WORKOUT_ROUTES } from '../../core/routes.js';

// Hono router instance for workout routes
const workoutRoutes = new Hono();

// Apply authentication to all routes
workoutRoutes.use('*', auth);

/**
 * @openapi
 * /api/v1/workouts:
 *   get:
 *     tags: [Workouts]
 *     summary: List workouts
 *     description: Get paginated list of workouts for authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 10
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Workouts retrieved successfully
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
 *                     workouts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Workout'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags: [Workouts]
 *     summary: Create workout
 *     description: Create a new workout plan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWorkoutRequest'
 *     responses:
 *       201:
 *         description: Workout created successfully
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
 *                     workout:
 *                       $ref: '#/components/schemas/Workout'
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
 * Handler: List workouts for authenticated user
 * 
 * Endpoint: GET /api/v1/workouts
 * 
 * Process:
 * 1. Validates authentication and pagination parameters
 * 2. Retrieves paginated list of workouts for the authenticated user
 * 3. Returns workouts with metadata (creation date, exercise count, etc.)
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 10)
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Workouts retrieved successfully
 * - 401: User not authenticated
 * - 500: Internal server error
 */
workoutRoutes.get(
  WORKOUT_ROUTES.LIST,
  validate(workoutSchemas.list, 'query'),
  workoutHandlers.list
);

/**
 * Handler: Create new workout plan
 * 
 * Endpoint: POST /api/v1/workouts
 * 
 * Process:
 * 1. Validates authentication and workout data
 * 2. Creates a new workout plan for the authenticated user
 * 3. Returns the created workout with generated ID
 * 
 * Workout data includes:
 * - Name and description
 * - Workout type and difficulty level
 * - Estimated duration
 * - Tags and categories
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 201: Workout created successfully
 * - 400: Validation error in provided data
 * - 401: User not authenticated
 * - 500: Internal server error
 */
workoutRoutes.post(
  WORKOUT_ROUTES.CREATE,
  validate(workoutSchemas.create, 'body'),
  workoutHandlers.create
);

/**
 * @openapi
 * /api/v1/workouts/{id}:
 *   get:
 *     tags: [Workouts]
 *     summary: Get workout by ID
 *     description: Retrieve detailed information about a specific workout
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Workout ID
 *     responses:
 *       200:
 *         description: Workout retrieved successfully
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
 *                     workout:
 *                       $ref: '#/components/schemas/Workout'
 *       404:
 *         description: Workout not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags: [Workouts]
 *     summary: Update workout
 *     description: Update an existing workout
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Workout ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWorkoutRequest'
 *     responses:
 *       200:
 *         description: Workout updated successfully
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
 *                     workout:
 *                       $ref: '#/components/schemas/Workout'
 *       404:
 *         description: Workout not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     tags: [Workouts]
 *     summary: Delete workout
 *     description: Delete a workout
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Workout ID
 *     responses:
 *       200:
 *         description: Workout deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Workout not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Handler: Get workout by ID
 * 
 * Endpoint: GET /api/v1/workouts/:id
 * 
 * Process:
 * 1. Validates authentication and workout ID
 * 2. Retrieves detailed workout information including exercises
 * 3. Verifies user has access to the workout (ownership check)
 * 4. Returns complete workout data
 * 
 * Includes:
 * - Workout metadata (name, description, type)
 * - List of exercises with sets, reps, and order
 * - Statistics (completion count, average duration)
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Workout retrieved successfully
 * - 404: Workout not found or user doesn't have access
 * - 500: Internal server error
 */
workoutRoutes.get(
  WORKOUT_ROUTES.BY_ID,
  validate(workoutSchemas.params, 'params'),
  workoutHandlers.getById
);

/**
 * Handler: Update workout plan
 * 
 * Endpoint: PUT /api/v1/workouts/:id
 * 
 * Process:
 * 1. Validates authentication and workout ownership
 * 2. Updates workout fields (allows partial updates)
 * 3. Returns updated workout data
 * 
 * Security:
 * - Only the workout owner can update it
 * - Validates workout exists and belongs to user
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Workout updated successfully
 * - 400: Validation error in provided data
 * - 404: Workout not found or user doesn't have access
 * - 500: Internal server error
 */
workoutRoutes.put(
  WORKOUT_ROUTES.UPDATE,
  validate(workoutSchemas.params, 'params'),
  validate(workoutSchemas.update, 'body'),
  workoutHandlers.update
);

/**
 * Handler: Delete workout plan
 *
 * Endpoint: DELETE /api/v1/workouts/:id
 *
 * Process:
 * 1. Validates authentication and workout ownership
 * 2. Deletes the workout and all associated exercises
 * 3. Preserves workout sessions history (for statistics)
 *
 * Warning: This operation cannot be undone. Deletes:
 * - Workout plan
 * - Exercise associations
 * - Workout metadata
 *
 * Note: Workout sessions remain in history for statistics
 *
 * Requires: Valid authentication token
 *
 * Responses:
 * - 200: Workout deleted successfully
 * - 404: Workout not found or user doesn't have access
 * - 500: Internal server error
 */
workoutRoutes.delete(
  WORKOUT_ROUTES.DELETE,
  validate(workoutSchemas.params, 'params'),
  workoutHandlers.delete
);

/**
 * Handler: Copy an existing workout
 *
 * Endpoint: POST /api/v1/workouts/copy/:workoutId
 *
 * Process:
 * 1. Validates authentication
 * 2. Fetches the source workout by ID
 * 3. Creates a new workout copy with "(Copy)" appended to the name
 * 4. Copies all exercises from the source workout to the new one
 * 5. Returns the newly created workout
 *
 * Features:
 * - Copied workout is owned by the authenticated user
 * - Copied workout is set as private by default
 * - All exercises and their properties are duplicated
 * - Name is automatically modified to indicate it's a copy
 *
 * Requires: Valid authentication token
 *
 * Responses:
 * - 201: Workout copied successfully
 * - 404: Source workout not found
 * - 500: Internal server error
 */
workoutRoutes.post(
  '/copy/:workoutId',
  workoutHandlers.copy
);

/**
 * Handler: Get workout count
 *
 * Endpoint: GET /api/v1/workouts/users/:userId/count
 */
workoutRoutes.get(
  '/users/:userId/count',
  workoutHandlers.getWorkoutCount
);

export default workoutRoutes;

