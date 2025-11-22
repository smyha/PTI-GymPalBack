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
import { validateCombined } from '../../middleware/combined-validation.js';
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
// POST /api/v1/social/posts - Create post
// Supports both JSON with URLs and multipart form-data with file uploads
// For JSON: apply validation
// For multipart: validation is handled in the handler
const createPostMiddleware = async (c: any, next: any) => {
  const contentType = c.req.header('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    // Apply validation only for JSON requests
    return validate(socialSchemas.createPost, 'body')(c, next);
  }
  // For multipart, skip validation and let handler deal with it
  await next();
};

socialRoutes.post(SOCIAL_ROUTES.POST_CREATE, createPostMiddleware, socialHandlers.createPost);

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
 * Handler: Create comment on post
 *
 * Endpoint: POST /api/v1/social/posts/:id/comments
 *
 * Supports replying to comments by including parent_comment_id in body
 * Uses combined validation to merge params (post_id) and body data
 */
socialRoutes.post(
  SOCIAL_ROUTES.POST_COMMENT_CREATE,
  validateCombined(socialSchemas.createComment, ['params', 'body']),
  socialHandlers.createComment
);

/**
 * Handler: List comments for post
 * 
 * Endpoint: GET /api/v1/social/posts/:id/comments
 */
socialRoutes.get(
  SOCIAL_ROUTES.POST_COMMENTS,
  validate(socialSchemas.params, 'params'),
  socialHandlers.listComments
);

/**
 * Handler: Delete comment
 * 
 * Endpoint: DELETE /api/v1/social/posts/:id/comments/:commentId
 */
socialRoutes.delete(
  SOCIAL_ROUTES.POST_COMMENT_DELETE,
  validate(socialSchemas.params, 'params'),
  socialHandlers.deleteComment
);

/**
 * Handler: Follow user
 * 
 * Endpoint: POST /api/v1/social/users/:userId/follow
 */
socialRoutes.post(
  '/users/:userId/follow',
  socialHandlers.followUser
);

/**
 * Handler: Unfollow user
 *
 * Endpoint: POST /api/v1/social/users/:userId/unfollow
 */
socialRoutes.post(
  '/users/:userId/unfollow',
  socialHandlers.unfollowUser
);

/**
 * Handler: Repost a post (toggle repost/unrepost)
 *
 * Endpoint: POST /api/v1/social/posts/:id/repost
 */
socialRoutes.post(
  '/posts/:id/repost',
  validate(socialSchemas.params, 'params'),
  socialHandlers.repostPost
);

/**
 * Handler: Get user's reposts
 *
 * Endpoint: GET /api/v1/social/users/:userId/reposts
 */
socialRoutes.get(
  '/users/:userId/reposts',
  socialHandlers.getUserReposts
);

/**
 * Handler: Get follow stats
 *
 * Endpoint: GET /api/v1/social/users/:userId/stats
 */
socialRoutes.get(
  '/users/:userId/stats',
  socialHandlers.getFollowStats
);

/**
 * Handler: Get post count
 *
 * Endpoint: GET /api/v1/social/users/:userId/posts/count
 */
socialRoutes.get(
  '/users/:userId/posts/count',
  socialHandlers.getPostCount
);

/**
 * Handler: Chat with Reception Agent
 * 
 * Endpoint: POST /api/v1/social/chat/agent
 */
socialRoutes.post(
  '/chat/agent',
  socialHandlers.chatWithAgent
);

/**
 * Handler: Get Chat History (with support for conversationId query param)
 * 
 * Endpoint: GET /api/v1/social/chat/history
 */
socialRoutes.get(
  '/chat/history',
  socialHandlers.getChatHistory
);

/**
 * Handler: List Conversations
 * 
 * Endpoint: GET /api/v1/social/chat/conversations
 */
socialRoutes.get(
  '/chat/conversations',
  socialHandlers.listConversations
);

/**
 * Handler: Create Conversation
 * 
 * Endpoint: POST /api/v1/social/chat/conversations
 */
socialRoutes.post(
  '/chat/conversations',
  socialHandlers.createConversation
);

/**
 * Handler: Delete Conversation
 * 
 * Endpoint: DELETE /api/v1/social/chat/conversations/:id
 */
socialRoutes.delete(
  '/chat/conversations/:id',
  socialHandlers.deleteConversation
);

export default socialRoutes;

