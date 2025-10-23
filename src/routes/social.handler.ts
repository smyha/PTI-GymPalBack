import { Hono } from 'hono';
import { validationMiddleware } from '../shared/middleware/validation.middleware.js';
import { authMiddleware } from '../shared/middleware/auth.middleware.js';
import * as SocialService from '../services/social.service.js';
// Follow/unfollow functions are now in social.service.ts
import { SocialSchemas } from '../doc/schemas.js';
import { sendSuccess, sendError, sendNotFound, sendUnauthorized } from '../shared/utils/response.js';
import '../shared/types/hono.types.js';

const socialHandler = new Hono();

// GET /api/v1/social/posts
socialHandler.get(
  '/posts',
  authMiddleware,
  validationMiddleware({ query: SocialSchemas.listPostsQuery }),
  async (c) => {
    try {
      const query = c.get('validatedQuery');
      const result = await SocialService.listPosts(c, query);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to list posts', 500, error.message);
    }
  }
);

// POST /api/v1/social/posts
socialHandler.post(
  '/posts',
  authMiddleware,
  validationMiddleware({ body: SocialSchemas.createPostBody }),
  async (c) => {
    try {
      const body = c.get('validatedBody');
      const result = await SocialService.createPost(c, body);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to create post', 500, error.message);
    }
  }
);

// GET /api/v1/social/posts/:id
socialHandler.get(
  '/posts/:id',
  authMiddleware,
  validationMiddleware({ params: SocialSchemas.getPostParams }),
  async (c) => {
    try {
      const params = c.get('validatedParams');
      const result = await SocialService.getPost(c, params.id);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to get post', 500, error.message);
    }
  }
);

// PUT /api/v1/social/posts/:id
socialHandler.put(
  '/posts/:id',
  authMiddleware,
  validationMiddleware({ 
    params: SocialSchemas.getPostParams,
    body: SocialSchemas.updatePostBody 
  }),
  async (c) => {
    try {
      const params = c.get('validatedParams');
      const body = c.get('validatedBody');
      const result = await SocialService.updatePost(c, params.id, body);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to update post', 500, error.message);
    }
  }
);

// DELETE /api/v1/social/posts/:id
socialHandler.delete(
  '/posts/:id',
  authMiddleware,
  validationMiddleware({ params: SocialSchemas.getPostParams }),
  async (c) => {
    try {
      const params = c.get('validatedParams');
      const result = await SocialService.deletePost(c, params.id);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to delete post', 500, error.message);
    }
  }
);

// GET /api/v1/social/posts/trending
socialHandler.get(
  '/posts/trending',
  authMiddleware,
  validationMiddleware({ query: SocialSchemas.trendingPostsQuery }),
  async (c) => {
    try {
      const query = c.get('validatedQuery');
      const result = await SocialService.getTrendingPosts(c, query);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to get trending posts', 500, error.message);
    }
  }
);

// GET /api/v1/social/posts/search
socialHandler.get(
  '/posts/search',
  authMiddleware,
  validationMiddleware({ query: SocialSchemas.searchPostsQuery }),
  async (c) => {
    try {
      const query = c.get('validatedQuery');
      const result = await SocialService.searchPosts(c, query);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to search posts', 500, error.message);
    }
  }
);

// POST /api/v1/social/posts/:id/like
socialHandler.post(
  '/posts/:id/like',
  authMiddleware,
  validationMiddleware({ params: SocialSchemas.getPostParams }),
  async (c) => {
    try {
      const params = c.get('validatedParams');
      const result = await SocialService.likePost(c, params.id);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to like post', 500, error.message);
    }
  }
);

// DELETE /api/v1/social/posts/:id/like
socialHandler.delete(
  '/posts/:id/like',
  authMiddleware,
  validationMiddleware({ params: SocialSchemas.getPostParams }),
  async (c) => {
    try {
      const params = c.get('validatedParams');
      const result = await SocialService.unlikePost(c, params.id);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to unlike post', 500, error.message);
    }
  }
);

// POST /api/v1/social/posts/:id/comments
socialHandler.post(
  '/posts/:id/comments',
  authMiddleware,
  validationMiddleware({ 
    params: SocialSchemas.getPostParams,
    body: SocialSchemas.addCommentBody 
  }),
  async (c) => {
    try {
      const params = c.get('validatedParams');
      const body = c.get('validatedBody');
      const result = await SocialService.addComment(c, params.id, body);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to add comment', 500, error.message);
    }
  }
);

// GET /api/v1/social/posts/:id/comments
socialHandler.get(
  '/posts/:id/comments',
  authMiddleware,
  validationMiddleware({ 
    params: SocialSchemas.getPostParams,
    query: SocialSchemas.listCommentsQuery 
  }),
  async (c) => {
    try {
      const params = c.get('validatedParams');
      const query = c.get('validatedQuery');
      const result = await SocialService.getPostComments(c, params.id, query);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to get post comments', 500, error.message);
    }
  }
);

// DELETE /api/v1/social/posts/:id/comments/:commentId
socialHandler.delete(
  '/posts/:id/comments/:commentId',
  authMiddleware,
  validationMiddleware({ params: SocialSchemas.deleteCommentParams }),
  async (c) => {
    try {
      const params = c.get('validatedParams');
      const result = await SocialService.deleteComment(c, params.commentId);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to delete comment', 500, error.message);
    }
  }
);

// POST /api/v1/social/posts/:id/share
socialHandler.post(
  '/posts/:id/share',
  authMiddleware,
  validationMiddleware({ 
    params: SocialSchemas.getPostParams,
    body: SocialSchemas.sharePostBody 
  }),
  async (c) => {
    try {
      const params = c.get('validatedParams');
      const body = c.get('validatedBody');
      const result = await SocialService.sharePost(c, params.id, body);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to share post', 500, error.message);
    }
  }
);

// POST /api/v1/social/posts/:id/repost
socialHandler.post(
  '/posts/:id/repost',
  authMiddleware,
  validationMiddleware({ 
    params: SocialSchemas.getPostParams,
    body: SocialSchemas.repostBody 
  }),
  async (c) => {
    try {
      const params = c.get('validatedParams');
      const body = c.get('validatedBody');
      const result = await SocialService.repost(c, params.id, body);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to repost', 500, error.message);
    }
  }
);

// POST /api/v1/social/follow/:id
socialHandler.post(
  '/follow/:id',
  authMiddleware,
  validationMiddleware({ params: SocialSchemas.followUserParams }),
  async (c) => {
    try {
      const params = c.get('validatedParams');
      const result = await SocialService.followUser(c, params.id);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to follow user', 500, error.message);
    }
  }
);

// DELETE /api/v1/social/follow/:id
socialHandler.delete(
  '/follow/:id',
  authMiddleware,
  validationMiddleware({ params: SocialSchemas.followUserParams }),
  async (c) => {
    try {
      const params = c.get('validatedParams');
      const result = await SocialService.unfollowUser(c, params.id);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to unfollow user', 500, error.message);
    }
  }
);

// GET /api/v1/social/followers/:id
socialHandler.get(
  '/followers/:id',
  validationMiddleware({
    params: SocialSchemas.followUserParams,
    query: SocialSchemas.paginationQuery
  }),
  async (c) => {
    try {
      const params = c.get('validatedParams');
      const query = c.get('validatedQuery');
      const result = await SocialService.getUserFollowers(c, params.id, query);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to get followers', 500, error.message);
    }
  }
);

// GET /api/v1/social/following/:id
socialHandler.get(
  '/following/:id',
  validationMiddleware({
    params: SocialSchemas.followUserParams,
    query: SocialSchemas.paginationQuery
  }),
  async (c) => {
    try {
      const params = c.get('validatedParams');
      const query = c.get('validatedQuery');
      const result = await SocialService.getUserFollowing(c, params.id, query);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to get following', 500, error.message);
    }
  }
);

// GET /api/v1/social/feed
socialHandler.get(
  '/feed',
  authMiddleware,
  validationMiddleware({ query: SocialSchemas.feedQuery }),
  async (c) => {
    try {
      const query = c.get('validatedQuery');
      const result = await SocialService.getUserFeed(c, query);
      return result;
    } catch (error: any) {
      return sendError(c, 'INTERNAL_ERROR', 'Failed to get feed', 500, error.message);
    }
  }
);

export default socialHandler;