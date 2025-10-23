/**
 * Password reset email template
 */
export const passwordResetTemplate = (resetLink) => ({
    subject: 'Reset your GymPal password',
    html: `
    <h1>Password Reset Request</h1>
    <p>You requested to reset your password. Click the link below to reset it:</p>
    <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
    <p>If you didn't request this, please ignore this email.</p>
    <p>Best regards,<br>The GymPal Team</p>
  `,
    text: `Password Reset Request. Click here to reset: ${resetLink}`
});
