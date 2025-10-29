/**
 * Exercise Handlers Module
 * 
 * This module manages exercise catalog operations:
 * - Browse and search exercises
 * - Get exercise details
 * - Filter by categories, muscle groups, and equipment
 * - Access exercise metadata
 * 
 * Note: These routes are PUBLIC and do NOT require authentication.
 * Exercises are part of a shared catalog available to all users.
 */

import { Hono } from 'hono';
import { getAllExercises, getExerciseById, getExerciseCategories, getMuscleGroups, getEquipmentTypes } from '../services/exercises.service.js';

// Hono router instance for exercise routes
const exercises = new Hono();

// IMPORTANT: Specific routes must come BEFORE parameterized routes (:id)
// Otherwise /:id will catch everything. This is why /categories, /muscle-groups,
// and /equipment routes are defined before the /:id route.
/**
 * @openapi
 * /api/v1/exercises/categories:
 *   get:
 *     summary: Get exercise categories
 *     description: Retrieve list of all available exercise categories
 *     tags: [Exercises]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
exercises.get('/categories', getExerciseCategories);
/**
 * @openapi
 * /api/v1/exercises/muscle-groups:
 *   get:
 *     summary: Get muscle groups
 *     description: Retrieve list of all available muscle groups
 *     tags: [Exercises]
 *     responses:
 *       200:
 *         description: Muscle groups retrieved successfully
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
exercises.get('/muscle-groups', getMuscleGroups);
/**
 * @openapi
 * /api/v1/exercises/equipment:
 *   get:
 *     summary: Get equipment types
 *     description: Retrieve list of all available equipment types
 *     tags: [Exercises]
 *     responses:
 *       200:
 *         description: Equipment types retrieved successfully
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
exercises.get('/equipment', getEquipmentTypes);
/**
 * @openapi
 * /api/v1/exercises:
 *   get:
 *     summary: List exercises
 *     description: Get paginated list of exercises with optional filtering by category, muscle group, and equipment
 *     tags: [Exercises]
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
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
 * - limit: Results per page (default: 20)
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
exercises.get('/', getAllExercises);
/**
 * @openapi
 * /api/v1/exercises/{id}:
 *   get:
 *     summary: Get exercise by ID
 *     description: Retrieve detailed information about a specific exercise
 *     tags: [Exercises]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Exercise ID
 *     responses:
 *       200:
 *         description: Exercise retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
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
exercises.get('/:id', getExerciseById);

export default exercises;
