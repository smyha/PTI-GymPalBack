import { z } from 'zod';
import { authSchemas } from './schemas.js';

export type RegisterData = z.infer<typeof authSchemas.register>;
export type LoginData = z.infer<typeof authSchemas.login>;
export type RefreshData = z.infer<typeof authSchemas.refresh>;
export type ResetPasswordData = z.infer<typeof authSchemas.resetPassword>;
export type ChangePasswordData = z.infer<typeof authSchemas.changePassword>;

export interface User {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  [key: string]: any;
}

export interface AuthResponse {
  user: User;
  token?: string;
  expiresIn?: string;
  tokenType?: string;
  message?: string;
  emailConfirmationRequired?: boolean;
}

