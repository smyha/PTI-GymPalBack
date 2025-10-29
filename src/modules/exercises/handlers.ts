/**
 * @fileoverview Handlers for the exercises module
 * 
 * This file contains all HTTP request handlers related to exercise management.
 * Handlers allow creating custom exercises, listing them, getting reference information
 * (categories, muscle groups, equipment), updating and deleting exercises.
 * 
 * @module modules/exercises/handlers
 */

import { Context } from 'hono';
import { exerciseService } from './service.js';
import { logger } from '../../core/config/logger.js';
import {
  sendSuccess,
  sendCreated,
  sendUpdated,
  sendDeleted,
  sendNotFound,
  sendForbidden,
} from '../../core/utils/response.js';
import type { CreateExerciseData, UpdateExerciseData, ExerciseFilters } from './types.js';

/**
 * Object containing all handlers for the exercises module.
 * Includes CRUD operations and endpoints for getting reference data.
 */
export const exerciseHandlers = {
  /**
   * Creates a new custom exercise
   * 
   * Allows the user to create a custom exercise with detailed information
   * such as name, description, muscle groups worked, required equipment,
   * instructions, etc. Exercises can be private (user only) or public.
   * 
   * @param {Context} c - Context with authenticated user and validated data
   * @returns {Promise<Response>} JSON response with created exercise (status 201)
   * 
   * @example
   * // Request: POST /api/v1/exercises
   * // Body: { name: "Custom Squat Variation", muscle_groups: ["legs"], ... }
   * // Response: { success: true, data: { id, name, ... } }
   */
  async create(c: Context) {
    // Extract authenticated user and exercise data
    const user = c.get('user');
    const data = c.get('validated') as CreateExerciseData;

    try {
      // Create exercise in service
      const exercise = await exerciseService.create(user.id, data);
      
      // Log creation
      logger.info({ userId: user.id, exerciseId: exercise.id }, 'Exercise created');
      
      // Return created exercise
      return sendCreated(c, exercise);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id }, 'Failed to create exercise');
      throw error;
    }
  },

  /**
   * Lists exercises available for the user
   * 
   * Gets a list of exercises that the user can use. Includes public
   * system exercises and user's custom exercises. Supports filters
   * such as category, muscle group, equipment, name, etc.
   * 
   * @param {Context} c - Context with authenticated user and validated filters
   * @returns {Promise<Response>} JSON response with list of exercises
   * 
   * @example
   * // Request: GET /api/v1/exercises?muscle_group=chest&equipment=barbell
   * // Response: { success: true, data: [{ id, name, ... }, ...] }
   */
  async list(c: Context) {
    // Get user and validated filters
    const user = c.get('user');
    const filters = c.get('validated') as ExerciseFilters;

    try {
      // Find exercises applying the filters
      const exercises = await exerciseService.findMany(user.id, filters);
      
      // Return list of exercises
      return sendSuccess(c, exercises);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id }, 'Failed to get exercises');
      throw error;
    }
  },

  /**
   * Gets a specific exercise by its ID
   * 
   * Retrieves complete information of an exercise, including details,
   * instructions, variations, images, etc. Only allows access to public
   * exercises or private exercises of the authenticated user.
   * 
   * @param {Context} c - Context with authenticated user and validated ID
   * @returns {Promise<Response>} JSON response with exercise or 404/403 error
   * 
   * @example
   * // Request: GET /api/v1/exercises/:id
   * // Response: { success: true, data: { id, name, description, ... } }
   */
  async getById(c: Context) {
    // Extract user and exercise ID
    const user = c.get('user');
    const { id } = c.get('validated') as { id: string };

    try {
      // Find exercise, verifying access permissions
      const exercise = await exerciseService.findById(id, user.id);
      
      // If it doesn't exist, return 404 error
      if (!exercise) {
        return sendNotFound(c, 'Exercise');
      }
      
      // Return found exercise
      return sendSuccess(c, exercise);
    } catch (error: any) {
      // Handle authorization errors
      if (error.message?.includes('Not authorized')) {
        return sendForbidden(c, error.message);
      }
      // Log other errors
      logger.error({ error, userId: user.id, exerciseId: id }, 'Failed to get exercise');
      throw error;
    }
  },

  /**
   * Gets all available exercise categories
   * 
   * Returns the list of predefined exercise categories (e.g., strength, cardio,
   * flexibility, endurance, etc.). Useful for filtering and organizing exercises.
   * 
   * @param {Context} c - Request context
   * @returns {Promise<Response>} JSON response with list of categories
   * 
   * @example
   * // Request: GET /api/v1/exercises/categories
   * // Response: { success: true, data: ["strength", "cardio", "flexibility", ...] }
   */
  async getCategories(c: Context) {
    try {
      // Get categories from service (static/reference data)
      const categories = await exerciseService.getCategories();
      
      // Return categories
      return sendSuccess(c, categories);
    } catch (error: any) {
      // Log error
      logger.error({ error }, 'Failed to get categories');
      throw error;
    }
  },

  /**
   * Gets all available muscle groups
   * 
   * Returns the list of muscle groups that can be worked by exercises
   * (e.g., chest, back, legs, biceps, triceps, etc.). Useful for searches
   * and exercise filtering.
   * 
   * @param {Context} c - Request context
   * @returns {Promise<Response>} JSON response with list of muscle groups
   * 
   * @example
   * // Request: GET /api/v1/exercises/muscle-groups
   * // Response: { success: true, data: ["chest", "back", "legs", ...] }
   */
  async getMuscleGroups(c: Context) {
    try {
      // Get muscle groups from service
      const groups = await exerciseService.getMuscleGroups();
      
      // Return muscle groups
      return sendSuccess(c, groups);
    } catch (error: any) {
      // Log error
      logger.error({ error }, 'Failed to get muscle groups');
      throw error;
    }
  },

  /**
   * Gets all available equipment types
   * 
   * Returns the list of equipment types that can be used in exercises
   * (e.g., barbell, dumbbells, machines, bodyweight, resistance bands, etc.).
   * Useful for filtering exercises based on available equipment.
   * 
   * @param {Context} c - Request context
   * @returns {Promise<Response>} JSON response with list of equipment types
   * 
   * @example
   * // Request: GET /api/v1/exercises/equipment-types
   * // Response: { success: true, data: ["barbell", "dumbbell", "bodyweight", ...] }
   */
  async getEquipmentTypes(c: Context) {
    try {
      // Get equipment types from service
      const equipment = await exerciseService.getEquipmentTypes();
      
      // Return equipment types
      return sendSuccess(c, equipment);
    } catch (error: any) {
      // Log error
      logger.error({ error }, 'Failed to get equipment types');
      throw error;
    }
  },

  /**
   * Updates an existing exercise
   * 
   * Allows modifying exercise data. Only the exercise creator
   * or public system exercises can be updated (depending on permissions).
   * Fields such as name, description, muscle groups, etc. can be updated.
   * 
   * @param {Context} c - Context with user, ID and validated data
   * @returns {Promise<Response>} JSON response with updated exercise
   * 
   * @example
   * // Request: PUT /api/v1/exercises/:id
   * // Body: { name: "Updated Exercise Name", description: "New description" }
   * // Response: { success: true, data: { ...updatedExercise } }
   */
  async update(c: Context) {
    // Extract user, ID and update data
    const user = c.get('user');
    const { id } = c.get('validated') as { id: string };
    const data = c.get('validated') as UpdateExerciseData;

    try {
      // Update exercise, verifying permissions
      const exercise = await exerciseService.update(id, user.id, data);
      
      // If it doesn't exist, return 404 error
      if (!exercise) {
        return sendNotFound(c, 'Exercise');
      }
      
      // Log update
      logger.info({ userId: user.id, exerciseId: id }, 'Exercise updated');
      
      // Return updated exercise
      return sendUpdated(c, exercise);
    } catch (error: any) {
      // Handle authorization errors
      if (error.message?.includes('Not authorized')) {
        return sendForbidden(c, error.message);
      }
      // Log other errors
      logger.error({ error, userId: user.id, exerciseId: id }, 'Failed to update exercise');
      throw error;
    }
  },

  /**
   * Deletes an exercise
   * 
   * Permanently deletes an exercise from the system. Only the creator can delete
   * their custom exercise. Public system exercises generally cannot be deleted
   * by normal users.
   * 
   * @param {Context} c - Context with authenticated user and validated ID
   * @returns {Promise<Response>} Success response confirming deletion
   * 
   * @example
   * // Request: DELETE /api/v1/exercises/:id
   * // Response: { success: true, message: "Exercise deleted successfully" }
   */
  async delete(c: Context) {
    // Extract user and exercise ID
    const user = c.get('user');
    const { id } = c.get('validated') as { id: string };

    try {
      // Delete exercise, verifying permissions
      const deleted = await exerciseService.delete(id, user.id);
      
      // If it doesn't exist, return 404 error
      if (!deleted) {
        return sendNotFound(c, 'Exercise');
      }
      
      // Log deletion
      logger.info({ userId: user.id, exerciseId: id }, 'Exercise deleted');
      
      // Return deletion confirmation
      return sendDeleted(c);
    } catch (error: any) {
      // Handle authorization errors
      if (error.message?.includes('Not authorized')) {
        return sendForbidden(c, error.message);
      }
      // Log other errors
      logger.error({ error, userId: user.id, exerciseId: id }, 'Failed to delete exercise');
      throw error;
    }
  },
};
