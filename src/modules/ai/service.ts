/**
 * AI Service
 * Business logic layer for AI features operations
 */

import { supabase, supabaseAdmin } from '../../core/config/database.js';
import { AppError, ErrorCode } from '../../core/utils/error-types.js';
import type { Database } from '../../core/types/index.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { RECEPTION_AGENT_PRIVATE_KEY } from '../../core/config/agent-key.js';
import jwt from 'jsonwebtoken';
import { logger } from '../../core/config/logger.js';
import { env } from '../../core/config/env.js';

export const aiService = {
  /**
   * Sends a message to the Reception Agent webhook
   */
  async sendMessageToAgent(userId: string, text: string, conversationId?: string, agentType: 'reception' | 'data' | 'routine' = 'reception', userSupabase?: SupabaseClient<Database>): Promise<string> {
    const db = userSupabase || supabase;
    const webhookUrl = agentType === 'data'
      ? env.DATA_AGENT_WEBHOOK_URL
      : agentType === 'routine'
        ? env.ROUTINE_AGENT_WEBHOOK_URL
        : env.RECEPTION_AGENT_WEBHOOK_URL;
    
    // Log which agent is being contacted
    logger.info({ userId, agentType, webhookUrl }, `Communicating with ${agentType} agent`);

    try {
      // Fetch user's full name for agent identification
      const { data: profile, error: profileFetchError } = await db
        .from('profiles')
        .select('full_name, username')
        .eq('id', userId)
        .single();

      if (profileFetchError) {
        logger.error({ error: profileFetchError, userId }, 'Failed to fetch user profile for agent message');
        // Continue without full name if fetch fails
      }

      const userName = profile?.full_name || profile?.username || 'User';

      // Create JWT using the private key (PS512)
      const token = jwt.sign(
        {
          iss: 'gympal-backend',
          sub: userId,
          aud: agentType === 'data' ? 'data-agent' : agentType === 'routine' ? 'routine-agent' : 'reception-agent',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 60, // 1 minute expiration
        },
        RECEPTION_AGENT_PRIVATE_KEY,
        { algorithm: 'PS512' }
      );

      // Send request to webhook with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let response: Response;
      try {
        response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            user: userId,
            text: text,
            name: userName,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          logger.error({ userId, agentType, webhookUrl }, 'Agent request timeout');
          throw new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'Agent request timed out. Please try again.');
        }
        logger.error({ error: fetchError, userId, agentType, webhookUrl }, 'Failed to reach agent webhook');
        throw new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Failed to connect to agent: ${fetchError.message || 'Network error'}`);
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        // Check if response is HTML (ngrok error page)
        if (errorText.includes('<html') || errorText.includes('ngrok')) {
          logger.error({ userId, agentType, webhookUrl, status: response.status }, 'Agent webhook returned HTML error (likely ngrok issue)');
          throw new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'Agent service is temporarily unavailable. Please check the webhook URL configuration.');
        }
        logger.error({ userId, agentType, webhookUrl, status: response.status, errorText }, 'Agent webhook returned error');
        throw new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Agent unavailable: ${response.status} ${response.statusText}`);
      }

      // Check content-type or handle empty body
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const text = await response.text();
          // Try to parse only if there is content
          if (text && text.trim()) {
            data = JSON.parse(text);
          } else {
            data = {};
          }
        } catch (e) {
          console.error('Failed to parse JSON response from agent');
          return "Received response from agent, but couldn't process it.";
        }
      } else {
        const text = await response.text();
        if (text) {
           return text;
        }
        data = {}; 
      }
      
      // Expecting { response: "..." } or { datos: ... }
      let responseText = data?.response;
      
      // If we got structured data ("datos"), format it or log it
      if (data?.datos) {
        logger.info({ agentType, datos: data.datos }, `Received structured data from ${agentType} agent`);
        
        // If response text is missing but we have data, indicate success
        if (!responseText) {
          responseText = "Great! I have all the information I need. Here is what I found: " + JSON.stringify(data.datos, null, 2);
        }
      }
      
      if (!responseText) {
         responseText = `Sorry, I didn't get a response from the ${agentType} agent.`;
      }

      // --- Start Chat Persistence ---
      try {
        let targetConversationId = conversationId;

        // If no conversation ID provided, try to find the latest one or create new
        if (!targetConversationId) {
          const { data: existingConv } = await supabaseAdmin
            .from('ai_conversations')
            .select('id')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          targetConversationId = existingConv?.id;
        }

        // If still no conversation, create one
        // Use supabaseAdmin to bypass RLS and ensure conversation is created
        if (!targetConversationId) {
           const { data: newConv, error: convError } = await supabaseAdmin
             .from('ai_conversations')
             .insert({
               user_id: userId,
               title: 'New Chat'
             } as any)
             .select('id')
             .single();
           
           if (convError) {
             logger.error({ error: convError, userId }, 'Error creating conversation');
           } else {
             targetConversationId = newConv?.id;
           }
        }

        if (targetConversationId) {
          // 2. Save User Message
          // Use supabaseAdmin to bypass RLS and ensure messages are saved
          const { error: userMsgError } = await supabaseAdmin.from('ai_messages').insert({
            conversation_id: targetConversationId,
            role: 'user',
            content: text
          } as any);

          if (userMsgError) {
            logger.error({ error: userMsgError, conversationId: targetConversationId }, 'Error saving user message');
          }

          // 3. Save Assistant Message
          const { error: assistantMsgError } = await supabaseAdmin.from('ai_messages').insert({
            conversation_id: targetConversationId,
            role: 'assistant',
            content: responseText
          } as any);

          if (assistantMsgError) {
            logger.error({ error: assistantMsgError, conversationId: targetConversationId }, 'Error saving assistant message');
          }
        }

      } catch (persistError) {
        logger.error({ error: persistError }, 'Failed to persist chat message');
      }
      // --- End Chat Persistence ---

      return responseText;
    } catch (error: any) {
      logger.error({ error, userId }, `Failed to communicate with ${agentType} agent`);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Failed to contact agent: ${error.message}`);
    }
  },

  /**
   * Get chat history for a specific conversation
   */
  async getChatMessages(userId: string, conversationId: string, userSupabase?: SupabaseClient<Database>): Promise<any[]> {
    const db = userSupabase || supabase;
    // Verify conversation ownership
    const { data: conversation } = await db
      .from('ai_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!conversation) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Conversation not found');
    }

    // Get messages for this conversation
    const { data: messages, error } = await db
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get chat messages: ${error.message}`);
    }

    return messages || [];
  },

  /**
   * Get user conversations list
   */
  async getUserConversations(userId: string, userSupabase?: SupabaseClient<Database>): Promise<any[]> {
    const db = userSupabase || supabase;
    const { data: conversations, error } = await db
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get conversations: ${error.message}`);
    }

    return conversations || [];
  },

  /**
   * Create a new conversation
   */
  async createConversation(userId: string, title?: string, userSupabase?: SupabaseClient<Database>): Promise<any> {
    const db = userSupabase || supabase;
    const { data: conversation, error } = await db
      .from('ai_conversations')
      .insert({
        user_id: userId,
        title: title || 'New Chat'
      } as any)
      .select()
      .single();

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to create conversation: ${error.message}`);
    }

    return conversation;
  },

  /**
   * Delete a conversation
   */
  async deleteConversation(userId: string, conversationId: string, userSupabase?: SupabaseClient<Database>): Promise<void> {
    const db = userSupabase || supabase;
    const { error } = await db
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to delete conversation: ${error.message}`);
    }
  },

  /**
   * Get chat history for a user (Legacy/Latest)
   */
  async getChatHistory(userId: string, userSupabase?: SupabaseClient<Database>): Promise<any[]> {
    const db = userSupabase || supabase;
    // Get the latest conversation
    const { data: conversation } = await db
      .from('ai_conversations')
      .select('id')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!conversation) return [];

    // Get messages for this conversation
    const { data: messages, error } = await db
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get chat history: ${error.message}`);
    }

    return messages || [];
  },
};

