import { Hono } from 'hono';
import { validationMiddleware } from '../shared/middleware/validation.middleware.js';
import { authMiddleware } from '../shared/middleware/auth.middleware.js';
import {
  getUserSettings,
  updateUserSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getPrivacySettings,
  updatePrivacySettings,
  getUserPreferences,
  updateUserPreferences,
  getFitnessSettings,
  updateFitnessSettings,
  getSocialSettings,
  updateSocialSettings,
  exportUserData,
  importUserData,
  deleteUserAccount,
  getActivityLog,
} from '../services/settings.service.js';
import { SettingsSchemas } from '../doc/schemas.js';
import { sendError } from '../shared/utils/response.js';
import '../shared/types/hono.types.js';

const settingsHandler = new Hono();

/**
 * @openapi
 * /api/v1/settings:
 *   get:
 *     summary: Get user settings
 *     description: Retrieve all settings for authenticated user
 *     tags: [Settings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
settingsHandler.get(
  '/', 
  authMiddleware,
  async (c) => {
  try {
    return await getUserSettings(c);
  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to get user settings', 500);
  }
});

/**
 * @openapi
 * /api/v1/settings:
 *   put:
 *     summary: Update user settings
 *     description: Update general settings for authenticated user
 *     tags: [Settings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSettingsRequest'
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
settingsHandler.put(
  '/',
  authMiddleware, 
  validationMiddleware({ body: SettingsSchemas.updateSettingsBody }), 
  async (c) => {
  try {
    return await updateUserSettings(c, c.get('validatedBody'));
  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to update user settings', 500);
  }
});

/**
 * @openapi
 * /api/v1/settings/notifications:
 *   get:
 *     summary: Get notification settings
 *     description: Retrieve notification preferences for authenticated user
 *     tags: [Settings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Notification settings retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
settingsHandler.get(
  '/notifications', 
  authMiddleware, 
  async (c) => {
  try {
    return await getNotificationSettings(c);
  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to get notification settings', 500);
  }
});

/**
 * @openapi
 * /api/v1/settings/notifications:
 *   put:
 *     summary: Update notification settings
 *     description: Update notification preferences for authenticated user
 *     tags: [Settings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateNotificationSettingsRequest'
 *     responses:
 *       200:
 *         description: Notification settings updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
settingsHandler.put(
  '/notifications', 
  authMiddleware, 
  validationMiddleware({ body: SettingsSchemas.updateNotificationSettingsBody }), 
  async (c) => {
  try {
    return await updateNotificationSettings(c, c.get('validatedBody'));
  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to update notification settings', 500);
  }
});

/**
 * @openapi
 * /api/v1/settings/privacy:
 *   get:
 *     summary: Get privacy settings
 *     description: Retrieve privacy settings for authenticated user
 *     tags: [Settings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Privacy settings retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
settingsHandler.get('/privacy', authMiddleware, async (c) => {
  try {
    return await getPrivacySettings(c);
  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to get privacy settings', 500);
  }
});

/**
 * @openapi
 * /api/v1/settings/privacy:
 *   put:
 *     summary: Update privacy settings
 *     description: Update privacy settings for authenticated user
 *     tags: [Settings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePrivacySettingsRequest'
 *     responses:
 *       200:
 *         description: Privacy settings updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
settingsHandler.put('/privacy', authMiddleware, validationMiddleware({ body: SettingsSchemas.updatePrivacySettingsBody }), async (c) => {
  try {
    return await updatePrivacySettings(c, c.get('validatedBody'));
  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to update privacy settings', 500);
  }
});

/**
 * @openapi
 * /api/v1/settings/preferences:
 *   get:
 *     summary: Get user preferences
 *     description: Retrieve user preferences for authenticated user
 *     tags: [Settings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: User preferences retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
settingsHandler.get('/preferences', authMiddleware, async (c) => {
  try {
    return await getUserPreferences(c);
  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to get user preferences', 500);
  }
});

/**
 * @openapi
 * /api/v1/settings/preferences:
 *   put:
 *     summary: Update user preferences
 *     description: Update user preferences for authenticated user
 *     tags: [Settings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserPreferencesRequest'
 *     responses:
 *       200:
 *         description: User preferences updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
settingsHandler.put('/preferences', authMiddleware, validationMiddleware({ body: SettingsSchemas.updateUserPreferencesBody }), async (c) => {
  try {
    return await updateUserPreferences(c, c.get('validatedBody'));
  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to update user preferences', 500);
  }
});

/**
 * @openapi
 * /api/v1/settings/fitness:
 *   get:
 *     summary: Get fitness settings
 *     description: Retrieve fitness-related settings for authenticated user
 *     tags: [Settings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Fitness settings retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
settingsHandler.get('/fitness', authMiddleware, async (c) => {
  try {
    return await getFitnessSettings(c);
  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to get fitness settings', 500);
  }
});

/**
 * @openapi
 * /api/v1/settings/fitness:
 *   put:
 *     summary: Update fitness settings
 *     description: Update fitness-related settings for authenticated user
 *     tags: [Settings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateFitnessSettingsRequest'
 *     responses:
 *       200:
 *         description: Fitness settings updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
settingsHandler.put('/fitness', authMiddleware, validationMiddleware({ body: SettingsSchemas.updateFitnessSettingsBody }), async (c) => {
  try {
    return await updateFitnessSettings(c, c.get('validatedBody'));
  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to update fitness settings', 500);
  }
});

/**
 * @openapi
 * /api/v1/settings/social:
 *   get:
 *     summary: Get social settings
 *     description: Retrieve social-related settings for authenticated user
 *     tags: [Settings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Social settings retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
settingsHandler.get('/social', authMiddleware, async (c) => {
  try {
    return await getSocialSettings(c);
  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to get social settings', 500);
  }
});

/**
 * @openapi
 * /api/v1/settings/social:
 *   put:
 *     summary: Update social settings
 *     description: Update social-related settings for authenticated user
 *     tags: [Settings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSocialSettingsRequest'
 *     responses:
 *       200:
 *         description: Social settings updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
settingsHandler.put('/social', authMiddleware, validationMiddleware({ body: SettingsSchemas.updateSocialSettingsBody }), async (c) => {
  try {
    return await updateSocialSettings(c, c.get('validatedBody'));
  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to update social settings', 500);
  }
});

/**
 * @openapi
 * /api/v1/settings/export-data:
 *   post:
 *     summary: Export user data
 *     description: Export all user data in specified format
 *     tags: [Settings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExportUserDataRequest'
 *     responses:
 *       200:
 *         description: Data exported successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
settingsHandler.post('/export-data', authMiddleware, validationMiddleware({ body: SettingsSchemas.exportUserDataBody }), async (c) => {
  try {
    return await exportUserData(c, c.get('validatedBody'));
  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to export user data', 500);
  }
});

/**
 * @openapi
 * /api/v1/settings/import-data:
 *   post:
 *     summary: Import user data
 *     description: Import user data from previously exported file
 *     tags: [Settings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ImportUserDataRequest'
 *     responses:
 *       200:
 *         description: Data imported successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
settingsHandler.post('/import-data', authMiddleware, validationMiddleware({ body: SettingsSchemas.importUserDataBody }), async (c) => {
  try {
    return await importUserData(c, c.get('validatedBody'));
  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to import user data', 500);
  }
});

/**
 * @openapi
 * /api/v1/settings/account:
 *   delete:
 *     summary: Delete user account
 *     description: Permanently delete user account and all associated data
 *     tags: [Settings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteUserAccountRequest'
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
settingsHandler.delete('/account', authMiddleware, validationMiddleware({ body: SettingsSchemas.deleteUserAccountBody }), async (c) => {
  try {
    return await deleteUserAccount(c, c.get('validatedBody'));
  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to delete user account', 500);
  }
});

/**
 * @openapi
 * /api/v1/settings/activity-log:
 *   get:
 *     summary: Get activity log
 *     description: Retrieve user activity log with pagination
 *     tags: [Settings]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *     responses:
 *       200:
 *         description: Activity log retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
settingsHandler.get('/activity-log', authMiddleware, validationMiddleware({ query: SettingsSchemas.activityLogQuery }), async (c) => {
  try {
    return await getActivityLog(c, c.get('validatedQuery'));
  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to get activity log', 500);
  }
});

export default settingsHandler;
