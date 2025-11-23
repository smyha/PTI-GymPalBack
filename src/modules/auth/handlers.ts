/**
 * @fileoverview Handlers for the authentication module
 * 
 * This file contains all HTTP request handlers related to user authentication
 * and account management. Handlers manage user registration, login, logout,
 * token refresh, password reset, and account operations.
 * 
 * @module modules/auth/handlers
 */

import { Context } from 'hono';
import { authService } from './service.js';
import { authLogger } from '../../core/config/logger.js';
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendDeleted,
} from '../../core/utils/response.js';
import { API_MESSAGES, ERROR_CODES } from '../../core/constants/api.js';
import { ErrorCode } from '../../core/utils/error-types.js';
import type { RegisterData, LoginData } from './types.js';
import { getUserFromCtx } from '../../core/utils/context.js';

/**
 * Object containing all handlers for the authentication module.
 * Each handler manages a specific authentication or account operation.
 */
export const authHandlers = {
  /**
   * Registers a new user account
   * 
   * Creates a new user account with email verification. The handler validates
   * registration data, creates the user in Supabase Auth, and sets up their
   * initial profile. Returns authentication tokens upon successful registration.
   * 
   * @param {Context} c - Context with validated registration data
   * @returns {Promise<Response>} JSON response with user data and auth tokens (status 201)
   * 
   * @example
   * // Request: POST /api/v1/auth/register
   * // Body: { email: "user@example.com", password: "...", username: "...", ... }
   * // Response: { success: true, data: { user: {...}, token: "...", ... } }
   */
  async register(c: Context) {
    try {
      // Get validated registration data from request body
      const data = c.get('validated') as RegisterData;
      
      // Register user in auth service
      const result = await authService.register(data);
      
      // Log successful registration
      authLogger.info({ email: data.email }, 'User registered successfully');

      // Return created user with auth tokens
      return sendCreated(c, result, API_MESSAGES.CREATED);
    } catch (error: any) {
      // Log registration error
      authLogger.error({ error: error.message, code: error.code }, 'Registration error');
      
      // Return formatted error response
      return sendError(
        c,
        error.code || ERROR_CODES.INTERNAL_ERROR,
        error.message || 'Registration failed',
        error.statusCode || 500
      );
    }
  },

  /**
   * Authenticates a user and returns access tokens
   * 
   * Validates user credentials (email and password) and returns authentication
   * tokens if credentials are valid. Verifies that the user's email has been
   * confirmed before allowing login.
   * 
   * @param {Context} c - Context with validated login credentials
   * @returns {Promise<Response>} JSON response with user data and auth tokens
   * 
   * @example
   * // Request: POST /api/v1/auth/login
   * // Body: { email: "user@example.com", password: "..." }
   * // Response: { success: true, data: { user: {...}, token: "...", ... } }
   */
  async login(c: Context) {
    try {
      // Get validated login credentials
      const data = c.get('validated') as LoginData;
      
      // Authenticate user in auth service
      const result = await authService.login(data);
      
      // Log successful login
      authLogger.info({ email: data.email }, 'User logged in successfully');

      // Return user data with auth tokens
      return sendSuccess(c, result, API_MESSAGES.SUCCESS);
    } catch (error: any) {
      // Log login error
      authLogger.error({ error: error.message, code: error.code }, 'Login error');
      
      // Return formatted error response
      return sendError(
        c,
        error.code || ERROR_CODES.UNAUTHORIZED,
        error.message || 'Login failed',
        error.statusCode || 401
      );
    }
  },

  /**
   * Gets the current authenticated user's information
   * 
   * Retrieves the profile and details of the currently authenticated user
   * based on the JWT token in the request headers. Used for "who am I" requests.
   * 
   * @param {Context} c - Context with authenticated user from middleware
   * @returns {Promise<Response>} JSON response with current user data
   * 
   * @example
   * // Request: GET /api/v1/auth/me
   * // Headers: { Authorization: "Bearer <token>" }
   * // Response: { success: true, data: { id, email, username, ... } }
   */
  async getMe(c: Context) {
    try {
      // Get authenticated user from context (added by auth middleware)
      const user = getUserFromCtx(c);
      
      // Get user details from auth service
      const result = await authService.getMe(user.id);
      
      // Return user information
      return sendSuccess(c, result);
    } catch (error: any) {
      // Log error
      authLogger.error({ error: error.message }, 'Failed to get current user');
      
      // Return formatted error response
      return sendError(
        c,
        error.code || ERROR_CODES.UNAUTHORIZED,
        error.message || 'Failed to get user information',
        error.statusCode || 401
      );
    }
  },

  /**
   * Logs out the current authenticated user
   * 
   * Invalidates the user's current session and refresh tokens. After logout,
   * the tokens can no longer be used for authentication.
   * 
   * @param {Context} c - Context with authenticated user
   * @returns {Promise<Response>} Success response confirming logout
   * 
   * @example
   * // Request: POST /api/v1/auth/logout
   * // Response: { success: true, message: "Logged out successfully" }
   */
  async logout(c: Context) {
    try {
      // Logout user from auth service
      await authService.logout();
      
      // Log successful logout
      authLogger.info('User logged out successfully');
      
      // Return success response
      return sendSuccess(c, { message: 'Logged out successfully' });
    } catch (error: any) {
      // Log logout error
      authLogger.error({ error: error.message }, 'Logout error');
      
      // Return formatted error response
      return sendError(
        c,
        error.code || ERROR_CODES.INTERNAL_ERROR,
        error.message || 'Logout failed',
        error.statusCode || 500
      );
    }
  },

  /**
   * Refreshes an access token using a refresh token
   * 
   * Generates a new access token using a valid refresh token. This allows
   * users to continue their session without re-authenticating. Both tokens
   * are returned in the response.
   * 
   * @param {Context} c - Context with refresh token in request body
   * @returns {Promise<Response>} JSON response with new access and refresh tokens
   * 
   * @example
   * // Request: POST /api/v1/auth/refresh
   * // Body: { refresh_token: "..." }
   * // Response: { success: true, data: { token: "...", refresh_token: "...", ... } }
   */
  async refresh(c: Context) {
    try {
      // Get validated refresh token from middleware
      const { refresh_token: refreshToken } = (c.get('validated') as { refresh_token: string }) || { refresh_token: null };

      if (!refreshToken) {
        return sendError(c, ERROR_CODES.VALIDATION_ERROR, 'Refresh token is required', 400);
      }

      // Refresh tokens in auth service
      let result;
      try {
        result = await authService.refreshToken(refreshToken);
      } catch (err: any) {
        // If token expired/invalid, log less aggressively and return 401
        if (err && err.code === ErrorCode.TOKEN_EXPIRED) {
          authLogger.warn({ error: err.message }, 'Refresh token expired or invalid');
          return sendError(c, err.code || ERROR_CODES.UNAUTHORIZED, err.message || 'Token refresh failed', 401);
        }
        throw err;
      }

      // Return new tokens
      return sendSuccess(c, result, 'Token refreshed successfully');
    } catch (error: any) {
      // Log refresh token error
      authLogger.error({ error: error.message }, 'Refresh token request failed');
      
      // Return formatted error response
      return sendError(
        c,
        error.code || ERROR_CODES.UNAUTHORIZED,
        error.message || 'Token refresh failed',
        error.statusCode || 401
      );
    }
  },

  /**
   * Resets user password using a reset token
   * 
   * Allows users to reset their password using a valid reset token received
   * via email. The token is typically sent after requesting a password reset.
   * 
   * @param {Context} c - Context with reset token and new password
   * @returns {Promise<Response>} Success response confirming password reset
   * 
   * @example
   * // Request: POST /api/v1/auth/reset-password
   * // Body: { token: "...", new_password: "..." }
   * // Response: { success: true, message: "Password reset successfully" }
   */
  async resetPassword(c: Context) {
    try {
      // Get validated reset password data
      const { token, new_password } = c.get('validated') as { token: string; new_password: string };
      
      // Reset password in auth service
      await authService.resetPassword(token, new_password);
      
      // Log successful password reset
      authLogger.info('Password reset successfully');
      
      // Return success response
      return sendSuccess(c, { message: 'Password reset successfully' });
    } catch (error: any) {
      // Log password reset error
      authLogger.error({ error: error.message }, 'Password reset failed');
      
      // Return formatted error response
      return sendError(
        c,
        error.code || ERROR_CODES.INTERNAL_ERROR,
        error.message || 'Password reset failed',
        error.statusCode || 500
      );
    }
  },

  /**
   * Changes the password for an authenticated user
   * 
   * Allows authenticated users to change their password by providing
   * their current password and a new password. Useful for security
   * and account management.
   * 
   * @param {Context} c - Context with authenticated user and password data
   * @returns {Promise<Response>} Success response confirming password change
   * 
   * @example
   * // Request: PUT /api/v1/auth/change-password/:id
   * // Body: { currentPassword: "...", newPassword: "..." }
   * // Response: { success: true, message: "Password changed successfully" }
   */
  async changePassword(c: Context) {
    // Get authenticated user and password change data
    const user = getUserFromCtx(c);
    
    try {
      const { currentPassword, newPassword } = c.get('validated') as { currentPassword: string; newPassword: string };
      
      // Change password in auth service
      await authService.changePassword(user.id, currentPassword, newPassword);
      
      // Log successful password change
      authLogger.info({ userId: user.id }, 'Password changed successfully');
      
      // Return success response
      return sendSuccess(c, { message: 'Password changed successfully' });
    } catch (error: any) {
      // Log password change error
      authLogger.error({ error: error.message, userId: user.id }, 'Password change failed');
      
      // Return formatted error response
      return sendError(
        c,
        error.code || ERROR_CODES.INTERNAL_ERROR,
        error.message || 'Password change failed',
        error.statusCode || 500
      );
    }
  },

  /**
   * Deletes a user account
   * 
   * Permanently deletes a user account and all associated data. This action
   * cannot be undone. Only the account owner can delete their own account.
   * 
   * NOTE: This endpoint no longer requires SUPABASE_SERVICE_ROLE_KEY to work.
   * The account deletion is handled by a database function (delete_own_account)
   * that uses SECURITY DEFINER to execute with elevated privileges while ensuring
   * users can only delete their own accounts.
   * 
   * The database function automatically handles cascading deletion of all related
   * data (profiles, workouts, posts, etc.) when the user is deleted from auth.users.
   * 
   * See: supabase/migrations/004_triggers.sql for the database function implementation.
   * 
   * @param {Context} c - Context with authenticated user and validated ID
   * @returns {Promise<Response>} Success response confirming account deletion
   * 
   * @example
   * // Request: DELETE /api/v1/auth/delete-account/:id
   * // Response: { success: true, message: "Account deleted successfully" }
   */
  async deleteAccount(c: Context) {
    // Get authenticated user and account ID
    const user = getUserFromCtx(c);
    
    try {
      const { id } = c.get('validated') as { id: string };
      
      // Verify user can only delete their own account
      if (user.id !== id) {
        return sendError(c, ERROR_CODES.FORBIDDEN, 'You can only delete your own account', 403);
      }
      
      // Get authenticated supabase client
      const supabase = c.get('supabase');
      
      // Delete account in auth service (pass authenticated client)
      await authService.deleteAccount(user.id, supabase);
      
      // Log account deletion
      authLogger.info({ userId: user.id }, 'Account deleted successfully');
      
      // Return success response
      return sendDeleted(c);
    } catch (error: any) {
      // Log account deletion error
      authLogger.error({ error: error.message, userId: user.id }, 'Account deletion failed');
      
      // Return formatted error response
      return sendError(
        c,
        error.code || ERROR_CODES.INTERNAL_ERROR,
        error.message || 'Account deletion failed',
        error.statusCode || 500
      );
    }
  },
};

