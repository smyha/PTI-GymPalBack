/**
 * Settings Routes Module
 * 
 * This module defines all user settings and preferences routes:
 * - General settings
 * - Notification preferences
 * - Privacy settings
 * - User preferences
 * - Fitness settings
 * - Social settings
 * - Data export/import
 * - Account management
 * - Activity log
 * 
 * All routes require authentication and allow users to customize
 * their application experience and manage their account.
 */

import { Hono } from 'hono';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { settingsSchemas } from './schemas.js';
import { settingsHandlers } from './handlers.js';
import { SETTINGS_ROUTES } from '../../core/routes.js';

// Hono router instance for settings routes
const settingsRoutes = new Hono();

// Apply authentication to all routes
settingsRoutes.use('*', auth);

/**
 * @openapi
 * /api/v1/settings:
 *   get:
 *     tags: [Settings]
 *     summary: Get user settings
 *     description: Retrieve all settings for authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SettingsResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags: [Settings]
 *     summary: Update user settings
 *     description: Update general settings for authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSettingsRequest'
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SettingsResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Handler: Get all user settings
 * 
 * Endpoint: GET /api/v1/settings
 * 
 * Process:
 * 1. Validates authentication
 * 2. Retrieves all settings categories for authenticated user
 * 3. Returns comprehensive settings object
 * 
 * Includes all setting categories:
 * - General settings
 * - Notification preferences
 * - Privacy settings
 * - User preferences
 * - Fitness settings
 * - Social settings
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Settings retrieved successfully
 * - 401: User not authenticated
 * - 500: Internal server error
 */
settingsRoutes.get(SETTINGS_ROUTES.GET, settingsHandlers.getSettings);

/**
 * Handler: Update general user settings
 * 
 * Endpoint: PUT /api/v1/settings
 * 
 * Process:
 * 1. Validates authentication and request body
 * 2. Updates general settings fields (allows partial updates)
 * 3. Returns updated settings
 * 
 * Updatable fields:
 * - Language preferences
 * - Timezone
 * - Theme preferences
 * - Display settings
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Settings updated successfully
 * - 400: Validation error in provided data
 * - 401: User not authenticated
 * - 500: Internal server error
 */
settingsRoutes.put(SETTINGS_ROUTES.UPDATE, validate(settingsSchemas.update, 'body'), settingsHandlers.updateSettings);

/**
 * @openapi
 * /api/v1/settings/notifications:
 *   get:
 *     tags: [Settings]
 *     summary: Get notification settings
 *     description: Retrieve notification preferences
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       $ref: '#/components/schemas/NotificationSettings'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags: [Settings]
 *     summary: Update notification settings
 *     description: Update notification preferences
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationSettings'
 *     responses:
 *       200:
 *         description: Notification settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       $ref: '#/components/schemas/NotificationSettings'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Handler: Get notification settings
 * 
 * Endpoint: GET /api/v1/settings/notifications
 * 
 * Process:
 * 1. Validates authentication
 * 2. Retrieves notification preferences for authenticated user
 * 3. Returns notification settings
 * 
 * Notification settings include:
 * - Email notifications (enabled/disabled, frequency)
 * - Push notifications (enabled/disabled)
 * - In-app notifications (enabled/disabled)
 * - Notification types (workout reminders, achievements, social, etc.)
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Notification settings retrieved successfully
 * - 401: User not authenticated
 * - 500: Internal server error
 */
settingsRoutes.get(SETTINGS_ROUTES.NOTIFICATIONS, settingsHandlers.getNotificationSettings);

/**
 * Handler: Update notification settings
 * 
 * Endpoint: PUT /api/v1/settings/notifications
 * 
 * Process:
 * 1. Validates authentication and request body
 * 2. Updates notification preferences
 * 3. Returns updated notification settings
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Notification settings updated successfully
 * - 400: Validation error in provided data
 * - 401: User not authenticated
 * - 500: Internal server error
 */
settingsRoutes.put(SETTINGS_ROUTES.UPDATE_NOTIFICATIONS, validate(settingsSchemas.updateNotifications, 'body'), settingsHandlers.updateNotificationSettings);

/**
 * @openapi
 * /api/v1/settings/privacy:
 *   get:
 *     tags: [Settings]
 *     summary: Get privacy settings
 *     description: Retrieve privacy settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Privacy settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     privacy:
 *                       $ref: '#/components/schemas/PrivacySettings'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags: [Settings]
 *     summary: Update privacy settings
 *     description: Update privacy settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PrivacySettings'
 *     responses:
 *       200:
 *         description: Privacy settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     privacy:
 *                       $ref: '#/components/schemas/PrivacySettings'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Handler: Get privacy settings
 * 
 * Endpoint: GET /api/v1/settings/privacy
 * 
 * Process:
 * 1. Validates authentication
 * 2. Retrieves privacy settings for authenticated user
 * 3. Returns privacy configuration
 * 
 * Privacy settings include:
 * - Profile visibility (public, friends only, private)
 * - Statistics visibility
 * - Workout history visibility
 * - Social activity visibility
 * - Search visibility
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Privacy settings retrieved successfully
 * - 401: User not authenticated
 * - 500: Internal server error
 */
settingsRoutes.get(SETTINGS_ROUTES.PRIVACY, settingsHandlers.getPrivacySettings);

/**
 * Handler: Update privacy settings
 * 
 * Endpoint: PUT /api/v1/settings/privacy
 * 
 * Process:
 * 1. Validates authentication and request body
 * 2. Updates privacy preferences
 * 3. Returns updated privacy settings
 * 
 * Privacy controls:
 * - Who can view profile
 * - Who can see statistics
 * - Who can see workout history
 * - Who can see social posts
 * - Whether user appears in search results
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Privacy settings updated successfully
 * - 400: Validation error in provided data
 * - 401: User not authenticated
 * - 500: Internal server error
 */
settingsRoutes.put(SETTINGS_ROUTES.UPDATE_PRIVACY, validate(settingsSchemas.updatePrivacy, 'body'), settingsHandlers.updatePrivacySettings);

export default settingsRoutes;

