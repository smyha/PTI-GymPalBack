/**
 * AI Routes Module
 * 
 * This module defines all AI feature routes:
 * - Chat with AI agents
 * - Conversation management (history, create, delete)
 * 
 * All routes require authentication.
 */

import { Hono } from 'hono';
import { auth } from '../../middleware/auth.js';
import { aiHandlers } from './handlers.js';
import { AI_ROUTES } from '../../core/routes.js';

// Hono router instance for AI routes
const aiRoutes = new Hono();

// Apply authentication to all routes
aiRoutes.use('*', auth);

// Chat routes group
const chatRoutes = new Hono();

/**
 * @openapi
 * /api/v1/ai/chat/agent:
 *   post:
 *     tags: [AI]
 *     summary: Chat with AI Agent
 *     description: Send a message to an AI agent and receive a response. Supports different agent types.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The message text to send
 *               conversationId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional conversation ID to continue a chat
 *               agentType:
 *                 type: string
 *                 enum: [reception, data, routine]
 *                 default: reception
 *                 description: The type of agent to interact with
 *     responses:
 *       200:
 *         description: AI response received
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
 *                     response:
 *                       type: string
 *                       description: The agent's response text
 *       400:
 *         description: Invalid input
 *       500:
 *         description: External service error or internal server error
 */
chatRoutes.post('/agent', aiHandlers.chatWithAgent);

/**
 * @openapi
 * /api/v1/ai/chat/history:
 *   get:
 *     tags: [AI]
 *     summary: Get chat history
 *     description: Retrieve messages from chat history. Can filter by conversation ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: conversationId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional conversation ID to fetch specific history
 *     responses:
 *       200:
 *         description: History retrieved successfully
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
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           role:
 *                             type: string
 *                             enum: [user, assistant]
 *                           content:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 */
chatRoutes.get('/history', aiHandlers.getChatHistory);

/**
 * @openapi
 * /api/v1/ai/chat/conversations:
 *   get:
 *     tags: [AI]
 *     summary: List conversations
 *     description: Get a list of all user conversations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversations list retrieved successfully
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
 *                     conversations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           title:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *   post:
 *     tags: [AI]
 *     summary: Create conversation
 *     description: Start a new conversation thread
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Optional title for the conversation
 *     responses:
 *       201:
 *         description: Conversation created successfully
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     title:
 *                       type: string
 */
chatRoutes.get('/conversations', aiHandlers.listConversations);
chatRoutes.post('/conversations', aiHandlers.createConversation);

/**
 * @openapi
 * /api/v1/ai/chat/conversations/{id}:
 *   delete:
 *     tags: [AI]
 *     summary: Delete conversation
 *     description: Delete a specific conversation and its messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 *       404:
 *         description: Conversation not found
 */
chatRoutes.delete('/conversations/:id', aiHandlers.deleteConversation);

// Mount chat routes under /chat
// Note: The base AI_ROUTES.CHAT should be used when mounting in app.ts, 
// or we mount this router at AI_ROUTES.ROOT + '/chat'
// Here we assume this module exports the main AI router which has sub-routes.

// Assuming structure: /api/v1/ai/chat/...
// If AI_ROUTES.CHAT is '/chat'
aiRoutes.route(AI_ROUTES.CHAT, chatRoutes);

export default aiRoutes;

