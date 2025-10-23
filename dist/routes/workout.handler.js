import { Hono } from 'hono';
import { validationMiddleware } from '../shared/middleware/validation.middleware.js';
import { authMiddleware } from '../shared/middleware/auth.middleware.js';
import * as WorkoutService from '../services/workout.service.js';
import { WorkoutSchemas } from '../doc/schemas.js';
import { sendError } from '../shared/utils/response.js';
import '../shared/types/hono.types.js';
const workoutHandler = new Hono();
// GET /api/v1/workouts
workoutHandler.get('/', authMiddleware, validationMiddleware(WorkoutSchemas.listWorkoutsQuery), async (c) => {
    try {
        const query = c.get('validatedQuery');
        const result = await WorkoutService.listWorkouts(c, query);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to list workouts', 500, error.message);
    }
});
// POST /api/v1/workouts
workoutHandler.post('/', authMiddleware, validationMiddleware(WorkoutSchemas.createWorkoutBody), async (c) => {
    try {
        const body = c.get('validatedBody');
        const result = await WorkoutService.createWorkout(c, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to create workout', 500, error.message);
    }
});
// GET /api/v1/workouts/:id
workoutHandler.get('/:id', authMiddleware, validationMiddleware({ params: WorkoutSchemas.getWorkoutParams }), async (c) => {
    try {
        const params = c.get('validatedParams');
        const result = await WorkoutService.getWorkout(c, params.id);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get workout', 500, error.message);
    }
});
// PUT /api/v1/workouts/:id
workoutHandler.put('/:id', authMiddleware, validationMiddleware({
    params: WorkoutSchemas.getWorkoutParams,
    body: WorkoutSchemas.updateWorkoutBody
}), async (c) => {
    try {
        const params = c.get('validatedParams');
        const body = c.get('validatedBody');
        const result = await WorkoutService.updateWorkout(c, params.id, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to update workout', 500, error.message);
    }
});
// DELETE /api/v1/workouts/:id
workoutHandler.delete('/:id', authMiddleware, validationMiddleware({ params: WorkoutSchemas.getWorkoutParams }), async (c) => {
    try {
        const params = c.get('validatedParams');
        const result = await WorkoutService.deleteWorkout(c, params.id);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to delete workout', 500, error.message);
    }
});
// GET /api/v1/workouts/:id/exercises
workoutHandler.get('/:id/exercises', authMiddleware, validationMiddleware({ params: WorkoutSchemas.getWorkoutParams }), async (c) => {
    try {
        const params = c.get('validatedParams');
        const result = await WorkoutService.getWorkoutExercises(c, params.id);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get workout exercises', 500, error.message);
    }
});
// POST /api/v1/workouts/:id/exercises
workoutHandler.post('/:id/exercises', authMiddleware, validationMiddleware({
    params: WorkoutSchemas.getWorkoutParams,
    body: WorkoutSchemas.addExerciseBody
}), async (c) => {
    try {
        const params = c.get('validatedParams');
        const body = c.get('validatedBody');
        const result = await WorkoutService.addExerciseToWorkout(c, params.id, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to add exercise to workout', 500, error.message);
    }
});
// PUT /api/v1/workouts/:id/exercises/:exerciseId
workoutHandler.put('/:id/exercises/:exerciseId', authMiddleware, validationMiddleware({
    params: WorkoutSchemas.updateExerciseParams,
    body: WorkoutSchemas.updateExerciseBody
}), async (c) => {
    try {
        const params = c.get('validatedParams');
        const body = c.get('validatedBody');
        const result = await WorkoutService.updateWorkoutExercise(c, params.id, params.exerciseId, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to update workout exercise', 500, error.message);
    }
});
// DELETE /api/v1/workouts/:id/exercises/:exerciseId
workoutHandler.delete('/:id/exercises/:exerciseId', authMiddleware, validationMiddleware({ params: WorkoutSchemas.updateExerciseParams }), async (c) => {
    try {
        const params = c.get('validatedParams');
        const result = await WorkoutService.removeExerciseFromWorkout(c, params.id, params.exerciseId);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to remove exercise from workout', 500, error.message);
    }
});
// POST /api/v1/workouts/:id/start
workoutHandler.post('/:id/start', authMiddleware, validationMiddleware({
    params: WorkoutSchemas.getWorkoutParams,
    body: WorkoutSchemas.startWorkoutBody
}), async (c) => {
    try {
        const params = c.get('validatedParams');
        const body = c.get('validatedBody');
        const result = await WorkoutService.startWorkoutSession(c, params.id, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to start workout session', 500, error.message);
    }
});
// POST /api/v1/workouts/:id/complete
workoutHandler.post('/:id/complete', authMiddleware, validationMiddleware({
    params: WorkoutSchemas.getWorkoutParams,
    body: WorkoutSchemas.completeWorkoutBody
}), async (c) => {
    try {
        const params = c.get('validatedParams');
        const body = c.get('validatedBody');
        const result = await WorkoutService.completeWorkoutSession(c, params.id, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to complete workout session', 500, error.message);
    }
});
// GET /api/v1/workouts/sessions
workoutHandler.get('/sessions', authMiddleware, validationMiddleware({ query: WorkoutSchemas.listSessionsQuery }), async (c) => {
    try {
        const query = c.get('validatedQuery');
        const result = await WorkoutService.listWorkoutSessions(c, query);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to list workout sessions', 500, error.message);
    }
});
// GET /api/v1/workouts/sessions/:sessionId
workoutHandler.get('/sessions/:sessionId', authMiddleware, validationMiddleware({ params: WorkoutSchemas.getSessionParams }), async (c) => {
    try {
        const params = c.get('validatedParams');
        const result = await WorkoutService.getWorkoutSession(c, params.sessionId);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get workout session', 500, error.message);
    }
});
// PUT /api/v1/workouts/sessions/:sessionId
workoutHandler.put('/sessions/:sessionId', authMiddleware, validationMiddleware({
    params: WorkoutSchemas.getSessionParams,
    body: WorkoutSchemas.updateSessionBody
}), async (c) => {
    try {
        const params = c.get('validatedParams');
        const body = c.get('validatedBody');
        const result = await WorkoutService.updateWorkoutSession(c, params.sessionId, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to update workout session', 500, error.message);
    }
});
// DELETE /api/v1/workouts/sessions/:sessionId
workoutHandler.delete('/sessions/:sessionId', authMiddleware, validationMiddleware({ params: WorkoutSchemas.getSessionParams }), async (c) => {
    try {
        const params = c.get('validatedParams');
        const result = await WorkoutService.deleteWorkoutSession(c, params.sessionId);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to delete workout session', 500, error.message);
    }
});
export default workoutHandler;
