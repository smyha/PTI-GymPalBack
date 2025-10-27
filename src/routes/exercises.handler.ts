import { Hono } from 'hono';
import {
  getAllExercises,
  getExerciseById,
  getExerciseCategories,
  getMuscleGroups,
  getEquipmentTypes
} from '../services/exercises.service.js';

const exercises = new Hono();

// IMPORTANT: Specific routes must come BEFORE parameterized routes (:id)
// Otherwise /:id will catch everything

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
exercises.get('/:id', getExerciseById);

export default exercises;
