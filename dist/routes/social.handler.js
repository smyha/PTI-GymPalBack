/**
 * Social Handlers Module
 * 
 * This module manages all social features:
 * - Post creation, editing, and deletion
 * - Post likes and interactions
 * - Comments on posts
 * - User following/followers system
 * 
 * All routes require authentication and use schema validation.
 * Social features enable users to share workouts, progress, and connect.
 */

import { Hono } from 'hono';
import { validationMiddleware } from '../shared/middleware/validation.middleware.js';
import { authMiddleware } from '../shared/middleware/auth.middleware.js';
import { listPosts, createPost, getPost, updatePost, deletePost, likePost, getPostComments, createComment, deleteComment, followUser, unfollowUser, getUserFollowers, getUserFollowing } from '../services/social.service.js';
import { SocialSchemas } from '../doc/schemas.js';
import { sendError } from '../shared/utils/response.js';
import '../shared/types/hono.types.js';

// Hono router instance for social routes
const socialHandler = new Hono();
/**
 * @openapi
 * /api/v1/social/posts:
 *   get:
 *     summary: List posts
 *     description: Get paginated list of social posts from followed users and public posts
 *     tags: [Social]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * - limit: Results per page (default: 20)
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
socialHandler.get('/posts', authMiddleware, validationMiddleware({ query: SocialSchemas.listPostsQuery }), async (c) => {
    try {
        return await listPosts(c, c.get('validatedQuery'));
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to list posts', 500);
    }
});
/**
 * @openapi
 * /api/v1/social/posts:
 *   post:
 *     summary: Create post
 *     description: Create a new social post
 *     tags: [Social]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePostRequest'
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
socialHandler.post('/posts', authMiddleware, validationMiddleware({ body: SocialSchemas.createPostBody }), async (c) => {
    try {
        return await createPost(c, c.get('validatedBody'));
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to create post', 500);
    }
});
/**
 * @openapi
 * /api/v1/social/posts/{id}:
 *   get:
 *     summary: Get post by ID
 *     description: Get details of a specific post
 *     tags: [Social]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
socialHandler.get('/posts/:id', authMiddleware, validationMiddleware({ params: SocialSchemas.getPostParams }), async (c) => {
    try {
        return await getPost(c, c.get('validatedParams').id);
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to get post', 500);
    }
});
/**
 * @openapi
 * /api/v1/social/posts/{id}:
 *   put:
 *     summary: Update post
 *     description: Update an existing post (only by owner)
 *     tags: [Social]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePostRequest'
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
socialHandler.put('/posts/:id', authMiddleware, validationMiddleware({ params: SocialSchemas.getPostParams, body: SocialSchemas.updatePostBody }), async (c) => {
    try {
        return await updatePost(c, c.get('validatedParams').id, c.get('validatedBody'));
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to update post', 500);
    }
});
/**
 * @openapi
 * /api/v1/social/posts/{id}:
 *   delete:
 *     summary: Delete post
 *     description: Delete a post (only by owner)
 *     tags: [Social]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
socialHandler.delete('/posts/:id', authMiddleware, validationMiddleware({ params: SocialSchemas.getPostParams }), async (c) => {
    try {
        return await deletePost(c, c.get('validatedParams').id);
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to delete post', 500);
    }
});
/**
 * @openapi
 * /api/v1/social/posts/{id}/like:
 *   post:
 *     summary: Like post
 *     description: Like a post (toggle like/unlike)
 *     tags: [Social]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post liked/unliked successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
socialHandler.post('/posts/:id/like', authMiddleware, validationMiddleware({ params: SocialSchemas.getPostParams }), async (c) => {
    try {
        return await likePost(c, c.get('validatedParams').id);
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to like post', 500);
    }
});
/**
 * @openapi
 * /api/v1/social/posts/{id}/comments:
 *   get:
 *     summary: List comments
 *     description: Get paginated comments for a post
 *     tags: [Social]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
socialHandler.get('/posts/:id/comments', authMiddleware, validationMiddleware({ params: SocialSchemas.getPostParams }), async (c) => {
    try {
        return await getPostComments(c, c.get('validatedParams').id);
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to list comments', 500);
    }
});
/**
 * @openapi
 * /api/v1/social/posts/{id}/comments:
 *   post:
 *     summary: Create comment
 *     description: Add a comment to a post
 *     tags: [Social]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
socialHandler.post('/posts/:id/comments', authMiddleware, validationMiddleware({ params: SocialSchemas.getPostParams }), async (c) => {
    try {
        return await createComment(c, c.get('validatedParams').id, c.get('validatedBody'));
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to create comment', 500);
    }
});
/**
 * @openapi
 * /api/v1/social/comments/{commentId}:
 *   delete:
 *     summary: Delete comment
 *     description: Delete a comment (only by owner)
 *     tags: [Social]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: commentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
socialHandler.delete('/comments/:commentId', authMiddleware, validationMiddleware({ params: SocialSchemas.deleteCommentParams }), async (c) => {
    try {
        return await deleteComment(c, c.get('validatedParams').commentId);
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to delete comment', 500);
    }
});
/**
 * @openapi
 * /api/v1/social/users/{userId}/follow:
 *   post:
 *     summary: Follow user
 *     description: Follow another user
 *     tags: [Social]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User followed successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
socialHandler.post('/users/:userId/follow', authMiddleware, validationMiddleware({ params: SocialSchemas.followUserParams }), async (c) => {
    try {
        return await followUser(c, c.get('validatedParams').userId);
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to follow user', 500);
    }
});
/**
 * @openapi
 * /api/v1/social/users/{userId}/unfollow:
 *   post:
 *     summary: Unfollow user
 *     description: Unfollow a user
 *     tags: [Social]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User unfollowed successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
socialHandler.post('/users/:userId/unfollow', authMiddleware, validationMiddleware({ params: SocialSchemas.followUserParams }), async (c) => {
    try {
        return await unfollowUser(c, c.get('validatedParams').userId);
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to unfollow user', 500);
    }
});
/**
 * @openapi
 * /api/v1/social/users/{userId}/followers:
 *   get:
 *     summary: Get user followers
 *     description: Get paginated list of users following the specified user
 *     tags: [Social]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *     responses:
 *       200:
 *         description: Followers retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
socialHandler.get('/users/:userId/followers', authMiddleware, validationMiddleware({ params: SocialSchemas.followUserParams, query: SocialSchemas.listPostsQuery }), async (c) => {
    try {
        return await getUserFollowers(c, c.get('validatedParams').userId, c.get('validatedQuery'));
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to get followers', 500);
    }
});
/**
 * @openapi
 * /api/v1/social/users/{userId}/following:
 *   get:
 *     summary: Get user following
 *     description: Get paginated list of users that the specified user is following
 *     tags: [Social]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *     responses:
 *       200:
 *         description: Following list retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
socialHandler.get('/users/:userId/following', authMiddleware, validationMiddleware({ params: SocialSchemas.followUserParams, query: SocialSchemas.listPostsQuery }), async (c) => {
    try {
        return await getUserFollowing(c, c.get('validatedParams').userId, c.get('validatedQuery'));
    }
    catch (error) {
        return sendError(c, 'INTERNAL_ERROR', error.message || 'Failed to get following', 500);
    }
});
export default socialHandler;
