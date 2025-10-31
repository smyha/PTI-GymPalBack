/**
 * @fileoverview Handlers for the personal information module
 * 
 * This file contains all HTTP request handlers related to personal information
 * and fitness profile management. Handlers allow users to manage their personal
 * details and fitness-specific information.
 * 
 * @module modules/personal/handlers
 */

import { Context } from 'hono';
import { personalService } from './service.js';
import { logger } from '../../core/config/logger.js';
import { sendSuccess, sendUpdated } from '../../core/utils/response.js';
import type { UpdatePersonalInfoData, UpdateFitnessProfileData } from './types.js';

/**
 * Object containing all handlers for the personal information module.
 * Handlers manage both general personal info and fitness-specific profiles.
 */
export const personalHandlers = {
  /**
   * Gets personal information for the authenticated user
   * 
   * Retrieves general personal information such as date of birth, gender,
   * location, contact preferences, etc. This is separate from the fitness
   * profile and user profile.
   * 
   * @param {Context} c - Context with authenticated user
   * @returns {Promise<Response>} JSON response with personal information
   * 
   * @example
   * // Request: GET /api/v1/personal/info
   * // Response: { success: true, data: { date_of_birth: "...", gender: "...", ... } }
   */
  async getInfo(c: Context) {
    // Get authenticated user
    const user = c.get('user');
    
    try {
      // Get personal information from service
      const info = await personalService.getPersonalInfo(user.id);
      
      // Log success
      logger.info({ userId: user.id }, 'Personal info retrieved');

      // Return personal information
      return sendSuccess(c, info);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id }, 'Failed to get personal info');
      throw error;
    }
  },

  /**
   * Updates personal information for the authenticated user
   * 
   * Allows the user to update their personal details such as date of birth,
   * gender, location, contact information, etc. Only the user can update
   * their own personal information.
   * 
   * @param {Context} c - Context with authenticated user and validated data
   * @returns {Promise<Response>} JSON response with updated personal information
   * 
   * @example
   * // Request: PUT /api/v1/personal/info
   * // Body: { date_of_birth: "1990-01-01", gender: "male" }
   * // Response: { success: true, data: { ...updatedInfo } }
   */
  async updateInfo(c: Context) {
    // Get authenticated user and validated update data
    const user = c.get('user');
    const data = c.get('validated') as UpdatePersonalInfoData;
    
    try {
      // Update personal information in service
      const info = await personalService.updatePersonalInfo(user.id, data);
      
      // Log success
      logger.info({ userId: user.id }, 'Personal info updated');

      // Return updated information
      return sendUpdated(c, info);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id }, 'Failed to update personal info');
      throw error;
    }
  },

  /**
   * Gets fitness profile for the authenticated user
   * 
   * Retrieves fitness-specific information such as current weight, height,
   * body measurements, fitness goals, target metrics, training preferences,
   * experience level, etc.
   * 
   * @param {Context} c - Context with authenticated user
   * @returns {Promise<Response>} JSON response with fitness profile
   * 
   * @example
   * // Request: GET /api/v1/personal/fitness-profile
   * // Response: { success: true, data: { weight: 75, height: 180, goals: [...], ... } }
   */
  async getFitnessProfile(c: Context) {
    // Get authenticated user
    const user = c.get('user');
    
    try {
      // Get fitness profile from service
      const profile = await personalService.getFitnessProfile(user.id);
      
      // Log success
      logger.info({ userId: user.id }, 'Fitness profile retrieved');

      // Return fitness profile
      return sendSuccess(c, profile);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id }, 'Failed to get fitness profile');
      throw error;
    }
  },

  /**
   * Updates fitness profile for the authenticated user
   * 
   * Allows the user to update their fitness-related information such as
   * current metrics, goals, training preferences, experience level, etc.
   * These updates are used for personalized workout recommendations and progress tracking.
   * 
   * @param {Context} c - Context with authenticated user and validated data
   * @returns {Promise<Response>} JSON response with updated fitness profile
   * 
   * @example
   * // Request: PUT /api/v1/personal/fitness-profile
   * // Body: { weight: 80, height: 180, fitness_goals: ["strength", "endurance"] }
   * // Response: { success: true, data: { ...updatedProfile } }
   */
  async updateFitnessProfile(c: Context) {
    // Get authenticated user and validated update data
    const user = c.get('user');
    const data = c.get('validated') as UpdateFitnessProfileData;
    
    try {
      // Update fitness profile in service
      const profile = await personalService.updateFitnessProfile(user.id, data);
      
      // Log success
      logger.info({ userId: user.id }, 'Fitness profile updated');

      // Return updated profile
      return sendUpdated(c, profile);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id }, 'Failed to update fitness profile');
      throw error;
    }
  },
};

