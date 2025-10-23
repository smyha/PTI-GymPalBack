import { Hono } from 'hono';
import { validationMiddleware } from '../shared/middleware/validation.middleware.js';
import { authMiddleware } from '../shared/middleware/auth.middleware.js';
import * as RoutinesService from '../services/routines.service.js';
import { RoutineSchemas } from '../doc/schemas.js';
import { sendError } from '../shared/utils/response.js';
import '../shared/types/hono.types.js';
const routinesHandler = new Hono();
/**
 * @openapi
 * /api/v1/workouts/routines:
 *   get:
 *     summary: Get list of routines
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of routines
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoutinesResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
routinesHandler.get('/', authMiddleware, validationMiddleware({ query: RoutineSchemas.listRoutinesQuery }), async (c) => {
    try {
        const query = c.get('validatedQuery');
        const result = await RoutinesService.listRoutines(c, query);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to list routines', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/workouts/routines:
 *   post:
 *     summary: Create a new routine
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Routine created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoutineResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
routinesHandler.post('/', authMiddleware, validationMiddleware({ body: RoutineSchemas.createRoutineBody }), async (c) => {
    try {
        const body = c.get('validatedBody');
        const result = await RoutinesService.createRoutine(c, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to create routine', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/workouts/routines/:id:
 *   get:
 *     summary: Get routine by ID
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Routine details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoutineResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
routinesHandler.get('/:id', authMiddleware, validationMiddleware({ params: RoutineSchemas.getRoutineParams }), async (c) => {
    try {
        const params = c.get('validatedParams');
        const result = await RoutinesService.getRoutine(c, params.id);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get routine', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/workouts/routines/:id:
 *   put:
 *     summary: Update routine by ID
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Routine updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoutineResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
routinesHandler.put('/:id', authMiddleware, validationMiddleware({
    params: RoutineSchemas.getRoutineParams,
    body: RoutineSchemas.updateRoutineBody
}), async (c) => {
    try {
        const params = c.get('validatedParams');
        const body = c.get('validatedBody');
        const result = await RoutinesService.updateRoutine(c, params.id, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to update routine', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/workouts/routines/:id:
 *   delete:
 *     summary: Delete routine by ID
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Routine deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoutineResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
routinesHandler.delete('/:id', authMiddleware, validationMiddleware({ params: RoutineSchemas.getRoutineParams }), async (c) => {
    try {
        const params = c.get('validatedParams');
        const result = await RoutinesService.deleteRoutine(c, params.id);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to delete routine', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/workouts/routines/search:
 *   get:
 *     summary: Search routines
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoutinesResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
routinesHandler.get('/search', authMiddleware, validationMiddleware({ query: RoutineSchemas.searchRoutinesQuery }), async (c) => {
    try {
        const query = c.get('validatedQuery');
        const result = await RoutinesService.searchRoutines(c, query);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to search routines', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/workouts/routines/:id/share:
 *   post:
 *     summary: Share routine by ID
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Routine shared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoutineResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
routinesHandler.post('/:id/share', authMiddleware, validationMiddleware({
    params: RoutineSchemas.getRoutineParams,
    body: RoutineSchemas.shareRoutineBody
}), async (c) => {
    try {
        const params = c.get('validatedParams');
        const body = c.get('validatedBody');
        const result = await RoutinesService.shareRoutine(c, params.id, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to share routine', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/workouts/routines/:id/like:
 *   post:
 *     summary: Like routine by ID
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Routine liked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoutineResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
routinesHandler.post('/:id/like', authMiddleware, validationMiddleware({ params: RoutineSchemas.getRoutineParams }), async (c) => {
    try {
        const params = c.get('validatedParams');
        const result = await RoutinesService.likeRoutine(c, params.id);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to like routine', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/workouts/routines/:id/like:
 *   delete:
 *     summary: Unlike routine by ID
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Routine unliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoutineResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
routinesHandler.delete('/:id/like', authMiddleware, validationMiddleware({ params: RoutineSchemas.getRoutineParams }), async (c) => {
    try {
        const params = c.get('validatedParams');
        const result = await RoutinesService.unlikeRoutine(c, params.id);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to unlike routine', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/workouts/routines/:id/use:
 *   post:
 *     summary: Use routine by ID
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Routine used successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoutineResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
routinesHandler.post('/:id/use', authMiddleware, validationMiddleware({ params: RoutineSchemas.getRoutineParams }), async (c) => {
    try {
        const params = c.get('validatedParams');
        const result = await RoutinesService.useRoutine(c, params.id);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to use routine', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/workouts/routines/:id/duplicate:
 *   post:
 *     summary: Duplicate routine by ID
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Routine duplicated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoutineResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
routinesHandler.post('/:id/duplicate', authMiddleware, validationMiddleware({
    params: RoutineSchemas.getRoutineParams,
    body: RoutineSchemas.duplicateRoutineBody
}), async (c) => {
    try {
        const params = c.get('validatedParams');
        const body = c.get('validatedBody');
        const result = await RoutinesService.duplicateRoutine(c, params.id, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to duplicate routine', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/workouts/routines/:id/exercises:
 *   get:
 *     summary: Get routine exercises by ID
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Routine exercises
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoutineExercisesResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
routinesHandler.get('/:id/exercises', authMiddleware, validationMiddleware({ params: RoutineSchemas.getRoutineParams }), async (c) => {
    try {
        const params = c.get('validatedParams');
        const result = await RoutinesService.getRoutineExercises(c, params.id);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get routine exercises', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/workouts/routines/:id/exercises:
 *   post:
 *     summary: Add exercise to routine by ID
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exercise added to routine successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoutineExerciseResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
routinesHandler.post('/:id/exercises', authMiddleware, validationMiddleware({
    params: RoutineSchemas.getRoutineParams,
    body: RoutineSchemas.addExerciseToRoutineBody
}), async (c) => {
    try {
        const params = c.get('validatedParams');
        const body = c.get('validatedBody');
        const result = await RoutinesService.addExerciseToRoutine(c, params.id, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to add exercise to routine', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/workouts/routines/:id/exercises/:exerciseId:
 *   put:
 *     summary: Update routine exercise by ID
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Routine exercise updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoutineExerciseResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
routinesHandler.put('/:id/exercises/:exerciseId', authMiddleware, validationMiddleware({
    params: RoutineSchemas.updateRoutineExerciseParams,
    body: RoutineSchemas.updateRoutineExerciseBody
}), async (c) => {
    try {
        const params = c.get('validatedParams');
        const body = c.get('validatedBody');
        const result = await RoutinesService.updateRoutineExercise(c, params.id, params.exerciseId, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to update routine exercise', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/workouts/routines/:id/exercises/:exerciseId:
 *   delete:
 *     summary: Remove exercise from routine by ID
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exercise removed from routine successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoutineExerciseResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
routinesHandler.delete('/:id/exercises/:exerciseId', authMiddleware, validationMiddleware({ params: RoutineSchemas.updateRoutineExerciseParams }), async (c) => {
    try {
        const params = c.get('validatedParams');
        const result = await RoutinesService.removeExerciseFromRoutine(c, params.id, params.exerciseId);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to remove exercise from routine', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/workouts/routines/categories:
 *   get:
 *     summary: Get routine categories
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Routine categories
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoutineCategoriesResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
routinesHandler.get('/categories', async (c) => {
    try {
        const result = await RoutinesService.getRoutineCategories(c);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get routine categories', 500, error.message);
    }
});
/**
 * @openapi
 * /api/v1/workouts/routines/trending:
 *   get:
 *     summary: Get trending routines
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trending routines
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TrendingRoutinesResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
routinesHandler.get('/trending', authMiddleware, validationMiddleware({ query: RoutineSchemas.trendingRoutinesQuery }), async (c) => {
    try {
        const query = c.get('validatedQuery');
        const result = await RoutinesService.getTrendingRoutines(c, query);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get trending routines', 500, error.message);
    }
});
export default routinesHandler;
