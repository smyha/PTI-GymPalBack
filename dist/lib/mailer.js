import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
// Create email transporter
const createTransporter = () => {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
        console.warn('⚠️  Email configuration incomplete. Email functionality will be disabled.');
        return null;
    }
    return nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: parseInt((env.SMTP_PORT || '587')),
        secure: false, // true for 465, false for other ports
        auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
        },
    });
};
export const transporter = createTransporter();
// Email sending function
export const sendEmail = async (options) => {
    if (!transporter) {
        throw new Error('Email transporter not configured');
    }
    try {
        const info = await transporter.sendMail({
            from: env.SMTP_USER,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        });
        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    }
    catch (error) {
        console.error('❌ Failed to send email:', error);
        throw new Error('Failed to send email');
    }
};
// Email templates (imported from templates directory)
export { welcomeTemplate, passwordResetTemplate, workoutReminderTemplate } from './mail-templates/index.js';
// Legacy export for backwards compatibility
export const emailTemplates = {
    welcome: (name) => import('./mail-templates/welcome.js').then(m => m.welcomeTemplate(name)),
    passwordReset: (resetLink) => import('./mail-templates/password-reset.js').then(m => m.passwordResetTemplate(resetLink)),
    workoutReminder: (workoutName, scheduledTime) => import('./mail-templates/workout-reminder.js').then(m => m.workoutReminderTemplate(workoutName, scheduledTime))
};
