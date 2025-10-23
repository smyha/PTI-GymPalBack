import { Hono } from 'hono';
import { authMiddleware } from '../shared/middleware/auth.middleware.js';
import { validationMiddleware } from '../shared/middleware/validation.middleware.js';
import '../shared/types/hono.types.js';
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema
} from '../doc/schemas.js';
import * as authService from '../services/auth.service.js';
import * as userService from '../services/user.service.js';
import { 
  sendSuccess, 
  sendError, 
  sendCreated, 
  sendDeleted,
} from '../shared/utils/response.js';
import { API_MESSAGES, ERROR_CODES } from '../shared/constants/index.js';

const auth = new Hono();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email verification
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 */
// POST  /api/v1/auth/register
auth.post(
  '/register',
  validationMiddleware({ body: registerSchema }),
  async (c) => {
    try {
      const validatedBody = c.get('validatedBody');
      const data = await authService.registerUser(validatedBody);

      // On success, return the user data (NO TOKEN - only for email confirmation)
      return sendCreated(c, data, data.message || API_MESSAGES.CREATED);

    } catch (error: any) {
      // On error, return the error message
      console.error('Registration error:', error);
      return sendError(
        c,
        error.code || ERROR_CODES.INTERNAL_ERROR,
        error.message || 'Registration failed',
        error.statusCode || 500
      );
    }
  });

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user with email and password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// POST  /api/v1/auth/login
auth.post(
  '/login',
  validationMiddleware({ body: loginSchema }),
  async (c) => {
    try {
      const validatedBody = c.get('validatedBody');
      const response = await authService.loginUser(validatedBody);

      // On success, return the user data
      return sendSuccess(c, response, response.message || API_MESSAGES.SUCCESS);

    } catch (error: any) {
      // On error, return the error message
      console.error('Login error:', error);
      return sendError(
        c,
        error.code || ERROR_CODES.UNAUTHORIZED,
        error.message || 'Login failed',
        error.statusCode || 401
      );
    }
  });

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user
 *     description: Get the currently authenticated user information
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// GET  /api/v1/auth/me
auth.get(
  '/me',
  authMiddleware,
  async (c) => {
    try {
      const user = c.get('user');

      if (!user) {
        return sendError(c, ERROR_CODES.UNAUTHORIZED, 'User not authenticated', 401);
      }

      // On success, return the user data
      return sendSuccess(c, user, API_MESSAGES.SUCCESS);

    } catch (error: any) {
      // On error, return the error message and status code
      console.error('Me request failed:', error);
      return sendError(
        c,
        error.code || ERROR_CODES.UNAUTHORIZED,
        error.message || 'Failed to get user info',
        error.statusCode || 401
      );
    }
  });

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logout user and invalidate tokens
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// POST  /api/v1/auth/logout
auth.post(
  '/logout',
  authMiddleware,
  async (c) => {
    try {
      // Get user from middleware context
      const userId = c.get('userId');
      console.log('Logging out user:', userId);

      await authService.logoutUser();
      return sendSuccess(c, null, 'Logged out successfully');

    } catch (error: any) {
      // On error, return the error message
      console.error('Logout error:', error);
      return sendError(
        c,
        error.code || ERROR_CODES.INTERNAL_ERROR,
        error.message || 'Logout failed',
        error.statusCode || 500
      );
    }
  });

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh token
 *     description: Refresh access token using refresh token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// POST  /api/v1/auth/refresh
auth.post(
  '/refresh',
  async (c) => {
    try {
      const body = await c.req.json();
      const refresh_token = body.refresh_token || body.refreshToken;

      if (!refresh_token) {
        return sendError(c, ERROR_CODES.VALIDATION_ERROR, 'Refresh token is required', 400);
      }

      const response = await authService.refreshToken(refresh_token);

      // On success, return the new tokens
      return sendSuccess(c, response, response.message || 'Token refreshed successfully');

    } catch (error: any) {
      // On error, return the error message and status code
      console.error('Refresh token request failed:', error);
      return sendError(
        c,
        error.code || ERROR_CODES.UNAUTHORIZED,
        error.message || 'Token refresh failed',
        error.statusCode || 401
      );
    }
  });

/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Reset password using reset token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - new_password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
// POST  /api/v1/auth/reset-password
// Request password reset with token
auth.post(
  '/reset-password',
  validationMiddleware({ body: resetPasswordSchema }),
  async (c) => {
    try {
      const { token, new_password } = c.get('validatedBody');
      await authService.resetPassword(token, new_password);

      // On success, return the success message
      return sendSuccess(c, null, 'Password reset successfully');

    } catch (error: any) {
      // On error, return the error message and status code
      console.error('Password reset request failed:', error);
      return sendError(
        c,
        error.code || ERROR_CODES.BAD_REQUEST,
        error.message || 'Password reset failed',
        error.statusCode || 400
      );
    }
  });

/**
 * @openapi
 * /api/v1/auth/change-password/{id}:
 *   put:
 *     summary: Change user password
 *     description: Change password for authenticated user. Users can only change their own password.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - User can only change their own password
 */
// PUT  /api/v1/auth/change-password/:id
// Change password for authenticated user
auth.put(
  '/change-password/:id',
  authMiddleware,
  validationMiddleware({ body: changePasswordSchema }),
  async (c) => {
    try {
      const userId = c.get('userId');
      const requestedUserId = c.req.param('id');

      // Ensure user can only change their own password
      if (userId !== requestedUserId) {
        return sendError(c, ERROR_CODES.FORBIDDEN, 'You can only change your own password', 403);
      }

      const { currentPassword, newPassword } = c.get('validatedBody');

      // Validate current password and update to new password
      await authService.updatePassword(newPassword);

      // On success, return the success message
      return sendSuccess(c, null, 'Password changed successfully');

    } catch (error: any) {
      // On error, return the error message and status code
      console.error('Password change request failed:', error);
      return sendError(
        c,
        error.code || ERROR_CODES.BAD_REQUEST,
        error.message || 'Password change failed',
        error.statusCode || 400
      );
    }
  });

/**
 * @openapi
 * /api/v1/auth/delete-account/{id}:
 *   delete:
 *     summary: Delete user account
 *     description: Permanently delete user account. 
 *     Users can only delete their own account. This action is irreversible.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - User can only delete their own account
 *       500:
 *         description: Internal server error
 */
// DELETE /api/v1/auth/delete-account/:id
// Delete user account
auth.delete(
  '/delete-account/:id',
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get('userId');
      const requestedUserId = c.req.param('id');

      // Ensure user can only delete their own account
      if (userId !== requestedUserId) {
        return sendError(c, ERROR_CODES.FORBIDDEN, 'You can only delete your own account', 403);
      }

      // Delete the account using user service
      await userService.deleteAccount(c, { confirmation: 'DELETE' });

      // On success, return success message
      return sendDeleted(c, 'Account deleted successfully');

    } catch (error: any) {
      // On error, return the error message and status code
      console.error('Account deletion request failed:', error);
      return sendError(
        c,
        error.code || ERROR_CODES.INTERNAL_ERROR,
        error.message || 'Account deletion failed',
        error.statusCode || 500
      );
    }
  });

export default auth;
