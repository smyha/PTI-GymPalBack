/**
 * @fileoverview Handlers for the users module
 * 
 * This file contains all HTTP request handlers related to user management.
 * Handlers act as controllers that process requests, validate data, call
 * corresponding services, and format HTTP responses.
 * 
 * @module modules/users/handlers
 */

import { Context } from 'hono';
import { userService } from './service.js';
import { logger } from '../../core/config/logger.js';
import {
  sendSuccess,
  sendUpdated,
  sendNotFound,
} from '../../core/utils/response.js';
import type { UpdateProfileData, SearchUsersFilters } from './types.js';

/**
 * Object containing all handlers for the users module.
 * Each handler is an async function that processes a specific HTTP request.
 */
export const userHandlers = {
  /**
   * Gets the complete profile of the authenticated user
   * 
   * This handler retrieves the profile information of the currently
   * authenticated user. It extracts the user from the context (added by
   * the authentication middleware) and obtains their complete profile from the service.
   * 
   * @param {Context} c - Hono context containing the request and response
   * @returns {Promise<Response>} JSON response with user profile or 404 error if not found
   * 
   * @example
   * // Request: GET /api/v1/users/profile
   * // Response: { success: true, data: { id, email, username, ... } }
   */
  async getProfile(c: Context) {
    // Get the user from context (added by authentication middleware)
    const user = c.get('user');

    try {
      // Call the service to get the complete profile
      const profile = await userService.getProfile(user.id);
      
      // If profile doesn't exist, return 404 error
      if (!profile) {
        return sendNotFound(c, 'User profile');
      }
      
      // Return profile successfully
      return sendSuccess(c, profile);
    } catch (error: any) {
      // Log error for debugging
      logger.error({ error, userId: user.id }, 'Failed to get profile');
      // Re-throw error so error middleware can handle it
      throw error;
    }
  },

  /**
   * Gets the profile of a specific user by their ID
   * 
   * This handler allows retrieving public information of any user in the system
   * by their ID. The data retrieved depends on the user's privacy policies
   * and the authenticated user's permissions.
   * 
   * @param {Context} c - Hono context with validated ID in 'validated'
   * @returns {Promise<Response>} JSON response with user profile or 404 error
   * 
   * @example
   * // Request: GET /api/v1/users/:id
   * // Response: { success: true, data: { id, username, ... } }
   */
  async getById(c: Context) {
    // Get user ID from validated data
    const { id } = c.get('validated') as { id: string };

    try {
      // Find user by ID in the service
      const profile = await userService.getById(id);
      
      // If user doesn't exist, return 404 error
      if (!profile) {
        return sendNotFound(c, 'User');
      }
      
      // Return found profile
      return sendSuccess(c, profile);
    } catch (error: any) {
      // Log error with the searched user ID
      logger.error({ error, userId: id }, 'Failed to get user');
      throw error;
    }
  },

  /**
   * Updates the authenticated user's profile
   * 
   * Allows the user to update their own profile information such as
   * name, bio, avatar, privacy settings, etc. Only the user can modify
   * their own profile (guaranteed by authentication middleware).
   * 
   * @param {Context} c - Context with authenticated user and validated data
   * @returns {Promise<Response>} JSON response with updated profile
   * 
   * @example
   * // Request: PUT /api/v1/users/profile
   * // Body: { full_name: "John Doe", bio: "Fitness enthusiast" }
   * // Response: { success: true, data: { ...updatedProfile } }
   */
  async updateProfile(c: Context) {
    // Get authenticated user and validated data from request body
    const user = c.get('user');
    const data = c.get('validated') as UpdateProfileData;

    try {
      // Update profile in service with new data
      const profile = await userService.updateProfile(user.id, data);
      
      // Log action for audit
      logger.info({ userId: user.id }, 'Profile updated');
      
      // Return updated profile with 200 status code
      return sendUpdated(c, profile);
    } catch (error: any) {
      // Log error for debugging
      logger.error({ error, userId: user.id }, 'Failed to update profile');
      throw error;
    }
  },

  /**
   * Searches users in the system according to filter criteria
   * 
   * This handler allows searching and filtering users using different criteria
   * such as name, username, fitness level, etc. Useful for social features
   * like finding friends or trainers.
   * 
   * @param {Context} c - Context with validated filters in 'validated'
   * @returns {Promise<Response>} JSON response with list of found users
   * 
   * @example
   * // Request: GET /api/v1/users/search?username=john&fitness_level=intermediate
   * // Response: { success: true, data: [{ id, username, ... }, ...] }
   */
  async search(c: Context) {
    // Get search filters from validated parameters
    const filters = c.get('validated') as SearchUsersFilters;

    try {
      // Execute search in service with provided filters
      const users = await userService.search(filters);
      
      // Return list of found users
      return sendSuccess(c, users);
    } catch (error: any) {
      // Log error along with used filters for debugging
      logger.error({ error, filters }, 'Failed to search users');
      throw error;
    }
  },

  /**
   * Gets statistics for the authenticated user
   * 
   * Retrieves metrics and statistics related to the user's progress,
   * such as number of completed workouts, total exercise time, achievements,
   * goal progress, etc. These statistics are used in the dashboard.
   * 
   * @param {Context} c - Context with authenticated user
   * @returns {Promise<Response>} JSON response with user statistics
   * 
   * @example
   * // Request: GET /api/v1/users/stats
   * // Response: { success: true, data: { workouts: 45, hours: 120, ... } }
   */
  async getStats(c: Context) {
    // Get authenticated user
    const user = c.get('user');

    try {
      // Get user statistics from service
      const stats = await userService.getUserStats(user.id);
      
      // Return statistics
      return sendSuccess(c, stats);
    } catch (error: any) {
      // Log error for later analysis
      logger.error({ error, userId: user.id }, 'Failed to get user stats');
      throw error;
    }
  },
};
