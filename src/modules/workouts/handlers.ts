/**
 * @fileoverview Handlers for the workouts module
 * 
 * This file contains all HTTP request handlers related to workout management.
 * Handlers allow creating, reading, updating, and deleting workouts, as well as
 * listing them with filters.
 * 
 * @module modules/workouts/handlers
 */

import { Context } from 'hono';
import { workoutService } from './service.js';
import { workoutSchemas } from './schemas.js';
import { logger } from '../../core/config/logger.js';
import {
  sendSuccess,
  sendCreated,
  sendUpdated,
  sendDeleted,
  sendNotFound,
  sendForbidden,
} from '../../core/utils/response.js';
import type { CreateWorkoutData, UpdateWorkoutData, WorkoutFilters } from './types.js';
import { getUserFromCtx } from '../../core/utils/context.js';

/**
 * Object containing all handlers for the workouts module.
 * Each handler manages a specific CRUD operation on workouts.
 */
export const workoutHandlers = {
  /**
   * Creates a new workout
   * 
   * Allows the user to create a new custom workout with their
   * exercises, sets, repetitions, weights, etc. The workout is automatically
   * associated with the authenticated user.
   * 
   * @param {Context} c - Context with authenticated user and validated data
   * @returns {Promise<Response>} JSON response with created workout (status 201)
   * 
   * @example
   * // Request: POST /api/v1/workouts
   * // Body: { name: "Push Day", exercises: [...], date: "2024-01-15" }
   * // Response: { success: true, data: { id, name, ... } }
   */
  async create(c: Context) {
    // Extract authenticated user and validated data from request
    const user = getUserFromCtx(c);
    const data = c.get('validated') as CreateWorkoutData;
    const supabase = c.get('supabase'); // Get authenticated client

    try {
      // Create workout in service associated with user
      const workout = await workoutService.create(user.id, data, supabase);

      // Log creation for audit
      logger.info({ userId: user.id, workoutId: workout.id }, 'Workout created');

      // Return created workout with 201 status code
      return sendCreated(c, workout);
    } catch (error: any) {
      // Log error for analysis
      logger.error({ error, userId: user.id }, 'Failed to create workout');
      throw error;
    }
  },

  /**
   * Lists workouts for the authenticated user with optional filters
   * 
   * Gets a list of user workouts. Supports filters such as
   * start/end date, workout type, status (completed/pending),
   * etc. Allows pagination for large data volumes.
   * 
   * @param {Context} c - Context with authenticated user and validated filters
   * @returns {Promise<Response>} JSON response with list of workouts
   * 
   * @example
   * // Request: GET /api/v1/workouts?start_date=2024-01-01&end_date=2024-01-31
   * // Response: { success: true, data: [{ id, name, date, ... }, ...] }
   */
  async list(c: Context) {
    // Get authenticated user and validated filters
    const user = getUserFromCtx(c);
    const filters = c.get('validated') as WorkoutFilters;
    const supabase = c.get('supabase'); // Get authenticated client

    try {
      // Find workouts matching the filters
      const workouts = await workoutService.findMany(user.id, filters, supabase);

      // Return list of workouts
      return sendSuccess(c, workouts);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id }, 'Failed to get workouts');
      throw error;
    }
  },

  /**
   * Gets a specific workout by its ID
   * 
   * Retrieves complete details of a workout, including all
   * its exercises, sets and repetitions. Only allows access to workouts
   * of the authenticated user (authorization verification in service).
   * 
   * @param {Context} c - Context with authenticated user and validated ID
   * @returns {Promise<Response>} JSON response with workout or 404/403 error
   * 
   * @example
   * // Request: GET /api/v1/workouts/:id
   * // Response: { success: true, data: { id, name, exercises: [...], ... } }
   */
  async getById(c: Context) {
    // Extract authenticated user and workout ID
    const user = getUserFromCtx(c);
    const { id } = c.get('validated') as { id: string };
    const supabase = c.get('supabase');

    try {
      // Find workout by ID, verifying it belongs to user
      const workout = await workoutService.findById(id, user.id, supabase);

      // If it doesn't exist, return 404 error
      if (!workout) {
        return sendNotFound(c, 'Workout');
      }

      // Return found workout
      return sendSuccess(c, workout);
    } catch (error: any) {
      // If error indicates lack of authorization, return 403
      if (error.message?.includes('Not authorized')) {
        return sendForbidden(c, error.message);
      }
      // Log and re-throw other errors
      logger.error({ error, userId: user.id, workoutId: id }, 'Failed to get workout');
      throw error;
    }
  },

  /**
   * Updates an existing workout
   * 
   * Allows modifying data of an existing workout. Only the owner
   * can update their workout. Fields such as name, date, exercises, notes, etc. can be modified.
   * 
   * @param {Context} c - Context with user, ID and validated data
   * @returns {Promise<Response>} JSON response with updated workout
   * 
   * @example
   * // Request: PUT /api/v1/workouts/:id
   * // Body: { name: "Updated Push Day", notes: "Great workout!" }
   * // Response: { success: true, data: { ...updatedWorkout } }
   */
  async update(c: Context) {
    // Extract user, ID and update data
    const user = getUserFromCtx(c);
    const { id } = c.get('validated') as { id: string };
    const data = c.get('validated') as UpdateWorkoutData;
    const supabase = c.get('supabase');

    try {
      // Update workout, verifying ownership and passing authenticated client
      const workout = await workoutService.update(id, user.id, data, supabase);

      // If it doesn't exist, return 404 error
      if (!workout) {
        return sendNotFound(c, 'Workout');
      }

      // Log update
      logger.info({ userId: user.id, workoutId: id }, 'Workout updated');

      // Return updated workout
      return sendUpdated(c, workout);
    } catch (error: any) {
      // Handle authorization errors
      if (error.message?.includes('Not authorized') || error.message?.includes('can only update')) {
        return sendForbidden(c, error.message);
      }
      // Log other errors
      logger.error({ error, userId: user.id, workoutId: id }, 'Failed to update workout');
      throw error;
    }
  },

  /**
   * Deletes a workout
   *
   * Permanently deletes a workout from the system. Only the owner
   * can delete their workout. This action cannot be undone.
   *
   * @param {Context} c - Context with authenticated user and validated ID
   * @returns {Promise<Response>} Success response (status 200) confirming deletion
   *
   * @example
   * // Request: DELETE /api/v1/workouts/:id
   * // Response: { success: true, message: "Workout deleted successfully" }
   */
  async delete(c: Context) {
    // Extract authenticated user and workout ID
    const user = getUserFromCtx(c);
    const { id } = c.get('validated') as { id: string };
    const supabase = c.get('supabase');

    try {
      // Delete workout, verifying ownership
      const deleted = await workoutService.delete(id, user.id, supabase);

      // If it doesn't exist, return 404 error
      if (!deleted) {
        return sendNotFound(c, 'Workout');
      }

      // Log deletion for audit
      logger.info({ userId: user.id, workoutId: id }, 'Workout deleted');

      // Return deletion confirmation
      return sendDeleted(c);
    } catch (error: any) {
      // Handle authorization errors
      if (error.message?.includes('Not authorized')) {
        return sendForbidden(c, error.message);
      }
      // Log other errors
      logger.error({ error, userId: user.id, workoutId: id }, 'Failed to delete workout');
      throw error;
    }
  },

  /**
   * Copies an existing workout for the current user
   *
   * Allows users to copy a workout shared in the social feed or from another user.
   * Creates a new private workout with the same structure as the source.
   * The copied workout will have "(Copy)" appended to its name.
   *
   * @param {Context} c - Context with authenticated user and source workout ID
   * @returns {Promise<Response>} JSON response with the copied workout (status 201)
   *
   * @example
   * // Request: POST /api/v1/workouts/copy/:workoutId
   * // Response: { success: true, data: { id, name: "Original Name (Copy)", ... } }
   */
  async copy(c: Context) {
    // Extract authenticated user and source workout ID
    const user = getUserFromCtx(c);
    const sourceWorkoutId = c.req.param('workoutId');

    if (!sourceWorkoutId) {
      return sendNotFound(c, 'Workout ID');
    }

    try {
      // Copy the workout for the current user
      const copiedWorkout = await workoutService.copyWorkoutForUser(user.id, sourceWorkoutId);

      // Log copy operation
      logger.info({ userId: user.id, sourceWorkoutId, newWorkoutId: copiedWorkout.id }, 'Workout copied');

      // Return the new copied workout
      return sendCreated(c, copiedWorkout);
    } catch (error: any) {
      // Log errors
      logger.error({ error, userId: user.id, sourceWorkoutId }, 'Failed to copy workout');
      throw error;
    }
  },

  /**
   * Get workout count for a user (total created workouts)
   */
  async getWorkoutCount(c: Context) {
    const user = getUserFromCtx(c);
    const userId = c.req.param('userId');

    if (!userId) {
      return sendNotFound(c, 'User ID');
    }

    try {
      const count = await workoutService.getUserWorkoutCount(userId);
      return sendSuccess(c, { count });
    } catch (error: any) {
      logger.error({ error, userId: user.id, targetUserId: userId }, 'Failed to get workout count');
      throw error;
    }
  },

  /**
   * Get completed workout counts by period
   */
  async getCompletedWorkoutCounts(c: Context) {
    const user = getUserFromCtx(c);
    const userId = c.req.param('userId');
    const period = c.req.query('period') as 'week' | 'month' | 'year' | 'all' || 'all';
    const date = c.req.query('date'); // Optional reference date

    if (!userId) {
      return sendNotFound(c, 'User ID');
    }

    // Validate period
    if (!['week', 'month', 'year', 'all'].includes(period)) {
      return c.json({ success: false, error: { message: 'Invalid period. Must be week, month, year, or all' } }, 400);
    }

    try {
      const supabase = c.get('supabase');
      const count = await workoutService.getCompletedWorkoutCounts(userId, period, supabase, date);
      return sendSuccess(c, { count, period });
    } catch (error: any) {
      logger.error({ error, userId: user.id, targetUserId: userId, period }, 'Failed to get completed workout counts');
      throw error;
    }
  },

  /**
   * Get completed exercise counts by period
   */
  async getCompletedExerciseCounts(c: Context) {
    const user = getUserFromCtx(c);
    const userId = c.req.param('userId');
    const period = c.req.query('period') as 'week' | 'month' | 'year' | 'all' || 'all';
    const date = c.req.query('date'); // Optional reference date

    if (!userId) {
      return sendNotFound(c, 'User ID');
    }

    // Validate period
    if (!['week', 'month', 'year', 'all'].includes(period)) {
      return c.json({ success: false, error: { message: 'Invalid period. Must be week, month, year, or all' } }, 400);
    }

    try {
      const supabase = c.get('supabase');
      const count = await workoutService.getCompletedExerciseCounts(userId, period, supabase, date);
      return sendSuccess(c, { count, period });
    } catch (error: any) {
        logger.error({ error, userId: user.id, targetUserId: userId, period }, 'Failed to get completed exercise counts');
        throw error;
      }
    },

    /**
     * Get current streak (consecutive days with scheduled workouts)
     */
    async getCurrentStreak(c: Context) {
      const user = getUserFromCtx(c);
      const userId = c.req.param('userId');
      const { date } = c.get('validated') as { date?: string };
      const supabase = c.get('supabase');

      if (!userId) {
        return sendNotFound(c, 'User ID');
      }

      try {
        const streak = await workoutService.getCurrentStreak(userId, supabase, date);
        return sendSuccess(c, { streak });
      } catch (error: any) {
        logger.error({ error, userId: user.id, targetUserId: userId }, 'Failed to get current streak');
        throw error;
      }
    },

    /**
     * Create exercise set logs (batch)
     */
    async createSetLogs(c: Context) {
      const user = getUserFromCtx(c);
      const data = c.get('validated') as any[];
      const supabase = c.get('supabase');

      try {
        const logs = await workoutService.createSetLogs(user.id, data, supabase);
        logger.info({ userId: user.id, logCount: logs.length }, 'Set logs created');
        return sendCreated(c, { logs });
      } catch (error: any) {
        logger.error({ error, userId: user.id }, 'Failed to create set logs');
        throw error;
      }
    },

    /**
     * Get set logs for a session or scheduled workout
     */
    async getSetLogs(c: Context) {
      const user = getUserFromCtx(c);
      const sessionId = c.req.query('session_id');
      const scheduledWorkoutId = c.req.query('scheduled_workout_id');
      const supabase = c.get('supabase');

      try {
        const logs = await workoutService.getSetLogs(sessionId, scheduledWorkoutId, supabase);
        return sendSuccess(c, { logs });
      } catch (error: any) {
        logger.error({ error, userId: user.id }, 'Failed to get set logs');
        throw error;
      }
    },

    /**
     * Get progress statistics for charts
     */
    async getProgressStats(c: Context) {
      const user = getUserFromCtx(c);
      const { period, exercise_id } = c.get('validated') as { period: string; exercise_id?: string };
      const supabase = c.get('supabase');

      try {
        const stats = await workoutService.getProgressStats(
          user.id,
          period as 'week' | 'month' | 'year' | 'all',
          exercise_id,
          supabase
        );
        return sendSuccess(c, stats);
      } catch (error: any) {
        logger.error({ error, userId: user.id }, 'Failed to get progress stats');
        throw error;
      }
    },
};
