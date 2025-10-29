/**
 * Workout Handlers Module
 * 
 * This module manages all workout-related operations:
 * - Workout plan CRUD operations
 * - Exercise management within workouts
 * - Workout session management (start, complete, track)
 * - Workout history and statistics
 * 
 * All routes require authentication and use schema validation
 * to ensure data integrity.
 */

import { Hono } from 'hono';
import { validationMiddleware } from '../shared/middleware/validation.middleware.js';
import { authMiddleware } from '../shared/middleware/auth.middleware.js';
import { listWorkouts, createWorkout, getWorkout, updateWorkout, deleteWorkout, getWorkoutExercises, addExerciseToWorkout, updateWorkoutExercise, removeExerciseFromWorkout, startWorkoutSession, completeWorkoutSession, listWorkoutSessions, getWorkoutSession, updateWorkoutSession, deleteWorkoutSession } from '../services/workout.service.js';
import { WorkoutSchemas } from '../doc/schemas.js';
import { sendError } from '../shared/utils/response.js';
import '../shared/types/hono.types.js';

// Hono router instance for workout routes
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
 * - limit: Results per page (default: 20)
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Workouts retrieved successfully
 * - 401: User not authenticated
 * - 500: Internal server error
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
/**
 * Handler: Get exercises in a workout
 * 
 * Endpoint: GET /api/v1/workouts/:id/exercises
 * 
 * Process:
 * 1. Validates authentication and workout ID
 * 2. Retrieves all exercises associated with the workout
 * 3. Returns exercises with their configuration (sets, reps, order)
 * 
 * Exercise information includes:
 * - Exercise details (name, description, muscle groups)
 * - Sets and reps configuration
 * - Order/sequence in workout
 * - Rest time between sets
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Exercises retrieved successfully
 * - 404: Workout not found or user doesn't have access
 * - 500: Internal server error
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
/**
 * Handler: Add exercise to workout
 * 
 * Endpoint: POST /api/v1/workouts/:id/exercises
 * 
 * Process:
 * 1. Validates authentication and workout ownership
 * 2. Validates exercise exists and is valid
 * 3. Adds exercise to workout with specified configuration
 * 4. Returns updated workout with new exercise
 * 
 * Exercise configuration includes:
 * - Exercise ID (must exist in exercises catalog)
 * - Number of sets
 * - Reps per set (or duration for time-based exercises)
 * - Order/position in workout
 * - Rest time between sets
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 201: Exercise added successfully
 * - 400: Validation error or exercise doesn't exist
 * - 404: Workout not found or user doesn't have access
 * - 500: Internal server error
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
/**
 * Handler: Update exercise in workout
 * 
 * Endpoint: PUT /api/v1/workouts/:id/exercises/:exerciseId
 * 
 * Process:
 * 1. Validates authentication and workout ownership
 * 2. Verifies exercise exists in the workout
 * 3. Updates exercise configuration (sets, reps, order)
 * 4. Returns updated workout
 * 
 * Updatable fields:
 * - Number of sets
 * - Reps per set
 * - Rest time
 * - Order/position in workout
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Exercise updated successfully
 * - 400: Validation error
 * - 404: Workout or exercise not found
 * - 500: Internal server error
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
/**
 * Handler: Remove exercise from workout
 * 
 * Endpoint: DELETE /api/v1/workouts/:id/exercises/:exerciseId
 * 
 * Process:
 * 1. Validates authentication and workout ownership
 * 2. Verifies exercise exists in the workout
 * 3. Removes exercise from workout
 * 4. Reorders remaining exercises if necessary
 * 
 * Note: This only removes the exercise from the workout plan.
 * Exercise sessions history is preserved for statistics.
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Exercise removed successfully
 * - 404: Workout or exercise not found
 * - 500: Internal server error
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
/**
 * Handler: Start workout session
 * 
 * Endpoint: POST /api/v1/workouts/:id/start
 * 
 * Process:
 * 1. Validates authentication and workout exists
 * 2. Creates a new workout session with start timestamp
 * 3. Initializes session state (in progress)
 * 4. Returns session ID and initial data
 * 
 * Session data includes:
 * - Start timestamp
 * - Workout plan reference
 * - Initial exercise tracking
 * - Estimated completion time
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 201: Workout session started successfully
 * - 400: Validation error or workout not found
 * - 404: Workout not found or user doesn't have access
 * - 500: Internal server error
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
/**
 * Handler: Complete workout session
 * 
 * Endpoint: POST /api/v1/workouts/:id/complete
 * 
 * Process:
 * 1. Validates authentication and active session exists
 * 2. Records performance data for each exercise (sets completed, reps, weight)
 * 3. Calculates session duration and statistics
 * 4. Updates user achievements and statistics
 * 5. Marks session as completed
 * 
 * Performance data includes:
 * - Sets completed per exercise
 * - Reps performed per set
 * - Weight used (if applicable)
 * - Rest time between sets
 * - Notes and observations
 * 
 * Requires: Valid authentication token and active session
 * 
 * Responses:
 * - 200: Workout session completed successfully
 * - 400: Validation error or no active session
 * - 404: Workout not found
 * - 500: Internal server error
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
/**
 * Handler: List workout sessions
 * 
 * Endpoint: GET /api/v1/workouts/sessions
 * 
 * Process:
 * 1. Validates authentication and pagination parameters
 * 2. Retrieves paginated list of workout sessions for authenticated user
 * 3. Returns sessions with summary data (date, duration, exercises completed)
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20)
 * - workout_id: Filter by specific workout (optional)
 * - date_from: Filter sessions from date (optional)
 * - date_to: Filter sessions to date (optional)
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Sessions retrieved successfully
 * - 401: User not authenticated
 * - 500: Internal server error
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
/**
 * Handler: Get workout session details
 * 
 * Endpoint: GET /api/v1/workouts/sessions/:sessionId
 * 
 * Process:
 * 1. Validates authentication and session ID
 * 2. Verifies user owns the session
 * 3. Retrieves complete session data including performance metrics
 * 
 * Session details include:
 * - Start and end timestamps
 * - Total duration
 * - Workout plan reference
 * - Performance data for each exercise
 * - Statistics (total volume, average rest time, etc.)
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Session retrieved successfully
 * - 404: Session not found or user doesn't have access
 * - 500: Internal server error
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
/**
 * Handler: Update workout session
 * 
 * Endpoint: PUT /api/v1/workouts/sessions/:sessionId
 * 
 * Process:
 * 1. Validates authentication and session ownership
 * 2. Updates session data (performance metrics, notes, etc.)
 * 3. Recalculates statistics if performance data changed
 * 
 * Note: Typically used to update incomplete sessions or correct data
 * Most sessions are finalized when completed, but updates may be needed
 * for active sessions or corrections.
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Session updated successfully
 * - 400: Validation error
 * - 404: Session not found or user doesn't have access
 * - 500: Internal server error
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
/**
 * Handler: Delete workout session
 * 
 * Endpoint: DELETE /api/v1/workouts/sessions/:sessionId
 * 
 * Process:
 * 1. Validates authentication and session ownership
 * 2. Verifies session exists
 * 3. Deletes session and associated performance data
 * 4. Updates user statistics (removes this session's contribution)
 * 
 * Warning: This operation cannot be undone. Deletes:
 * - Session record
 * - Performance data for all exercises in session
 * - Session statistics
 * 
 * Note: This will affect user statistics and achievements if session
 * was previously counted in calculations.
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Session deleted successfully
 * - 404: Session not found or user doesn't have access
 * - 500: Internal server error
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
