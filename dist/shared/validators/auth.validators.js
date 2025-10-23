import { z } from 'zod';
// ============================================================================
// AUTHENTICATION VALIDATION SCHEMAS
// ============================================================================
export const RegisterSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password too long')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username too long')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    fullName: z.string()
        .min(1, 'Full name is required')
        .max(100, 'Full name too long')
        .optional(),
    date_of_birth: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
        .optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'])
        .optional(),
    terms_accepted: z.boolean()
        .refine(val => val === true, 'Terms must be accepted'),
    privacy_policy_accepted: z.boolean()
        .refine(val => val === true, 'Privacy policy must be accepted'),
    captcha_token: z.string().optional()
});
export const LoginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
    remember_me: z.boolean().optional(),
    captcha_token: z.string().optional()
});
export const ForgotPasswordSchema = z.object({
    email: z.string().email('Invalid email format'),
    captcha_token: z.string().optional()
});
export const ResetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    new_password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password too long')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    confirm_password: z.string().min(1, 'Password confirmation is required')
}).refine(data => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"]
});
export const ChangePasswordSchema = z.object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password too long')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    confirm_password: z.string().min(1, 'Password confirmation is required')
}).refine(data => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"]
});
export const UpdateProfileSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username too long')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .optional(),
    full_name: z.string()
        .min(1, 'Full name is required')
        .max(100, 'Full name too long')
        .optional(),
    bio: z.string()
        .max(500, 'Bio too long')
        .optional(),
    avatar_url: z.string()
        .url('Invalid avatar URL')
        .optional(),
    date_of_birth: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
        .optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'])
        .optional(),
    fitness_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert'])
        .optional(),
    timezone: z.string()
        .min(1, 'Timezone is required')
        .optional(),
    language: z.string()
        .min(2, 'Language code must be at least 2 characters')
        .max(5, 'Language code too long')
        .optional()
});
export const VerifyEmailSchema = z.object({
    token: z.string().min(1, 'Verification token is required')
});
export const ResendVerificationSchema = z.object({
    email: z.string().email('Invalid email format')
});
export const DeleteAccountSchema = z.object({
    password: z.string().min(1, 'Password is required to delete account'),
    confirmation: z.string().refine(val => val === 'DELETE', 'Account deletion confirmation is required')
});
export const GetActiveSessionsSchema = z.object({
// No parameters needed for getting active sessions
});
export const RevokeSessionSchema = z.object({
    session_id: z.string().min(1, 'Session ID is required')
});
export const Enable2FASchema = z.object({
// No parameters needed for enabling 2FA
});
export const Verify2FASchema = z.object({
    code: z.string().min(6, '2FA code must be at least 6 characters').max(6, '2FA code must be exactly 6 characters')
});
export const Disable2FASchema = z.object({
    password: z.string().min(1, 'Password is required'),
    code: z.string().min(6, '2FA code must be at least 6 characters').max(6, '2FA code must be exactly 6 characters')
});
