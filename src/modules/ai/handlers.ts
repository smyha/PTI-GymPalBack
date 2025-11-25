/**
 * @fileoverview Handlers for the AI module
 * 
 * This file contains all HTTP request handlers related to AI features.
 * Handlers allow interacting with AI agents and managing conversations.
 * 
 * @module modules/ai/handlers
 */

import { Context } from 'hono';
import { aiService } from './service.js';
import { logger } from '../../core/config/logger.js';
import {
  sendSuccess,
  sendCreated,
  sendDeleted,
  sendNotFound,
} from '../../core/utils/response.js';
import { getUserFromCtx } from '../../core/utils/context.js';
import { AppError, ErrorCode } from '../../core/utils/error-types.js';

/**
 * Object containing all handlers for the AI module.
 */
export const aiHandlers = {
  /**
   * Sends a message to the Reception Agent or other agents
   */
  async chatWithAgent(c: Context) {
    const user = getUserFromCtx(c);
    const userSupabase = c.get('supabase');
    const body = await c.req.json();
    const text = body.text;
    const conversationId = body.conversationId; // Optional
    const agentType = body.agentType; // Optional, defaults to 'reception'

    if (!text) {
      throw new AppError(ErrorCode.INVALID_INPUT, 'Text is required');
    }

    try {
      const response = await aiService.sendMessageToAgent(user.id, text, conversationId, agentType, userSupabase);
      return sendSuccess(c, { response });
    } catch (error: any) {
      logger.error({ error, userId: user.id }, 'Failed to chat with agent');
      throw error;
    }
  },

  /**
   * Provide summarized context info (what data we have from the user)
   */
  async getContextSummary(c: Context) {
    const user = getUserFromCtx(c);
    const userSupabase = c.get('supabase');

    try {
      const summary = await aiService.getUserContextSummary(user.id, userSupabase);
      return sendSuccess(c, summary);
    } catch (error: any) {
      logger.error({ error, userId: user.id }, 'Failed to get context summary');
      throw error;
    }
  },

  /**
   * Get chat history for a user
   */
  async getChatHistory(c: Context) {
    const user = getUserFromCtx(c);
    const userSupabase = c.get('supabase');
    // Support getting messages for a specific conversation
    const conversationId = c.req.query('conversationId');

    try {
      let messages;
      if (conversationId) {
        messages = await aiService.getChatMessages(user.id, conversationId, userSupabase);
      } else {
        messages = await aiService.getChatHistory(user.id, userSupabase);
      }
      return sendSuccess(c, { messages });
    } catch (error: any) {
      logger.error({ error, userId: user.id }, 'Failed to get chat history');
      throw error;
    }
  },

  /**
   * Get user conversations list
   */
  async listConversations(c: Context) {
    const user = getUserFromCtx(c);
    const userSupabase = c.get('supabase');

    try {
      const conversations = await aiService.getUserConversations(user.id, userSupabase);
      return sendSuccess(c, { conversations });
    } catch (error: any) {
      logger.error({ error, userId: user.id }, 'Failed to list conversations');
      throw error;
    }
  },

  /**
   * Create a new conversation
   */
  async createConversation(c: Context) {
    const user = getUserFromCtx(c);
    const userSupabase = c.get('supabase');
    const body = await c.req.json();
    const title = body.title;

    try {
      const conversation = await aiService.createConversation(user.id, title, userSupabase);
      return sendCreated(c, conversation);
    } catch (error: any) {
      logger.error({ error, userId: user.id }, 'Failed to create conversation');
      throw error;
    }
  },

  /**
   * Delete a conversation
   */
  async deleteConversation(c: Context) {
    const user = getUserFromCtx(c);
    const userSupabase = c.get('supabase');
    const conversationId = c.req.param('id');

    if (!conversationId) {
      return sendNotFound(c, 'Conversation ID');
    }

    try {
      await aiService.deleteConversation(user.id, conversationId, userSupabase);
      return sendDeleted(c);
    } catch (error: any) {
      logger.error({ error, userId: user.id }, 'Failed to delete conversation');
      throw error;
    }
  },

  /**
   * Rename a conversation
   */
  async renameConversation(c: Context) {
    const user = getUserFromCtx(c);
    const userSupabase = c.get('supabase');
    const conversationId = c.req.param('id');
    const body = await c.req.json();
    const title = body.title;

    if (!conversationId) {
      return sendNotFound(c, 'Conversation ID');
    }

    try {
      const conversation = await aiService.renameConversation(user.id, conversationId, title, userSupabase);
      return sendSuccess(c, conversation);
    } catch (error: any) {
      logger.error({ error, userId: user.id }, 'Failed to rename conversation');
      throw error;
    }
  },
};

