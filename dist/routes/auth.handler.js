/**
 * Authentication Handlers Module
 * 
 * This module manages all routes related to user authentication:
 * - User registration
 * - Login and token management
 * - Password recovery and change
 * - Session management (logout, refresh token)
 * - Account deletion
 * 
 * All routes are protected as appropriate and use schema validation
 * to ensure data integrity of received data.
 */

import { Hono } from 'hono';
import { authMiddleware } from '../shared/middleware/auth.middleware.js';
import { validationMiddleware } from '../shared/middleware/validation.middleware.js';
import '../shared/types/hono.types.js';
import { registerSchema, loginSchema, resetPasswordSchema, changePasswordSchema } from '../doc/schemas.js';
import { registerUser, loginUser, logoutUser, refreshToken, resetPassword, updatePassword, deleteAccount } from '../services/auth.service.js';
import { sendSuccess, sendError, sendCreated, sendDeleted, } from '../shared/utils/response.js';
import { API_MESSAGES, ERROR_CODES } from '../shared/constants/index.js';
import { authLogger, logError } from '../lib/logger.js';

// Hono router instance for authentication routes
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
/**
 * Handler: Register new user
 * 
 * Endpoint: POST /api/v1/auth/register
 * 
 * Process:
 * 1. Validates request body against registration schema
 * 2. Calls authentication service to create the user
 * 3. Returns created user data along with access tokens
 * 
 * Responses:
 * - 201: User registered successfully
 * - 400: Validation error in provided data
 * - 409: Conflict (user already exists)
 * - 500: Internal server error
 */
auth.post('/register', validationMiddleware({ body: registerSchema }), async (c) => {
    try {
        // Gets validated data from Hono context
        const data = await registerUser(c.get('validatedBody'));
        // Returns successful creation response with 201 status code
        return sendCreated(c, data, data.message || API_MESSAGES.CREATED);
    }
    catch (error) {
        const appError = error;
        // Logs error to authentication-specific logger
        authLogger.error({ error: appError.message, code: appError.code }, 'Registration error');
        if (error instanceof Error) {
            logError(error, { endpoint: '/register', method: 'POST' });
        }
        // Returns error with appropriate code and message
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
/**
 * Handler: User login
 * 
 * Endpoint: POST /api/v1/auth/login
 * 
 * Process:
 * 1. Validates credentials (email and password) against schema
 * 2. Authenticates user and generates access and refresh tokens
 * 3. Returns tokens along with basic user information
 * 
 * Responses:
 * - 200: Login successful, tokens generated
 * - 400: Validation error
 * - 401: Invalid credentials or user not found
 * - 500: Internal server error
 */
auth.post('/login', validationMiddleware({ body: loginSchema }), async (c) => {
    try {
        // Validates and authenticates user, generating tokens
        const response = await loginUser(c.get('validatedBody'));
        return sendSuccess(c, response, response.message || API_MESSAGES.SUCCESS);
    }
    catch (error) {
        const appError = error;
        authLogger.error({ error: appError.message, code: appError.code }, 'Login error');
        if (error instanceof Error) {
            logError(error, { endpoint: '/login', method: 'POST' });
        }
        // Returns 401 error by default for invalid credentials
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
/**
 * Handler: Get authenticated user information
 * 
 * Endpoint: GET /api/v1/auth/me
 * 
 * Process:
 * 1. Authentication middleware validates token and adds user to context
 * 2. Extracts user information from context
 * 3. Returns authenticated user data
 * 
 * Requires: Valid authentication token in Authorization header
 * 
 * Responses:
 * - 200: User information retrieved successfully
 * - 401: Invalid or expired token, user not authenticated
 * - 500: Internal server error
 */
auth.get('/me', authMiddleware, async (c) => {
    try {
        // authMiddleware already validated token and added user to context
        const user = c.get('user');
        // Additional security check
        if (!user) {
            return sendError(c, ERROR_CODES.UNAUTHORIZED, 'User not authenticated', 401);
        }
        // Returns authenticated user information
        return sendSuccess(c, user, API_MESSAGES.SUCCESS);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Me request failed';
        authLogger.error({ error: errorMessage }, 'Me request failed');
        if (error instanceof Error) {
            logError(error, { endpoint: '/me', method: 'GET' });
        }
        const appError = error;
        return sendError(c, appError.code || ERROR_CODES.UNAUTHORIZED, appError.message || 'Failed to get user info', appError.statusCode || 401);
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
/**
 * Handler: User logout
 * 
 * Endpoint: POST /api/v1/auth/logout
 * 
 * Process:
 * 1. Validates user is authenticated via middleware
 * 2. Invalidates user tokens (blacklist or session deletion)
 * 3. Confirms successful logout
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Session closed successfully
 * - 401: User not authenticated
 * - 500: Internal server error
 */
auth.post('/logout', authMiddleware, async (c) => {
    try {
        // Invalidates current user tokens
        await logoutUser();
        return sendSuccess(c, null, 'Logged out successfully');
    }
    catch (error) {
        authLogger.error({ error: error.message }, 'Logout error');
        logError(error, { endpoint: '/logout', method: 'POST' });
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
/**
 * Handler: Refresh access token
 * 
 * Endpoint: POST /api/v1/auth/refresh
 * 
 * Process:
 * 1. Receives refresh token in request body
 * 2. Validates refresh token is valid and not expired
 * 3. Generates new token pair (access and refresh)
 * 4. Returns new tokens
 * 
 * Note: This endpoint does NOT require prior authentication, only a valid refresh token
 * 
 * Responses:
 * - 200: Tokens refreshed successfully
 * - 400: Refresh token not provided or invalid
 * - 401: Refresh token expired or invalid
 * - 500: Internal server error
 */
auth.post('/refresh', async (c) => {
    try {
        // Reads request body to get refresh token
        const body = await c.req.json();
        // Supports both snake_case and camelCase
        const refresh_token = body.refresh_token || body.refreshToken;
        // Validates token is present
        if (!refresh_token)
            return sendError(c, ERROR_CODES.VALIDATION_ERROR, 'Refresh token is required', 400);
        // Generates new tokens using refresh token
        const response = await refreshToken(refresh_token);
        return sendSuccess(c, response, response.message || 'Token refreshed successfully');
    }
    catch (error) {
        authLogger.error({ error: error.message }, 'Refresh token request failed');
        logError(error, { endpoint: '/refresh', method: 'POST' });
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
/**
 * Handler: Reset password using recovery token
 * 
 * Endpoint: POST /api/v1/auth/reset-password
 * 
 * Process:
 * 1. Validates recovery token and new password
 * 2. Verifies token is valid and not expired
 * 3. Updates password for user associated with token
 * 4. Invalidates recovery token to prevent reuse
 * 
 * Note: Recovery token is obtained previously via password recovery request endpoint
 * 
 * Responses:
 * - 200: Password reset successfully
 * - 400: Invalid or expired token, or password doesn't meet requirements
 * - 500: Internal server error
 */
auth.post('/reset-password', validationMiddleware({ body: resetPasswordSchema }), async (c) => {
    try {
        const body = c.get('validatedBody');
        // Resets password using recovery token
        await resetPassword(body.token, body.new_password);
        return sendSuccess(c, null, 'Password reset successfully');
    }
    catch (error) {
        const appError = error;
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
/**
 * Handler: Change authenticated user password
 * 
 * Endpoint: PUT /api/v1/auth/change-password/:id
 * 
 * Process:
 * 1. Validates user is authenticated
 * 2. Verifies user can only change their own password (authorization control)
 * 3. Validates current password and new password
 * 4. Updates password in database
 * 
 * Security:
 * - Requires prior authentication
 * - Only allows changing own password (prevents privilege escalation)
 * - Validates current password before allowing change
 * 
 * Responses:
 * - 200: Password changed successfully
 * - 400: Incorrect current password or new password doesn't meet requirements
 * - 401: User not authenticated
 * - 403: Attempt to change another user's password (forbidden)
 * - 500: Internal server error
 */
auth.put('/change-password/:id', authMiddleware, validationMiddleware({ body: changePasswordSchema }), async (c) => {
    try {
        // Gets authenticated user ID from context
        const userId = c.get('userId');
        // Gets user ID from route parameters
        const requestedUserId = c.req.param('id');
        // Authorization control: only allows changing own password
        if (userId !== requestedUserId) {
            return sendError(c, ERROR_CODES.FORBIDDEN, 'You can only change your own password', 403);
        }
        const body = c.get('validatedBody');
        // Validates current password and updates to new one
        await updatePassword(body.currentPassword, body.newPassword);
        return sendSuccess(c, null, 'Password changed successfully');
    }
    catch (error) {
        const appError = error;
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
/**
 * Handler: Delete user account
 * 
 * Endpoint: DELETE /api/v1/auth/delete-account/:id
 * 
 * Process:
 * 1. Validates user is authenticated
 * 2. Verifies user can only delete their own account
 * 3. Executes complete account deletion and all associated data
 * 4. Invalidates all user tokens
 * 
 * Warning: This operation is IRREVERSIBLE. Deletes:
 * - User profile
 * - Workout history
 * - Social posts and comments
 * - Settings and preferences
 * - All associated data
 * 
 * Security:
 * - Requires prior authentication
 * - Only allows deleting own account
 * - Additional frontend confirmation recommended
 * 
 * Responses:
 * - 200: Account deleted successfully
 * - 401: User not authenticated
 * - 403: Attempt to delete another user's account (forbidden)
 * - 500: Internal server error
 */
auth.delete('/delete-account/:id', authMiddleware, async (c) => {
    try {
        const userId = c.get('userId');
        const requestedUserId = c.req.param('id');
        // Authorization control: only allows deleting own account
        if (userId !== requestedUserId)
            return sendError(c, ERROR_CODES.FORBIDDEN, 'You can only delete your own account', 403);
        // Deletes account and all associated data
        await deleteAccount(userId);
        return sendDeleted(c, 'Account deleted successfully');
    }
    catch (error) {
        authLogger.error({ error: error.message }, 'Account deletion request failed');
        logError(error, { endpoint: '/delete-account', method: 'DELETE' });
        return sendError(c, error.code || ERROR_CODES.INTERNAL_ERROR, error.message || 'Account deletion failed', error.statusCode || 500);
    }
});

export default auth;
