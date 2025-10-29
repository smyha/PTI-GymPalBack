/**
 * Authentication Routes Module
 * 
 * This module defines all authentication-related routes:
 * - User registration and login
 * - Token management (refresh, logout)
 * - Password recovery and change
 * - Account management (delete account)
 * 
 * All routes use validation middleware and authentication middleware where appropriate.
 * Routes are protected based on their requirements (public vs authenticated).
 */

import { Hono } from 'hono';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { authSchemas } from './schemas.js';
import { authHandlers } from './handlers.js';
import { AUTH_ROUTES } from '../../core/routes.js';

// Hono router instance for authentication routes
const authRoutes = new Hono();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register new user
 *     description: Create a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             email: user@example.com
 *             password: SecurePass123!
 *             username: fitnesslover
 *             full_name: John Doe
 *             date_of_birth: "1995-06-15"
 *             gender: male
 *             terms_accepted: true
 *             privacy_policy_accepted: true
 *             bio: Fitness enthusiast and personal trainer
 *             fitness_level: beginner
 *             timezone: UTC
 *             language: en
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
authRoutes.post(
  AUTH_ROUTES.REGISTER,
  validate(authSchemas.register, 'body'),
  authHandlers.register
);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     description: Authenticate user and get access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: user@example.com
 *             password: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
authRoutes.post(
  AUTH_ROUTES.LOGIN,
  validate(authSchemas.login, 'body'),
  authHandlers.login
);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh token
 *     description: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token:
 *                 type: string
 *           example:
 *             refresh_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
authRoutes.post(
  AUTH_ROUTES.REFRESH,
  authHandlers.refresh
);

/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password
 *     description: Reset password using reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, new_password]
 *             properties:
 *               token:
 *                 type: string
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *           example:
 *             token: reset-token-here
 *             new_password: NewSecurePass123!
 *     responses:
 *       200:
 *         description: Reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid token or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
authRoutes.post(
  AUTH_ROUTES.RESET_PASSWORD,
  validate(authSchemas.resetPassword, 'body'),
  authHandlers.resetPassword
);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user
 *     description: Get current authenticated user information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
authRoutes.get(
  AUTH_ROUTES.ME,
  auth,
  authHandlers.getMe
);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: User logout
 *     description: Logout current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
authRoutes.post(
  AUTH_ROUTES.LOGOUT,
  auth,
  authHandlers.logout
);

/**
 * @openapi
 * /api/v1/auth/change-password/{id}:
 *   put:
 *     tags: [Authentication]
 *     summary: Change password
 *     description: Change user password
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
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *           example:
 *             currentPassword: OldPass123!
 *             newPassword: NewSecurePass123!
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - can only change own password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
authRoutes.put(
  AUTH_ROUTES.CHANGE_PASSWORD,
  auth,
  validate(authSchemas.params, 'params'),
  validate(authSchemas.changePassword, 'body'),
  authHandlers.changePassword
);

/**
 * @openapi
 * /api/v1/auth/delete-account/{id}:
 *   delete:
 *     tags: [Authentication]
 *     summary: Delete account
 *     description: Delete user account permanently
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
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - can only delete own account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
authRoutes.delete(
  AUTH_ROUTES.DELETE_ACCOUNT,
  auth,
  validate(authSchemas.params, 'params'),
  authHandlers.deleteAccount
);

export default authRoutes;

