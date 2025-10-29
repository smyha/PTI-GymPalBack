/**
 * Exercise Routes Module
 * 
 * This module defines all exercise catalog routes:
 * - Browse and search exercises
 * - Get exercise details
 * - Filter by categories, muscle groups, and equipment
 * - Access exercise metadata
 * 
 * Note: These routes are PUBLIC and do NOT require authentication.
 * Exercises are part of a shared catalog available to all users.
 */

import { Hono } from 'hono';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { exerciseSchemas } from './schemas.js';
import { exerciseHandlers } from './handlers.js';
import { EXERCISE_ROUTES } from '../../core/routes.js';

// Hono router instance for exercise routes
const exerciseRoutes = new Hono();

// Apply authentication to all routes
exerciseRoutes.use('*', auth);

/**
 * @openapi
 * /api/v1/exercises/categories:
 *   get:
 *     tags: [Exercises]
 *     summary: Get exercise categories
 *     description: Retrieve list of all available exercise categories
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: string
 */
/**
 * Handler: Get exercise categories
 * 
 * Endpoint: GET /api/v1/exercises/categories
 * 
 * Process:
 * 1. Retrieves list of all available exercise categories
 * 2. Returns categories with metadata (name, description, count)
 * 
 * Categories include types like:
 * - Strength
 * - Cardio
 * - Flexibility
 * - Balance
 * - etc.
 * 
 * Note: Public endpoint, no authentication required
 * 
 * Responses:
 * - 200: Categories retrieved successfully
 * - 500: Internal server error
 */
exerciseRoutes.get(
  EXERCISE_ROUTES.CATEGORIES,
  exerciseHandlers.getCategories
);

/**
 * @openapi
 * /api/v1/exercises/muscle-groups:
 *   get:
 *     tags: [Exercises]
 *     summary: Get muscle groups
 *     description: Retrieve list of all available muscle groups
 *     responses:
 *       200:
 *         description: Muscle groups retrieved successfully
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
 *                     muscleGroups:
 *                       type: array
 *                       items:
 *                         type: string
 */
/**
 * Handler: Get muscle groups
 * 
 * Endpoint: GET /api/v1/exercises/muscle-groups
 * 
 * Process:
 * 1. Retrieves list of all available muscle groups
 * 2. Returns muscle groups with metadata
 * 
 * Muscle groups include:
 * - Chest
 * - Back
 * - Shoulders
 * - Arms (Biceps, Triceps)
 * - Legs (Quadriceps, Hamstrings, Calves)
 * - Core (Abs, Obliques)
 * - etc.
 * 
 * Note: Public endpoint, no authentication required
 * 
 * Responses:
 * - 200: Muscle groups retrieved successfully
 * - 500: Internal server error
 */
exerciseRoutes.get(
  EXERCISE_ROUTES.MUSCLE_GROUPS,
  exerciseHandlers.getMuscleGroups
);

/**
 * @openapi
 * /api/v1/exercises/equipment:
 *   get:
 *     tags: [Exercises]
 *     summary: Get equipment types
 *     description: Retrieve list of all available equipment types
 *     responses:
 *       200:
 *         description: Equipment types retrieved successfully
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
 *                     equipment:
 *                       type: array
 *                       items:
 *                         type: string
 */
/**
 * Handler: Get equipment types
 * 
 * Endpoint: GET /api/v1/exercises/equipment
 * 
 * Process:
 * 1. Retrieves list of all available equipment types
 * 2. Returns equipment with metadata
 * 
 * Equipment types include:
 * - Barbell
 * - Dumbbell
 * - Resistance Band
 * - Bodyweight
 * - Machine
 * - Kettlebell
 * - etc.
 * 
 * Note: Public endpoint, no authentication required
 * 
 * Responses:
 * - 200: Equipment types retrieved successfully
 * - 500: Internal server error
 */
exerciseRoutes.get(
  EXERCISE_ROUTES.EQUIPMENT,
  exerciseHandlers.getEquipmentTypes
);

/**
 * @openapi
 * /api/v1/exercises:
 *   get:
 *     tags: [Exercises]
 *     summary: List exercises
 *     description: Get paginated list of exercises with optional filtering
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
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - name: muscleGroup
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by muscle group
 *       - name: equipment
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by equipment type
 *     responses:
 *       200:
 *         description: Exercises retrieved successfully
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
 *                     exercises:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Exercise'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
/**
 * Handler: List all exercises with optional filtering
 * 
 * Endpoint: GET /api/v1/exercises
 * 
 * Process:
 * 1. Validates query parameters for filtering
 * 2. Retrieves paginated list of exercises
 * 3. Applies filters if provided (category, muscle group, equipment)
 * 4. Returns exercises with metadata
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 10)
 * - category: Filter by exercise category (optional)
 * - muscleGroup: Filter by target muscle group (optional)
 * - equipment: Filter by required equipment (optional)
 * 
 * Exercise information includes:
 * - Name and description
 * - Category and difficulty level
 * - Target muscle groups
 * - Required equipment
 * - Instructions and tips
 * - Video/image references
 * 
 * Note: Public endpoint, no authentication required
 * 
 * Responses:
 * - 200: Exercises retrieved successfully
 * - 400: Invalid filter parameters
 * - 500: Internal server error
 */
exerciseRoutes.get(
  EXERCISE_ROUTES.LIST,
  validate(exerciseSchemas.list, 'query'),
  exerciseHandlers.list
);

exerciseRoutes.post(
  EXERCISE_ROUTES.CREATE,
  validate(exerciseSchemas.create, 'body'),
  exerciseHandlers.create
);

/**
 * @openapi
 * /api/v1/exercises/{id}:
 *   get:
 *     tags: [Exercises]
 *     summary: Get exercise by ID
 *     description: Retrieve detailed information about a specific exercise
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Exercise ID
 *     responses:
 *       200:
 *         description: Exercise retrieved successfully
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
 *                     exercise:
 *                       $ref: '#/components/schemas/Exercise'
 *       404:
 *         description: Exercise not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Handler: Get exercise by ID
 * 
 * Endpoint: GET /api/v1/exercises/:id
 * 
 * Process:
 * 1. Validates exercise ID format
 * 2. Retrieves detailed exercise information
 * 3. Returns complete exercise data including instructions
 * 
 * Exercise details include:
 * - Complete description and instructions
 * - Step-by-step guide
 * - Muscle groups targeted (primary and secondary)
 * - Equipment needed
 * - Difficulty level
 * - Common mistakes to avoid
 * - Variations and alternatives
 * - Video/image demonstrations
 * 
 * Note: Public endpoint, no authentication required
 * 
 * Responses:
 * - 200: Exercise retrieved successfully
 * - 404: Exercise not found
 * - 500: Internal server error
 */
exerciseRoutes.get(
  EXERCISE_ROUTES.BY_ID,
  validate(exerciseSchemas.params, 'params'),
  exerciseHandlers.getById
);

exerciseRoutes.put(
  EXERCISE_ROUTES.UPDATE,
  validate(exerciseSchemas.params, 'params'),
  validate(exerciseSchemas.update, 'body'),
  exerciseHandlers.update
);

exerciseRoutes.delete(
  EXERCISE_ROUTES.DELETE,
  validate(exerciseSchemas.params, 'params'),
  exerciseHandlers.delete
);

export default exerciseRoutes;

