import { Hono } from 'hono';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { calendarHandlers } from './handlers.js';
import { calendarSchemas } from './schemas.js';

const calendarRoutes = new Hono();

// Require auth for calendar operations
calendarRoutes.use('*', auth);

/**
 * POST /add-workout
 * Adds a workout to a given date for the authenticated user
 */
calendarRoutes.post('/add-workout', validate(calendarSchemas.addWorkout, 'body'), calendarHandlers.addWorkout);

/**
 * GET / (optionally month/year query) - returns scheduled workouts
 */
calendarRoutes.get('/', validate(calendarSchemas.getCalendar, 'query'), calendarHandlers.getCalendar);

// Update a scheduled item
calendarRoutes.put('/:id', validate(calendarSchemas.updateScheduled, 'body'), calendarHandlers.updateScheduled);

// Delete a scheduled item
calendarRoutes.delete('/:id', calendarHandlers.deleteScheduled);

export default calendarRoutes;
