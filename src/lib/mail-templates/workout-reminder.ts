/**
 * Workout reminder email template
 */
export const workoutReminderTemplate = (workoutName: string, scheduledTime: string) => ({
  subject: 'Workout Reminder',
  html: `
    <h1>Workout Reminder</h1>
    <p>Don't forget about your scheduled workout:</p>
    <h2>${workoutName}</h2>
    <p>Scheduled for: ${scheduledTime}</p>
    <p>Stay consistent and reach your goals!</p>
    <p>Best regards,<br>The GymPal Team</p>
  `,
  text: `Workout Reminder: ${workoutName} scheduled for ${scheduledTime}`
});
