import { z } from 'zod';
import { settingsSchemas } from './schemas.js';

export type UpdateSettingsData = z.infer<typeof settingsSchemas.update>;
export type UpdateNotificationSettingsData = z.infer<typeof settingsSchemas.updateNotifications>;
export type UpdatePrivacySettingsData = z.infer<typeof settingsSchemas.updatePrivacy>;

