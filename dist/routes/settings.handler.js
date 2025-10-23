import { Hono } from 'hono';
import { validationMiddleware } from '../shared/middleware/validation.middleware.js';
import { authMiddleware } from '../shared/middleware/auth.middleware.js';
import * as SettingsService from '../services/settings.service.js';
import { SettingsSchemas } from '../doc/schemas.js';
import { sendError } from '../shared/utils/response.js';
import '../shared/types/hono.types.js';
const settingsHandler = new Hono();
// GET /api/v1/settings
settingsHandler.get('/', authMiddleware, async (c) => {
    try {
        const result = await SettingsService.getUserSettings(c);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get user settings', 500, error.message);
    }
});
// PUT /api/v1/settings
settingsHandler.put('/', authMiddleware, validationMiddleware({ body: SettingsSchemas.updateSettingsBody }), async (c) => {
    try {
        const body = c.get('validatedBody');
        const result = await SettingsService.updateUserSettings(c, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to update user settings', 500, error.message);
    }
});
// GET /api/v1/settings/notifications
settingsHandler.get('/notifications', authMiddleware, async (c) => {
    try {
        const result = await SettingsService.getNotificationSettings(c);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get notification settings', 500, error.message);
    }
});
// PUT /api/v1/settings/notifications
settingsHandler.put('/notifications', authMiddleware, validationMiddleware({ body: SettingsSchemas.updateNotificationSettingsBody }), async (c) => {
    try {
        const body = c.get('validatedBody');
        const result = await SettingsService.updateNotificationSettings(c, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to update notification settings', 500, error.message);
    }
});
// GET /api/v1/settings/privacy
settingsHandler.get('/privacy', authMiddleware, async (c) => {
    try {
        const result = await SettingsService.getPrivacySettings(c);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get privacy settings', 500, error.message);
    }
});
// PUT /api/v1/settings/privacy
settingsHandler.put('/privacy', authMiddleware, validationMiddleware({ body: SettingsSchemas.updatePrivacySettingsBody }), async (c) => {
    try {
        const body = c.get('validatedBody');
        const result = await SettingsService.updatePrivacySettings(c, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to update privacy settings', 500, error.message);
    }
});
// GET /api/v1/settings/preferences
settingsHandler.get('/preferences', authMiddleware, async (c) => {
    try {
        const result = await SettingsService.getUserPreferences(c);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get user preferences', 500, error.message);
    }
});
// PUT /api/v1/settings/preferences
settingsHandler.put('/preferences', authMiddleware, validationMiddleware({ body: SettingsSchemas.updateUserPreferencesBody }), async (c) => {
    try {
        const body = c.get('validatedBody');
        const result = await SettingsService.updateUserPreferences(c, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to update user preferences', 500, error.message);
    }
});
// GET /api/v1/settings/fitness
settingsHandler.get('/fitness', authMiddleware, async (c) => {
    try {
        const result = await SettingsService.getFitnessSettings(c);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get fitness settings', 500, error.message);
    }
});
// PUT /api/v1/settings/fitness
settingsHandler.put('/fitness', authMiddleware, validationMiddleware({ body: SettingsSchemas.updateFitnessSettingsBody }), async (c) => {
    try {
        const body = c.get('validatedBody');
        const result = await SettingsService.updateFitnessSettings(c, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to update fitness settings', 500, error.message);
    }
});
// GET /api/v1/settings/social
settingsHandler.get('/social', authMiddleware, async (c) => {
    try {
        const result = await SettingsService.getSocialSettings(c);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get social settings', 500, error.message);
    }
});
// PUT /api/v1/settings/social
settingsHandler.put('/social', authMiddleware, validationMiddleware({ body: SettingsSchemas.updateSocialSettingsBody }), async (c) => {
    try {
        const body = c.get('validatedBody');
        const result = await SettingsService.updateSocialSettings(c, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to update social settings', 500, error.message);
    }
});
// POST /api/v1/settings/export-data
settingsHandler.post('/export-data', authMiddleware, validationMiddleware({ body: SettingsSchemas.exportUserDataBody }), async (c) => {
    try {
        const body = c.get('validatedBody');
        const result = await SettingsService.exportUserData(c, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to export user data', 500, error.message);
    }
});
// POST /api/v1/settings/import-data
settingsHandler.post('/import-data', authMiddleware, validationMiddleware({ body: SettingsSchemas.importUserDataBody }), async (c) => {
    try {
        const body = c.get('validatedBody');
        const result = await SettingsService.importUserData(c, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to import user data', 500, error.message);
    }
});
// DELETE /api/v1/settings/account
settingsHandler.delete('/account', authMiddleware, validationMiddleware({ body: SettingsSchemas.deleteUserAccountBody }), async (c) => {
    try {
        const body = c.get('validatedBody');
        const result = await SettingsService.deleteUserAccount(c, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to delete user account', 500, error.message);
    }
});
// GET /api/v1/settings/activity-log
settingsHandler.get('/activity-log', authMiddleware, validationMiddleware({ query: SettingsSchemas.activityLogQuery }), async (c) => {
    try {
        const query = c.get('validatedQuery');
        const result = await SettingsService.getActivityLog(c, query);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to get activity log', 500, error.message);
    }
});
// POST /api/v1/settings/change-email
settingsHandler.post('/change-email', authMiddleware, validationMiddleware({ body: SettingsSchemas.changeEmailBody }), async (c) => {
    try {
        const body = c.get('validatedBody');
        const result = await SettingsService.changeEmail(c, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to change email', 500, error.message);
    }
});
// POST /api/v1/settings/verify-email-change
settingsHandler.post('/verify-email-change', authMiddleware, validationMiddleware({ body: SettingsSchemas.verifyEmailChangeBody }), async (c) => {
    try {
        const body = c.get('validatedBody');
        const result = await SettingsService.verifyEmailChange(c, body);
        return result;
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', 'Failed to verify email change', 500, error.message);
    }
});
export default settingsHandler;
