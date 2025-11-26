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

// Small helper to await between retry attempts without blocking the event loop
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const aiService = {
  /**
   * Sends a message to the Reception Agent webhook
   */
  async sendMessageToAgent(
    userId: string,
    text: string,
    conversationId?: string, 
    agentType: 'reception' | 'data' | 'routine' = 'reception', 
    userSupabase?: SupabaseClient<Database>): Promise<string> {
      
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

      // Retry behaviour is fully configurable via env vars so we can fine-tune for each deployment
      const timeoutMs = parseInt(env.AGENT_REQUEST_TIMEOUT_MS, 10) || 60000;
      const maxAgentRetries = Math.max(1, parseInt(env.AGENT_REQUEST_MAX_RETRIES || '1', 10) || 1);
      const retryDelayMs = Math.max(500, parseInt(env.AGENT_RETRY_DELAY_MS || '3000', 10) || 3000);
      
      // Calculate JWT expiration: timeout * max retries + retry delays + 5 minutes buffer
      // This ensures the JWT doesn't expire during long-running requests with retries
      const maxRequestDuration = (timeoutMs * maxAgentRetries) + (retryDelayMs * maxAgentRetries) + (5 * 60 * 1000);
      const jwtExpirationSeconds = Math.ceil(maxRequestDuration / 1000);

      // Create JWT using the private key (PS512)
      const token = jwt.sign(
        {
          iss: 'gympal-backend',
          sub: userId,
          aud: agentType === 'data' ? 'data-agent' : agentType === 'routine' ? 'routine-agent' : 'reception-agent',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + jwtExpirationSeconds,
        },
        RECEPTION_AGENT_PRIVATE_KEY,
        { algorithm: 'PS512' }
      );

      const isRetryableStatus = (status: number) => status >= 500 || status === 429 || status === 408;

      // Wrap the agent call with retry logic so transient errors do not immediately fail the chat
      const callAgentWithRetry = async (attempt = 1): Promise<{ data: any; responseText: string }> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          logger.warn(
            { userId, agentType, webhookUrl, timeoutMs, attempt },
            `Agent request timeout after ${timeoutMs}ms (attempt ${attempt}/${maxAgentRetries})`
          );
        }, timeoutMs);

        const startTime = Date.now();

        try {
          const response = await fetch(webhookUrl, {
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
          const duration = Date.now() - startTime;
          logger.debug({ userId, agentType, duration, attempt }, 'Agent request completed');

          if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            const retryable = isRetryableStatus(response.status) && attempt < maxAgentRetries;

            if (retryable) {
              logger.warn(
                { userId, agentType, webhookUrl, status: response.status, attempt },
                'Agent responded with retryable status, retrying'
              );
              await wait(retryDelayMs * attempt);
              return callAgentWithRetry(attempt + 1);
            }

            if (errorText.includes('<html') || errorText.includes('ngrok')) {
              logger.error({ userId, agentType, webhookUrl, status: response.status }, 'Agent webhook returned HTML error (likely ngrok issue)');
              throw new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'Agent service is temporarily unavailable. Please check the webhook URL configuration.');
            }

            logger.error({ userId, agentType, webhookUrl, status: response.status, errorText }, 'Agent webhook returned error');
            throw new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Agent unavailable: ${response.status} ${response.statusText}`);
          }

          const contentType = response.headers.get('content-type');
          let data;

          if (contentType && contentType.includes('application/json')) {
            try {
              const textResponse = await response.text();
              data = textResponse && textResponse.trim() ? JSON.parse(textResponse) : {};
            } catch (e) {
              console.error('Failed to parse JSON response from agent');
              return { data: {}, responseText: "Received response from agent, but couldn't process it." };
            }
          } else {
            const textResponse = await response.text();
            if (textResponse) {
              return { data: {}, responseText: textResponse };
            }
            data = {};
          }

          let responseText = data?.response;

          if (data?.datos) {
            logger.info({ agentType, datos: data.datos }, `Received structured data from ${agentType} agent`);

            if (!responseText) {
              responseText = "Great! I have all the information I need. Here is what I found: " + JSON.stringify(data.datos, null, 2);
            }
          }

          if (!responseText) {
            responseText = `Sorry, I didn't get a response from the ${agentType} agent.`;
          }

          return { data, responseText };
        } catch (fetchError: any) {
          clearTimeout(timeoutId);

          if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
            if (attempt < maxAgentRetries) {
              logger.warn(
                { userId, agentType, webhookUrl, attempt },
                'Agent request timed out, retrying'
              );
              await wait(retryDelayMs * attempt);
              return callAgentWithRetry(attempt + 1);
            }
            logger.error(
              { userId, agentType, webhookUrl, timeoutMs },
              'Agent request failed after maximum timeout attempts'
            );
            throw new AppError(
              ErrorCode.EXTERNAL_SERVICE_ERROR,
              `Agent request timed out after ${Math.round(timeoutMs / 1000)} seconds. The agent may be processing a complex request. Please try again.`
            );
          }

          if (attempt < maxAgentRetries) {
            logger.warn(
              { error: fetchError, userId, agentType, webhookUrl, attempt },
              'Agent request failed, retrying'
            );
            await wait(retryDelayMs * attempt);
            return callAgentWithRetry(attempt + 1);
          }

          logger.error(
            { error: fetchError, userId, agentType, webhookUrl },
            'Failed to reach agent webhook'
          );
          throw new AppError(
            ErrorCode.EXTERNAL_SERVICE_ERROR,
            `Failed to connect to agent: ${fetchError.message || 'Network error'}`
          );
        }
      };

      const { data, responseText } = await callAgentWithRetry();

      // --- Start Chat Persistence ---
      try {
        const persistenceClient = userSupabase || (env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : null);

        if (!persistenceClient) {
          logger.warn(
            { userId },
            'Skipping chat persistence because no Supabase client with auth context or service role is available'
          );
          return responseText;
        }

        let targetConversationId = conversationId;

        // If no conversation ID provided, try to find the latest one or create new
        if (!targetConversationId) {
          const { data: existingConv } = await persistenceClient
            .from('ai_conversations')
            .select('id')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          targetConversationId = existingConv?.id;
        }

        // If still no conversation, create one
        if (!targetConversationId) {
           const { data: newConv, error: convError } = await persistenceClient
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
          const { error: userMsgError } = await persistenceClient.from('ai_messages').insert({
            conversation_id: targetConversationId,
            role: 'user',
            content: text
          } as any);

          if (userMsgError) {
            logger.error({ error: userMsgError, conversationId: targetConversationId }, 'Error saving user message');
          }

          // 3. Save Assistant Message
          const { error: assistantMsgError } = await persistenceClient.from('ai_messages').insert({
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
   * Summarize user context to know if we already have essential data
   */
  async getUserContextSummary(userId: string, userSupabase?: SupabaseClient<Database>) {
    const db = userSupabase || supabase;

    try {
      const { data: profile, error: profileError } = await db
        .from('profiles')
        .select('full_name, username, preferences, fitness_level')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const { data: personalInfo, error: personalError } = await db
        .from('user_personal_info')
        .select('age, weight_kg, height_cm')
        .eq('user_id', userId)
        .maybeSingle();

      if (personalError) {
        throw personalError;
      }

      const { data: dietaryPreferences, error: dietaryError } = await db
        .from('user_dietary_preferences')
        .select('dietary_restrictions, allergies, preferred_cuisines, meal_preferences')
        .eq('user_id', userId)
        .maybeSingle();

      if (dietaryError) {
        throw dietaryError;
      }

      const missingFields: string[] = [];

      if (!personalInfo?.age) missingFields.push('age');
      if (!personalInfo?.weight_kg) missingFields.push('weight');
      if (!personalInfo?.height_cm) missingFields.push('height');
      const hasDietaryContext =
        Boolean(dietaryPreferences?.dietary_restrictions?.length) ||
        Boolean(dietaryPreferences?.preferred_cuisines?.length) ||
        Boolean(dietaryPreferences?.meal_preferences);
      if (!hasDietaryContext) missingFields.push('dietaryPreferences');

      return {
        profile,
        personalInfo,
        dietaryPreferences,
        missingFields,
        hasEssentialInfo: missingFields.length === 0,
      };
    } catch (error: any) {
      logger.error({ error, userId }, 'Failed to build user context summary');
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to build context summary: ${error.message}`);
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
   * Rename a conversation title
   */
  async renameConversation(
    userId: string,
    conversationId: string,
    title: string,
    userSupabase?: SupabaseClient<Database>
  ): Promise<any> {
    const db = userSupabase || supabase;
    const trimmedTitle = (title || '').trim();

    if (!trimmedTitle) {
      throw new AppError(ErrorCode.INVALID_INPUT, 'Title is required');
    }

    const { data, error } = await db
      .from('ai_conversations')
      .update({ title: trimmedTitle })
      .eq('id', conversationId)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to rename conversation: ${error.message}`);
    }

    if (!data) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Conversation not found');
    }

    return data;
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

