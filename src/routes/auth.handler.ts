import { Hono } from 'hono';
import { authMiddleware } from '../shared/middleware/auth.middleware.js';
import { validationMiddleware } from '../shared/middleware/validation.middleware.js';
import '../shared/types/hono.types.js';
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  changePasswordSchema
} from '../doc/schemas.js';
import type {
  RegisterUserDTO,
  LoginUserDTO
} from '../lib/auth.js';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  resetPassword,
  updatePassword,
  deleteAccount
} from '../services/auth.service.js';
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendDeleted,
} from '../shared/utils/response.js';
import { API_MESSAGES, ERROR_CODES } from '../shared/constants/index.js';
import { authLogger, logError } from '../lib/logger.js';

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
auth.post('/register', validationMiddleware({ body: registerSchema }), async (c) => {
  try {
    const data = await registerUser(c.get('validatedBody') as RegisterUserDTO);
    return sendCreated(c, data, data.message || API_MESSAGES.CREATED);
  } catch (error: unknown) {
    interface AppError extends Error {
      code?: string;
      statusCode?: number;
    }
    const appError = error as AppError;
    authLogger.error({ error: appError.message, code: appError.code }, 'Registration error');
    if (error instanceof Error) {
      logError(error, { endpoint: '/register', method: 'POST' });
    }
    return sendError(c, appError.code || ERROR_CODES.INTERNAL_ERROR, appError.message || 'Registration failed', appError.statusCode || 500);
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
auth.post('/login', validationMiddleware({ body: loginSchema }), async (c) => {
  try {
    const response = await loginUser(c.get('validatedBody') as LoginUserDTO);
    return sendSuccess(c, response, response.message || API_MESSAGES.SUCCESS);
  } catch (error: unknown) {
    interface AppError extends Error {
      code?: string;
      statusCode?: number;
    }
    const appError = error as AppError;
    authLogger.error({ error: appError.message, code: appError.code }, 'Login error');
    if (error instanceof Error) {
      logError(error, { endpoint: '/login', method: 'POST' });
    }
    return sendError(c, appError.code || ERROR_CODES.UNAUTHORIZED, appError.message || 'Login failed', appError.statusCode || 401);
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
    
    // If user is not authenticated, return an error
    if (!user) {
      return sendError(c, ERROR_CODES.UNAUTHORIZED, 'User not authenticated', 401);
    }

    // If user is authenticated, return the user
    return sendSuccess(c, user, API_MESSAGES.SUCCESS);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Me request failed';
    authLogger.error({ error: errorMessage }, 'Me request failed');
    if (error instanceof Error) {
      logError(error, { endpoint: '/me', method: 'GET' });
    }

    interface AppError extends Error {
      code?: string;
      statusCode?: number;
    }

    const appError = error as AppError;
    return sendError(
      c,
      appError.code || ERROR_CODES.UNAUTHORIZED,
      appError.message || 'Failed to get user info',
      appError.statusCode || 401
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
auth.post('/logout', authMiddleware, async (c) => {
  try {
    await logoutUser();
    return sendSuccess(c, null, 'Logged out successfully');
  } catch (error: any) {
    authLogger.error({ error: error.message }, 'Logout error');
    logError(error as Error, { endpoint: '/logout', method: 'POST' });
    return sendError(c, error.code || ERROR_CODES.INTERNAL_ERROR, error.message || 'Logout failed', error.statusCode || 500);
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
auth.post('/refresh', async (c) => {
  try {
    const body = await c.req.json();
    const refresh_token = body.refresh_token || body.refreshToken;
    if (!refresh_token) return sendError(c, ERROR_CODES.VALIDATION_ERROR, 'Refresh token is required', 400);

    const response = await refreshToken(refresh_token);
    return sendSuccess(c, response, response.message || 'Token refreshed successfully');
  } catch (error: any) {
    authLogger.error({ error: error.message }, 'Refresh token request failed');
    logError(error as Error, { endpoint: '/refresh', method: 'POST' });
    return sendError(c, error.code || ERROR_CODES.UNAUTHORIZED, error.message || 'Token refresh failed', error.statusCode || 401);
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
auth.post('/reset-password', validationMiddleware({ body: resetPasswordSchema }), async (c) => {
  try {
    const body = c.get('validatedBody') as { token: string; new_password: string };
    await resetPassword(body.token, body.new_password);
    return sendSuccess(c, null, 'Password reset successfully');
  } catch (error: unknown) {
    interface AppError extends Error {
      code?: string;
      statusCode?: number;
    }
    const appError = error as AppError;
    authLogger.error({ error: appError.message }, 'Password reset request failed');
    if (error instanceof Error) {
      logError(error, { endpoint: '/reset-password', method: 'POST' });
    }
    return sendError(c, appError.code || ERROR_CODES.BAD_REQUEST, appError.message || 'Password reset failed', appError.statusCode || 400);
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
auth.put('/change-password/:id', authMiddleware, validationMiddleware({ body: changePasswordSchema }), async (c) => {
  try {
    const userId = c.get('userId');
    const requestedUserId = c.req.param('id');

    // Ensure user can only change their own password
    if (userId !== requestedUserId) {
      return sendError(c, ERROR_CODES.FORBIDDEN, 'You can only change your own password', 403);
    }

    const body = c.get('validatedBody') as { currentPassword: string; newPassword: string };

    // Validate current password and update to new password
    await updatePassword(body.currentPassword, body.newPassword);
    // On success, return the success message
    return sendSuccess(c, null, 'Password changed successfully');
  } catch (error: unknown) {
    interface AppError extends Error {
      code?: string;
      statusCode?: number;
    }
    const appError = error as AppError;
    authLogger.error({ error: appError.message }, 'Password change request failed');
    if (error instanceof Error) {
      logError(error, { endpoint: '/change-password', method: 'PUT' });
    }
    return sendError(c, appError.code || ERROR_CODES.BAD_REQUEST, appError.message || 'Password change failed', appError.statusCode || 400);
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
auth.delete('/delete-account/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const requestedUserId = c.req.param('id');
    if (userId !== requestedUserId) return sendError(c, ERROR_CODES.FORBIDDEN, 'You can only delete your own account', 403);

    await deleteAccount(userId);
    return sendDeleted(c, 'Account deleted successfully');
  } catch (error: any) {
    authLogger.error({ error: error.message }, 'Account deletion request failed');
    logError(error as Error, { endpoint: '/delete-account', method: 'DELETE' });
    return sendError(c, error.code || ERROR_CODES.INTERNAL_ERROR, error.message || 'Account deletion failed', error.statusCode || 500);
  }
});

export default auth;
