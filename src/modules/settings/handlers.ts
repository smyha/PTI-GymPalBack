/**
 * @fileoverview Handlers for the settings module
 * 
 * This file contains all HTTP request handlers related to user settings management.
 * Handlers allow users to manage their application settings, notification preferences,
 * privacy settings, and other configuration options.
 * 
 * @module modules/settings/handlers
 */

import { Context } from 'hono';
import { settingsService } from './service.js';
import { logger } from '../../core/config/logger.js';
import { sendSuccess, sendUpdated } from '../../core/utils/response.js';
import type { UpdateSettingsData, UpdateNotificationSettingsData, UpdatePrivacySettingsData } from './types.js';

/**
 * Object containing all handlers for the settings module.
 * Each handler manages different aspects of user settings.
 */
export const settingsHandlers = {
  /**
   * Gets all settings for the authenticated user
   * 
   * Retrieves all user settings including general preferences, notification
   * settings, privacy settings, and other configuration options.
   * 
   * @param {Context} c - Context with authenticated user
   * @returns {Promise<Response>} JSON response with user settings
   * 
   * @example
   * // Request: GET /api/v1/settings
   * // Response: { success: true, data: { general: {...}, notifications: {...}, ... } }
   */
  async getSettings(c: Context) {
    // Get authenticated user
    const user = c.get('user');
    
    try {
      // Get all settings from service
      const settings = await settingsService.getSettings(user.id);
      
      // Log success
      logger.info({ userId: user.id }, 'Settings retrieved');

      // Return settings
      return sendSuccess(c, settings);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id }, 'Failed to get settings');
      throw error;
    }
  },

  /**
   * Updates general settings for the authenticated user
   * 
   * Allows updating general application settings such as theme, language,
   * units (metric/imperial), date format, timezone, etc.
   * 
   * @param {Context} c - Context with authenticated user and validated data
   * @returns {Promise<Response>} JSON response with updated settings
   * 
   * @example
   * // Request: PUT /api/v1/settings
   * // Body: { theme: "dark", language: "en", units: "metric" }
   * // Response: { success: true, data: { ...updatedSettings } }
   */
  async updateSettings(c: Context) {
    // Get authenticated user and validated update data
    const user = c.get('user');
    const data = c.get('validated') as UpdateSettingsData;
    
    try {
      // Update settings in service
      const settings = await settingsService.updateSettings(user.id, data);
      
      // Log success
      logger.info({ userId: user.id }, 'Settings updated');

      // Return updated settings
      return sendUpdated(c, settings);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id }, 'Failed to update settings');
      throw error;
    }
  },

  /**
   * Gets notification settings for the authenticated user
   * 
   * Retrieves all notification preferences such as email notifications,
   * push notifications, workout reminders, social notifications, etc.
   * 
   * @param {Context} c - Context with authenticated user
   * @returns {Promise<Response>} JSON response with notification settings
   * 
   * @example
   * // Request: GET /api/v1/settings/notifications
   * // Response: { success: true, data: { email: true, push: false, reminders: {...}, ... } }
   */
  async getNotificationSettings(c: Context) {
    // Get authenticated user
    const user = c.get('user');
    
    try {
      // Get notification settings from service
      const settings = await settingsService.getNotificationSettings(user.id);
      
      // Log success
      logger.info({ userId: user.id }, 'Notification settings retrieved');

      // Return notification settings
      return sendSuccess(c, settings);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id }, 'Failed to get notification settings');
      throw error;
    }
  },

  /**
   * Updates notification settings for the authenticated user
   * 
   * Allows updating notification preferences such as enabling/disabling
   * specific types of notifications, setting notification frequencies,
   * quiet hours, etc.
   * 
   * @param {Context} c - Context with authenticated user and validated data
   * @returns {Promise<Response>} JSON response with updated notification settings
   * 
   * @example
   * // Request: PUT /api/v1/settings/notifications
   * // Body: { email: true, push: false, workout_reminders: true }
   * // Response: { success: true, data: { ...updatedNotificationSettings } }
   */
  async updateNotificationSettings(c: Context) {
    // Get authenticated user and validated update data
    const user = c.get('user');
    const data = c.get('validated') as UpdateNotificationSettingsData;
    
    try {
      // Update notification settings in service
      const settings = await settingsService.updateNotificationSettings(user.id, data);
      
      // Log success
      logger.info({ userId: user.id }, 'Notification settings updated');

      // Return updated notification settings
      return sendUpdated(c, settings);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id }, 'Failed to update notification settings');
      throw error;
    }
  },

  /**
   * Gets privacy settings for the authenticated user
   * 
   * Retrieves privacy configuration such as profile visibility, activity
   * sharing preferences, data sharing options, etc.
   * 
   * @param {Context} c - Context with authenticated user
   * @returns {Promise<Response>} JSON response with privacy settings
   * 
   * @example
   * // Request: GET /api/v1/settings/privacy
   * // Response: { success: true, data: { profile_visibility: "public", ... } }
   */
  async getPrivacySettings(c: Context) {
    // Get authenticated user
    const user = c.get('user');
    
    try {
      // Get privacy settings from service
      const settings = await settingsService.getPrivacySettings(user.id);
      
      // Log success
      logger.info({ userId: user.id }, 'Privacy settings retrieved');

      // Return privacy settings
      return sendSuccess(c, settings);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id }, 'Failed to get privacy settings');
      throw error;
    }
  },

  /**
   * Updates privacy settings for the authenticated user
   * 
   * Allows updating privacy preferences such as profile visibility,
   * who can see workouts, activity feed visibility, searchability, etc.
   * 
   * @param {Context} c - Context with authenticated user and validated data
   * @returns {Promise<Response>} JSON response with updated privacy settings
   * 
   * @example
   * // Request: PUT /api/v1/settings/privacy
   * // Body: { profile_visibility: "friends", workout_sharing: false }
   * // Response: { success: true, data: { ...updatedPrivacySettings } }
   */
  async updatePrivacySettings(c: Context) {
    // Get authenticated user and validated update data
    const user = c.get('user');
    const data = c.get('validated') as UpdatePrivacySettingsData;
    
    try {
      // Update privacy settings in service
      const settings = await settingsService.updatePrivacySettings(user.id, data);
      
      // Log success
      logger.info({ userId: user.id }, 'Privacy settings updated');

      // Return updated privacy settings
      return sendUpdated(c, settings);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id }, 'Failed to update privacy settings');
      throw error;
    }
  },
};

