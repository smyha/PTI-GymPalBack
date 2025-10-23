/**
 * Email templates
 * Central export for all email templates
 */
export { welcomeTemplate } from './welcome.js';
export { passwordResetTemplate } from './password-reset.js';
export { workoutReminderTemplate } from './workout-reminder.js';
// Export all templates as a single object for backwards compatibility
export const emailTemplates = {
    welcome: (name) => import('./welcome.js').then(m => m.welcomeTemplate(name)),
    passwordReset: (resetLink) => import('./password-reset.js').then(m => m.passwordResetTemplate(resetLink)),
    workoutReminder: (workoutName, scheduledTime) => import('./workout-reminder.js').then(m => m.workoutReminderTemplate(workoutName, scheduledTime))
};
