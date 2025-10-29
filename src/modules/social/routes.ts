/**
 * Social Routes Module
 * 
 * This module defines all social feature routes:
 * - Post creation, editing, and deletion
 * - Post likes and interactions
 * - Comments on posts
 * - User following/followers system
 * 
 * All routes require authentication and use schema validation.
 * Social features enable users to share workouts, progress, and connect.
 */

import { Hono } from 'hono';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { socialSchemas } from './schemas.js';
import { socialHandlers } from './handlers.js';
import { SOCIAL_ROUTES } from '../../core/routes.js';

// Hono router instance for social routes
const socialRoutes = new Hono();

// Apply authentication to all routes
socialRoutes.use('*', auth);

/**
 * @openapi
 * /api/v1/social/posts:
 *   get:
 *     tags: [Social]
 *     summary: List posts
 *     description: Get paginated list of social posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
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
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Post'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags: [Social]
 *     summary: Create post
 *     description: Create a new social post
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePostRequest'
 *     responses:
 *       201:
 *         description: Post created successfully
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
 *                     post:
 *                       $ref: '#/components/schemas/Post'
 *       400:
 *         description: Validation error
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
 */
/**
 * Handler: List social posts
 * 
 * Endpoint: GET /api/v1/social/posts
 * 
 * Process:
 * 1. Validates authentication and pagination parameters
 * 2. Retrieves posts from followed users and public posts
 * 3. Returns paginated feed of posts with metadata
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 10)
 * 
 * Post feed includes:
 * - Posts from users you follow
 * - Public posts from all users
 * - Post content, author, likes, comments count
 * - Timestamp and engagement metrics
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Posts retrieved successfully
 * - 401: User not authenticated
 * - 500: Internal server error
 */
socialRoutes.get(SOCIAL_ROUTES.POSTS, validate(socialSchemas.listPosts, 'query'), socialHandlers.listPosts);

/**
 * Handler: Create social post
 * 
 * Endpoint: POST /api/v1/social/posts
 * 
 * Process:
 * 1. Validates authentication and post data
 * 2. Creates a new social post for the authenticated user
 * 3. Returns the created post with metadata
 * 
 * Post data includes:
 * - Content (text, images, workout references)
 * - Visibility settings
 * - Tags and mentions
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 201: Post created successfully
 * - 400: Validation error in provided data
 * - 401: User not authenticated
 * - 500: Internal server error
 */
socialRoutes.post(SOCIAL_ROUTES.POST_CREATE, validate(socialSchemas.createPost, 'body'), socialHandlers.createPost);

/**
 * @openapi
 * /api/v1/social/posts/{id}:
 *   get:
 *     tags: [Social]
 *     summary: Get post by ID
 *     description: Get details of a specific post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post retrieved successfully
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
 *                     post:
 *                       $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags: [Social]
 *     summary: Update post
 *     description: Update an existing post (only by owner)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePostRequest'
 *     responses:
 *       200:
 *         description: Post updated successfully
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
 *                     post:
 *                       $ref: '#/components/schemas/Post'
 *       403:
 *         description: Forbidden - not the owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     tags: [Social]
 *     summary: Delete post
 *     description: Delete a post (only by owner)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Forbidden - not the owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Handler: Get post by ID
 * 
 * Endpoint: GET /api/v1/social/posts/:id
 * 
 * Process:
 * 1. Validates authentication and post ID
 * 2. Retrieves detailed post information including comments and likes
 * 3. Verifies user has access to view the post
 * 4. Returns complete post data
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Post retrieved successfully
 * - 404: Post not found or user doesn't have access
 * - 500: Internal server error
 */
socialRoutes.get(SOCIAL_ROUTES.POST_BY_ID, validate(socialSchemas.params, 'params'), socialHandlers.getPost);

/**
 * Handler: Update post
 * 
 * Endpoint: PUT /api/v1/social/posts/:id
 * 
 * Process:
 * 1. Validates authentication and post ownership
 * 2. Updates post content (only owner can update)
 * 3. Returns updated post data
 * 
 * Security:
 * - Only the post owner can update it
 * - Validates post exists and belongs to user
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Post updated successfully
 * - 400: Validation error
 * - 403: Forbidden - not the owner
 * - 404: Post not found
 * - 500: Internal server error
 */
socialRoutes.put(SOCIAL_ROUTES.POST_UPDATE, validate(socialSchemas.params, 'params'), validate(socialSchemas.updatePost, 'body'), socialHandlers.updatePost);

/**
 * Handler: Delete post
 * 
 * Endpoint: DELETE /api/v1/social/posts/:id
 * 
 * Process:
 * 1. Validates authentication and post ownership
 * 2. Deletes the post and all associated data (likes, comments)
 * 3. Confirms deletion
 * 
 * Warning: This operation cannot be undone. Deletes:
 * - Post content
 * - All likes associated with the post
 * - All comments on the post
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Post deleted successfully
 * - 403: Forbidden - not the owner
 * - 404: Post not found
 * - 500: Internal server error
 */
socialRoutes.delete(SOCIAL_ROUTES.POST_DELETE, validate(socialSchemas.params, 'params'), socialHandlers.deletePost);

/**
 * @openapi
 * /api/v1/social/posts/{id}/like:
 *   post:
 *     tags: [Social]
 *     summary: Like post
 *     description: Like a post (toggle like/unlike)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post liked/unliked successfully
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
 *                     liked:
 *                       type: boolean
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Handler: Like/unlike post
 * 
 * Endpoint: POST /api/v1/social/posts/:id/like
 * 
 * Process:
 * 1. Validates authentication and post ID
 * 2. Toggles like status (like if not liked, unlike if already liked)
 * 3. Updates post like count
 * 4. Returns current like status
 * 
 * Note: This is a toggle operation - calling it again will unlike the post
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Post liked/unliked successfully
 * - 404: Post not found
 * - 500: Internal server error
 */
socialRoutes.post(SOCIAL_ROUTES.POST_LIKE, validate(socialSchemas.params, 'params'), socialHandlers.likePost);

/**
 * @openapi
 * /api/v1/social/posts/{id}/unlike:
 *   post:
 *     tags: [Social]
 *     summary: Unlike post
 *     description: Unlike a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post unliked successfully
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
 *                     liked:
 *                       type: boolean
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Handler: Unlike post
 * 
 * Endpoint: POST /api/v1/social/posts/:id/unlike
 * 
 * Process:
 * 1. Validates authentication and post ID
 * 2. Removes like from the post
 * 3. Updates post like count
 * 4. Returns confirmation
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Post unliked successfully
 * - 404: Post not found
 * - 500: Internal server error
 */
socialRoutes.post(SOCIAL_ROUTES.POST_UNLIKE, validate(socialSchemas.params, 'params'), socialHandlers.unlikePost);

export default socialRoutes;

