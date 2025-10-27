import { Hono } from 'hono';
import { validationMiddleware } from '../shared/middleware/validation.middleware.js';
import { authMiddleware } from '../shared/middleware/auth.middleware.js';
import { listWorkouts, createWorkout, getWorkout, updateWorkout, deleteWorkout, getWorkoutExercises, addExerciseToWorkout, updateWorkoutExercise, removeExerciseFromWorkout, startWorkoutSession, completeWorkoutSession, listWorkoutSessions, getWorkoutSession, updateWorkoutSession, deleteWorkoutSession } from '../services/workout.service.js';
import { WorkoutSchemas } from '../doc/schemas.js';
import { sendError } from '../shared/utils/response.js';
import '../shared/types/hono.types.js';
const workoutHandler = new Hono();
/**
 * @openapi
 * /api/v1/workouts:
 *   get:
 *     summary: List workouts
 *     description: Get paginated list of workouts for authenticated user
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *     responses:
 *       200:
 *         description: Workouts retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
workoutHandler.get('/', authMiddleware, validationMiddleware(WorkoutSchemas.listWorkoutsQuery), async (c) => {
    try {
        return await listWorkouts(c, c.get('validatedQuery'));
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to list workouts', 500);
    }
});
/**
 * @openapi
 * /api/v1/workouts:
 *   post:
 *     summary: Create workout
 *     description: Create a new workout plan
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWorkoutRequest'
 *     responses:
 *       201:
 *         description: Workout created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
workoutHandler.post('/', authMiddleware, validationMiddleware(WorkoutSchemas.createWorkoutBody), async (c) => {
    try {
        return await createWorkout(c, c.get('validatedBody'));
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to create workout', 500);
    }
});
/**
 * @openapi
 * /api/v1/workouts/{id}:
 *   get:
 *     summary: Get workout by ID
 *     description: Retrieve detailed information about a specific workout
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Workout ID
 *     responses:
 *       200:
 *         description: Workout retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
workoutHandler.get('/:id', authMiddleware, validationMiddleware({ params: WorkoutSchemas.getWorkoutParams }), async (c) => {
    try {
        return await getWorkout(c, c.get('validatedParams').id);
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to get workout', 500);
    }
});
/**
 * @openapi
 * /api/v1/workouts/{id}:
 *   put:
 *     summary: Update workout
 *     description: Update an existing workout plan
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
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
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
workoutHandler.put('/:id', authMiddleware, validationMiddleware({ params: WorkoutSchemas.getWorkoutParams, body: WorkoutSchemas.updateWorkoutBody }), async (c) => {
    try {
        return await updateWorkout(c, c.get('validatedParams').id, c.get('validatedBody'));
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to update workout', 500);
    }
});
/**
 * @openapi
 * /api/v1/workouts/{id}:
 *   delete:
 *     summary: Delete workout
 *     description: Delete a workout plan
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Workout ID
 *     responses:
 *       200:
 *         description: Workout deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
workoutHandler.delete('/:id', authMiddleware, validationMiddleware({ params: WorkoutSchemas.getWorkoutParams }), async (c) => {
    try {
        return await deleteWorkout(c, c.get('validatedParams').id);
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to delete workout', 500);
    }
});
/**
 * @openapi
 * /api/v1/workouts/{id}/exercises:
 *   get:
 *     summary: Get workout exercises
 *     description: Retrieve all exercises in a workout plan
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Workout ID
 *     responses:
 *       200:
 *         description: Workout exercises retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
workoutHandler.get('/:id/exercises', authMiddleware, validationMiddleware({ params: WorkoutSchemas.getWorkoutParams }), async (c) => {
    try {
        return await getWorkoutExercises(c, c.get('validatedParams').id);
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to get workout exercises', 500);
    }
});
/**
 * @openapi
 * /api/v1/workouts/{id}/exercises:
 *   post:
 *     summary: Add exercise to workout
 *     description: Add an exercise to a workout plan with sets, reps, and order
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Workout ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddExerciseRequest'
 *     responses:
 *       201:
 *         description: Exercise added successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
workoutHandler.post('/:id/exercises', authMiddleware, validationMiddleware({ params: WorkoutSchemas.getWorkoutParams, body: WorkoutSchemas.addExerciseBody }), async (c) => {
    try {
        return await addExerciseToWorkout(c, c.get('validatedParams').id, c.get('validatedBody'));
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to add exercise', 500);
    }
});
/**
 * @openapi
 * /api/v1/workouts/{id}/exercises/{exerciseId}:
 *   put:
 *     summary: Update workout exercise
 *     description: Update sets, reps, or order of an exercise in workout
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Workout ID
 *       - name: exerciseId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Exercise ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateExerciseRequest'
 *     responses:
 *       200:
 *         description: Exercise updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
workoutHandler.put('/:id/exercises/:exerciseId', authMiddleware, validationMiddleware({ params: WorkoutSchemas.updateExerciseParams, body: WorkoutSchemas.updateExerciseBody }), async (c) => {
    try {
        const params = c.get('validatedParams');
        return await updateWorkoutExercise(c, params.id, params.exerciseId, c.get('validatedBody'));
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to update exercise', 500);
    }
});
/**
 * @openapi
 * /api/v1/workouts/{id}/exercises/{exerciseId}:
 *   delete:
 *     summary: Remove exercise from workout
 *     description: Remove an exercise from a workout plan
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Workout ID
 *       - name: exerciseId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Exercise ID
 *     responses:
 *       200:
 *         description: Exercise removed successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
workoutHandler.delete('/:id/exercises/:exerciseId', authMiddleware, validationMiddleware({ params: WorkoutSchemas.updateExerciseParams }), async (c) => {
    try {
        const params = c.get('validatedParams');
        return await removeExerciseFromWorkout(c, params.id, params.exerciseId);
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to remove exercise', 500);
    }
});
/**
 * @openapi
 * /api/v1/workouts/{id}/start:
 *   post:
 *     summary: Start workout session
 *     description: Start a new workout session for a workout plan
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Workout ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StartWorkoutRequest'
 *     responses:
 *       201:
 *         description: Workout session started successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
workoutHandler.post('/:id/start', authMiddleware, validationMiddleware({ params: WorkoutSchemas.getWorkoutParams, body: WorkoutSchemas.startWorkoutBody }), async (c) => {
    try {
        return await startWorkoutSession(c, c.get('validatedParams').id, c.get('validatedBody'));
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to start session', 500);
    }
});
/**
 * @openapi
 * /api/v1/workouts/{id}/complete:
 *   post:
 *     summary: Complete workout session
 *     description: Complete an active workout session with performance data
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Workout ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompleteWorkoutRequest'
 *     responses:
 *       200:
 *         description: Workout session completed successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
workoutHandler.post('/:id/complete', authMiddleware, validationMiddleware({ params: WorkoutSchemas.getWorkoutParams, body: WorkoutSchemas.completeWorkoutBody }), async (c) => {
    try {
        return await completeWorkoutSession(c, c.get('validatedParams').id, c.get('validatedBody'));
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to complete session', 500);
    }
});
/**
 * @openapi
 * /api/v1/workouts/sessions:
 *   get:
 *     summary: List workout sessions
 *     description: Get paginated list of workout sessions for authenticated user
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *     responses:
 *       200:
 *         description: Workout sessions retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
workoutHandler.get('/sessions', authMiddleware, validationMiddleware({ query: WorkoutSchemas.listSessionsQuery }), async (c) => {
    try {
        return await listWorkoutSessions(c, c.get('validatedQuery'));
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to list sessions', 500);
    }
});
/**
 * @openapi
 * /api/v1/workouts/sessions/{sessionId}:
 *   get:
 *     summary: Get workout session
 *     description: Retrieve detailed information about a specific workout session
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Workout session retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
workoutHandler.get('/sessions/:sessionId', authMiddleware, validationMiddleware({ params: WorkoutSchemas.getSessionParams }), async (c) => {
    try {
        return await getWorkoutSession(c, c.get('validatedParams').sessionId);
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to get session', 500);
    }
});
/**
 * @openapi
 * /api/v1/workouts/sessions/{sessionId}:
 *   put:
 *     summary: Update workout session
 *     description: Update an existing workout session
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSessionRequest'
 *     responses:
 *       200:
 *         description: Workout session updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
workoutHandler.put('/sessions/:sessionId', authMiddleware, validationMiddleware({ params: WorkoutSchemas.getSessionParams, body: WorkoutSchemas.updateSessionBody }), async (c) => {
    try {
        return await updateWorkoutSession(c, c.get('validatedParams').sessionId, c.get('validatedBody'));
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to update session', 500);
    }
});
/**
 * @openapi
 * /api/v1/workouts/sessions/{sessionId}:
 *   delete:
 *     summary: Delete workout session
 *     description: Delete a workout session
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Workout session deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
workoutHandler.delete('/sessions/:sessionId', authMiddleware, validationMiddleware({ params: WorkoutSchemas.getSessionParams }), async (c) => {
    try {
        return await deleteWorkoutSession(c, c.get('validatedParams').sessionId);
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to delete session', 500);
    }
});
export default workoutHandler;
