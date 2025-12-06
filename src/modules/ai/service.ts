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
   * Sends a message to AI agents in sequential order:
   * 1. Reception agent (first agent) - collects initial user data
   * 2. Data agent (second agent) - collects routine-specific data
   * 3. Routine agent (third agent) - generates workout routine from combined data
   * 
   * The flow is automatic:
   * - If currentAgent is provided, uses that agent directly
   * - Otherwise, always starts with reception agent
   * - When reception agent returns "response" + "datos", automatically calls data agent
   * - When data agent returns "response" + "datos", combines both and automatically calls routine agent
   * - If agents only return "response" (no "datos"), returns normally (conversational mode)
   * 
   * Returns response with agent state information
   */
  async sendMessageToAgent(
    userId: string,
    text: string,
    conversationId?: string, 
    userSupabase?: SupabaseClient<Database>, // If no userSupabase is provided, use the default supabase client
    currentAgent?: 'reception' | 'data' // Optional: which agent to use (if reception has data, use 'data')
  ): Promise<{ response: string; receptionHasData?: boolean; dataHasData?: boolean }> {
      
    const db = userSupabase || supabase;
    
    // Helper to extract reception datos from conversation history (system messages)
    const getReceptionDatosFromHistory = async (): Promise<Record<string, any> | null> => {
      if (!conversationId) return null;
      
      try {
        // Get system messages from this conversation that contain reception datos
        const { data: messages } = await db
          .from('ai_messages')
          .select('content')
          .eq('conversation_id', conversationId)
          .eq('role', 'system')
          .order('created_at', { ascending: false })
          .limit(10); // Check last 10 system messages
        
        if (!messages || messages.length === 0) return null;
        
        // Look for reception datos in system messages
        for (const msg of messages) {
          try {
            const parsed = JSON.parse(msg.content);
            if (parsed && parsed.type === 'reception_datos' && parsed.datos) {
              logger.info({ userId, conversationId, foundKeys: Object.keys(parsed.datos) }, 'Found reception datos in system message');
              return parsed.datos;
            }
          } catch {
            // Not JSON or not the right format, continue
          }
        }
      } catch (error) {
        logger.warn({ error, userId, conversationId }, 'Failed to extract reception datos from history');
      }
      
      return null;
    };
    
      // Fetch user's full name for agent identification
      const { data: profile, error: profileFetchError } = await db
        .from('profiles')
        .select('full_name, username')
        .eq('id', userId)
        .single();

      if (profileFetchError) {
        logger.error({ error: profileFetchError, userId }, 'Failed to fetch user profile for agent message');
      }

      const userName = profile?.full_name || profile?.username || 'User';

    // Fetch conversation history if conversationId is provided
    let conversationHistory: Array<{ role: string; content: string }> = [];
    if (conversationId) {
      try {
        const { data: messages, error: historyError } = await db
          .from('ai_messages')
          .select('role, content')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
        
        if (historyError) {
          logger.warn({ error: historyError, conversationId, userId }, 'Failed to fetch conversation history');
        } else if (messages && messages.length > 0) {
          conversationHistory = messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }));
          logger.info({ userId, conversationId, messageCount: conversationHistory.length }, 'Retrieved conversation history for agent context');
        }
      } catch (historyErr: any) {
        logger.warn({ error: historyErr, conversationId, userId, errorName: historyErr?.name, errorMessage: historyErr?.message }, 'Error fetching conversation history, continuing without it');
      }
    }

      // Retry behaviour is fully configurable via env vars so we can fine-tune for each deployment
      const timeoutMs = parseInt(env.AGENT_REQUEST_TIMEOUT_MS, 10) || 60000;
      const maxAgentRetries = Math.max(1, parseInt(env.AGENT_REQUEST_MAX_RETRIES || '1', 10) || 1);
      const retryDelayMs = Math.max(500, parseInt(env.AGENT_RETRY_DELAY_MS || '3000', 10) || 3000);
      const isRetryableStatus = (status: number) => status >= 500 || status === 429 || status === 408;
      
      // JWT expiration configuration - use longer expiration to handle retries and long conversations
      // Default to 30 minutes (1800 seconds), but allow configuration via env
      const jwtExpirationSeconds = parseInt(env.AGENT_JWT_EXPIRATION_SECONDS || '1800', 10) || 1800;

    /**
     * Helper function to call an agent with retry logic
     */
    const callAgentWithRetry = async (
      webhookUrl: string,
      agentName: string,
      requestBody: any,
      attempt = 1
    ): Promise<{ data: any; responseText: string }> => {
      // Generate JWT token
      const token = jwt.sign(
          {
            iss: 'gympal-backend',
            sub: userId,
          aud: agentName === 'data' ? 'data-agent' : 'reception-agent',
            iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + jwtExpirationSeconds,
          },
          RECEPTION_AGENT_PRIVATE_KEY,
          { algorithm: 'PS512' }
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          logger.warn(
          { userId, agentName, webhookUrl, timeoutMs, attempt },
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
          body: JSON.stringify(requestBody),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          const duration = Date.now() - startTime;
        logger.debug({ userId, agentName, duration, attempt }, 'Agent request completed');

          if (!response.ok) {
            const errorText = await response.text().catch(() => '');
          
          // Check if webhook is not registered (404 with specific message)
          if (response.status === 404) {
            let errorMessage = '';
            try {
              const errorJson = JSON.parse(errorText);
              if (errorJson.message && errorJson.message.includes('not registered')) {
                errorMessage = `The ${agentName} agent webhook is not registered or not active. Please ensure the workflow is activated in the agent service.`;
                logger.error(
                  { userId, agentName, webhookUrl, status: response.status, hint: errorJson.hint },
                  'Agent webhook not registered or inactive'
                );
                throw new AppError(
                  ErrorCode.EXTERNAL_SERVICE_ERROR,
                  errorMessage
                );
              }
            } catch (parseError) {
              // If JSON parsing fails, continue with normal error handling
            }
          }
          
            const retryable = isRetryableStatus(response.status) && attempt < maxAgentRetries;

            if (retryable) {
              logger.warn(
              { userId, agentName, webhookUrl, status: response.status, attempt },
                'Agent responded with retryable status, retrying'
              );
              await wait(retryDelayMs * attempt);
            return callAgentWithRetry(webhookUrl, agentName, requestBody, attempt + 1);
            }

            if (errorText.includes('<html') || errorText.includes('ngrok')) {
            logger.error({ userId, agentName, webhookUrl, status: response.status }, 'Agent webhook returned HTML error (likely ngrok issue)');
              throw new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'Agent service is temporarily unavailable. Please check the webhook URL configuration.');
            }

          logger.error({ userId, agentName, webhookUrl, status: response.status, errorText }, 'Agent webhook returned error');
          
          // Provide more specific error message for 404
          if (response.status === 404) {
            throw new AppError(
              ErrorCode.EXTERNAL_SERVICE_ERROR,
              `The ${agentName} agent webhook endpoint was not found (404). Please verify the webhook URL is correct and the workflow is active.`,
              { agentName }
            );
          }
          
            throw new AppError(
              ErrorCode.EXTERNAL_SERVICE_ERROR, 
              `${agentName} agent unavailable: ${response.status} ${response.statusText}`,
              { agentName }
            );
          }

          const contentType = response.headers.get('content-type');
        let data: any;

          if (contentType && contentType.includes('application/json')) {
            try {
              const textResponse = await response.text();
              data = textResponse && textResponse.trim() ? JSON.parse(textResponse) : {};
            } catch (e) {
            logger.error({ error: e, userId, agentName }, 'Failed to parse JSON response from agent');
              return { data: {}, responseText: "Received response from agent, but couldn't process it." };
            }
          } else {
            const textResponse = await response.text();
            if (textResponse) {
            data = { response: textResponse };
          } else {
            data = {};
          }
          }

        let responseText = data?.response || '';

            if (!responseText) {
          responseText = `Sorry, I didn't get a response from the ${agentName} agent.`;
          }

          return { data, responseText };
        } catch (fetchError: any) {
          clearTimeout(timeoutId);

          if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
            if (attempt < maxAgentRetries) {
              logger.warn(
              { userId, agentName, webhookUrl, attempt },
                'Agent request timed out, retrying'
              );
              await wait(retryDelayMs * attempt);
            return callAgentWithRetry(webhookUrl, agentName, requestBody, attempt + 1);
            }
            logger.error(
            { userId, agentName, webhookUrl, timeoutMs },
              'Agent request failed after maximum timeout attempts'
            );
            throw new AppError(
              ErrorCode.EXTERNAL_SERVICE_ERROR,
              `Agent request timed out after ${Math.round(timeoutMs / 1000)} seconds. The agent may be processing a complex request. Please try again.`
            );
          }

          if (attempt < maxAgentRetries) {
            logger.warn(
            { error: fetchError, userId, agentName, webhookUrl, attempt },
              'Agent request failed, retrying'
            );
            await wait(retryDelayMs * attempt);
          return callAgentWithRetry(webhookUrl, agentName, requestBody, attempt + 1);
          }

          logger.error(
          { error: fetchError, userId, agentName, webhookUrl },
            'Failed to reach agent webhook'
          );
          throw new AppError(
            ErrorCode.EXTERNAL_SERVICE_ERROR,
            `Failed to connect to agent: ${fetchError.message || 'Network error'}`
          );
        }
      };

    /**
     * Helper function to parse datos from string to object
     */
    const parseDatos = (datos: any): Record<string, any> | null => {
      if (!datos) return null;
      
      // If already an object, return it
      if (typeof datos === 'object' && !Array.isArray(datos)) {
        return datos;
      }
      
      // If string, try to parse as JSON first
      if (typeof datos === 'string') {
        try {
          return JSON.parse(datos);
        } catch (jsonParseError) {
          // If JSON parsing fails, try to parse as text format (key: value\nkey: value)
          try {
            return aiService.parseTextFormatToObject(datos);
          } catch (textParseError) {
            logger.error({ error: textParseError, userId, datosPreview: datos.substring(0, 200) }, 'Failed to parse datos string');
            return null;
          }
        }
      }
      
      return null;
    };

    try {
      let receptionHasData = false;
      let dataHasData = false;
      let finalResponse = '';
      
      // If currentAgent is 'data', skip reception and go directly to data agent
      if (currentAgent === 'data') {
        logger.info({ userId, conversationId, currentAgent }, 'Skipping reception agent, going directly to data agent (second agent)');
        
        // STEP 2: Call data agent directly
        const dataWebhookUrl = env.DATA_AGENT_WEBHOOK_URL;
        const dataRequestBody: any = {
          user: userId,
          text: text,
          name: userName,
        };
        
        // Include conversation history
        if (conversationHistory.length > 0) {
          dataRequestBody.history = conversationHistory;
        }
        
        const { data: dataAgentData, responseText: dataAgentResponseText } = await callAgentWithRetry(
          dataWebhookUrl,
          'data',
          dataRequestBody
        );
        
        // Check if data agent returned "response" and "datos"
        const dataAgentDatos = dataAgentData?.datos || dataAgentData?.data;
        dataHasData = !!dataAgentDatos;
        const hasDataAgentResponse = !!dataAgentResponseText;
        
        logger.info({ 
          userId, 
          hasResponse: hasDataAgentResponse, 
          hasData: dataHasData,
          source: 'data-agent'
        }, 'Data agent (second agent) response processed');
        
        // If data agent doesn't have datos yet, return its response (conversational mode)
        if (!dataHasData) {
          logger.info({ userId, source: 'data-agent' }, 'Data agent (second agent) is still collecting information, returning response');
          
          // Save data agent response to conversation
          await this.saveConversationMessages(userId, conversationId, text, dataAgentResponseText, userSupabase);
          
          return { 
            response: dataAgentResponseText,
            receptionHasData: true, // Reception already has data (we skipped it)
            dataHasData: false
          };
        }
        
        // Data agent has datos - parse it
        const parsedDataAgentDatos = parseDatos(dataAgentDatos);
        if (!parsedDataAgentDatos || Object.keys(parsedDataAgentDatos).length === 0) {
          logger.warn({ userId, source: 'data-agent' }, 'Data agent datos is empty or invalid - returning response');
          await this.saveConversationMessages(userId, conversationId, text, dataAgentResponseText, userSupabase);
          return { 
            response: dataAgentResponseText,
            receptionHasData: true,
            dataHasData: false
          };
        }
        
        logger.info({ 
          userId, 
          datosKeys: Object.keys(parsedDataAgentDatos),
          datos: parsedDataAgentDatos,
          source: 'data-agent'
        }, 'Data agent (second agent) returned structured datos - showing response immediately, sending datos to routine agent in background');
        
        dataHasData = true;
        receptionHasData = true; // Reception already has data (we skipped it)
        
        // Save data agent response immediately
        await this.saveConversationMessages(userId, conversationId, text, dataAgentResponseText, userSupabase);
        
        // Both agents have datos - combine and send to routine agent in background (async)
        // Get reception datos from conversation history
        const receptionDatosFromHistory = await getReceptionDatosFromHistory();
        const combinedDatos = receptionDatosFromHistory 
          ? { ...receptionDatosFromHistory, ...parsedDataAgentDatos } // Combine if found
          : parsedDataAgentDatos; // Otherwise just use data agent datos
        
        logger.info({ 
          userId, 
          hasReceptionDatos: !!receptionDatosFromHistory,
          combinedKeys: Object.keys(combinedDatos),
          source: 'combined-data'
        }, 'Combined datos for routine agent - extracting content from "data" field');
        
        // Extract the content from "data" field if it exists, otherwise use combinedDatos directly
        // The third agent expects the CONTENT of "data", not the "data" object itself
        let datosToSend = combinedDatos;
        if (combinedDatos.data && typeof combinedDatos.data === 'object') {
          // If there's a "data" field with object content, send only that content
          datosToSend = combinedDatos.data;
          logger.info({ 
            userId, 
            originalKeys: Object.keys(combinedDatos),
            extractedKeys: Object.keys(datosToSend),
            source: 'combined-data'
          }, 'Extracted content from "data" field to send to routine agent');
        } else if (combinedDatos.datos && typeof combinedDatos.datos === 'object') {
          // If there's a "datos" field with object content, send only that content
          datosToSend = combinedDatos.datos;
          logger.info({ 
            userId, 
            originalKeys: Object.keys(combinedDatos),
            extractedKeys: Object.keys(datosToSend),
            source: 'combined-data'
          }, 'Extracted content from "datos" field to send to routine agent');
        }
        
        // Save data agent response immediately
        await this.saveConversationMessages(userId, conversationId, text, dataAgentResponseText, userSupabase);
        
        logger.info({ 
          userId, 
          sendingKeys: Object.keys(datosToSend),
          datosToSend: datosToSend,
          source: 'combined-data'
        }, 'Calling routine agent and waiting for response');
        
        // Call routine agent synchronously (await - wait for response)
        const routineResponse = await this.callRoutineAgent(userId, conversationId, text, datosToSend, userSupabase);
        
        logger.info({ userId, conversationId, source: 'third-agent' }, 'Routine agent response received, returning to user');
        
        // Return routine agent response (final response)
        return {
          response: routineResponse,
          receptionHasData: true,
          dataHasData: true
        };
      }
      
      // STEP 1: Start with reception agent (first agent) - unless currentAgent is 'data'
      logger.info({ userId, conversationId, currentAgent }, 'Starting communication with reception agent (first agent)');
      
      const receptionWebhookUrl = env.RECEPTION_AGENT_WEBHOOK_URL;
      const receptionRequestBody: any = {
        user: userId,
        text: text,
        name: userName,
      };
      
      // Include conversation history if available
      if (conversationHistory.length > 0) {
        receptionRequestBody.history = conversationHistory;
        logger.debug({ userId, historyLength: conversationHistory.length }, 'Including conversation history in reception agent request');
      }
      
      const { data: receptionData, responseText: receptionResponseText } = await callAgentWithRetry(
        receptionWebhookUrl,
        'reception',
        receptionRequestBody
      );
      
      // Check if reception agent returned "response" and "datos"
      const receptionDatos = receptionData?.datos || receptionData?.data;
      receptionHasData = !!receptionDatos;
      const hasReceptionResponse = !!receptionResponseText;
      
      logger.info({ 
        userId, 
        hasResponse: hasReceptionResponse, 
        hasData: receptionHasData,
        source: 'reception-agent'
      }, 'Reception agent (first agent) response processed');
      
      // If reception agent doesn't have datos yet, return its response (conversational mode)
      if (!receptionHasData) {
        logger.info({ userId, source: 'reception-agent' }, 'Reception agent (first agent) is still collecting information, returning response');
        
        // Save user message and reception agent response to conversation
        await this.saveConversationMessages(userId, conversationId, text, receptionResponseText, userSupabase);
        
        return {
          response: receptionResponseText,
          receptionHasData: false,
          dataHasData: false
        };
      }
      
      // Reception agent has datos - parse and store it
      const parsedReceptionDatos = parseDatos(receptionDatos);
      if (!parsedReceptionDatos || Object.keys(parsedReceptionDatos).length === 0) {
        logger.warn({ userId, source: 'reception-agent' }, 'Reception agent datos is empty or invalid - returning response');
        await this.saveConversationMessages(userId, conversationId, text, receptionResponseText, userSupabase);
        return {
          response: receptionResponseText,
          receptionHasData: false,
          dataHasData: false
        };
      }
      
      logger.info({ 
        userId, 
        datosKeys: Object.keys(parsedReceptionDatos),
        datos: parsedReceptionDatos,
        source: 'reception-agent'
      }, 'Reception agent (first agent) returned structured datos - showing response, sending datos to data agent and waiting for response');
      
      // Save reception agent response normally (user sees the text response)
      await this.saveConversationMessages(userId, conversationId, text, receptionResponseText, userSupabase);
      
      // Also save reception datos as a system message for later retrieval when currentAgent is 'data'
      // This allows us to combine reception and data agent datos when calling routine agent
      if (conversationId) {
        try {
          // Always prefer supabaseAdmin (service role) if available to bypass RLS issues
          const persistenceClient = (env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : null) || userSupabase;
          if (persistenceClient) {
            const { error: systemMsgError } = await persistenceClient.from('ai_messages').insert({
              conversation_id: conversationId,
              role: 'system',
              content: JSON.stringify({ type: 'reception_datos', datos: parsedReceptionDatos })
            } as any);
            
            if (systemMsgError) {
              logger.error({ error: systemMsgError, userId, conversationId }, 'Error saving reception datos as system message');
            } else {
              logger.debug({ userId, conversationId }, 'Saved reception datos as system message for later retrieval');
            }
          }
        } catch (error) {
          logger.error({ error, userId, conversationId }, 'Failed to save reception datos as system message');
        }
      }
      
      // STEP 2: Automatically call data agent (second agent) and wait for response
      logger.info({ userId }, 'Automatically calling data agent (second agent) after reception agent returned datos - waiting for response');
      
      const dataWebhookUrl = env.DATA_AGENT_WEBHOOK_URL;
      const dataRequestBody: any = {
        user: userId,
        text: text, // Use same user message
        name: userName,
      };
      
      // Include conversation history
      if (conversationHistory.length > 0) {
        dataRequestBody.history = conversationHistory;
      }
      
      const { data: dataAgentData, responseText: dataAgentResponseText } = await callAgentWithRetry(
        dataWebhookUrl,
        'data',
        dataRequestBody
      );
      
      // Check if data agent returned "response" and "datos"
      const dataAgentDatos = dataAgentData?.datos || dataAgentData?.data;
      dataHasData = !!dataAgentDatos;
      const hasDataAgentResponse = !!dataAgentResponseText;
      
      logger.info({ 
        userId, 
        hasResponse: hasDataAgentResponse, 
        hasData: dataHasData,
        source: 'data-agent'
      }, 'Data agent (second agent) response processed');
      
      // If data agent doesn't have datos yet, return its response (conversational mode)
      if (!dataHasData) {
        logger.info({ userId, source: 'data-agent' }, 'Data agent (second agent) is still collecting information, returning response');
        
        // Save data agent response to conversation
        await this.saveConversationMessages(userId, conversationId, text, dataAgentResponseText, userSupabase);
        
        return {
          response: dataAgentResponseText,
          receptionHasData: true, // Reception has data
          dataHasData: false
        };
      }
      
      // Data agent has datos - parse it
      const parsedDataAgentDatos = parseDatos(dataAgentDatos);
      if (!parsedDataAgentDatos || Object.keys(parsedDataAgentDatos).length === 0) {
        logger.warn({ userId, source: 'data-agent' }, 'Data agent datos is empty or invalid - returning response');
        await this.saveConversationMessages(userId, conversationId, text, dataAgentResponseText, userSupabase);
        return {
          response: dataAgentResponseText,
          receptionHasData: true,
          dataHasData: false
        };
      }
      
      logger.info({ 
        userId, 
        datosKeys: Object.keys(parsedDataAgentDatos),
        datos: parsedDataAgentDatos,
        source: 'data-agent'
      }, 'Data agent (second agent) returned structured datos - showing response, sending datos to routine agent and waiting for response');
      
      // Save data agent response immediately
      await this.saveConversationMessages(userId, conversationId, text, dataAgentResponseText, userSupabase);
      
      // STEP 3: Combine datos from both agents
      const combinedDatos = {
        ...parsedReceptionDatos,
        ...parsedDataAgentDatos, // Data agent datos will override reception agent datos if there are conflicts
      };
      
      // Extract the content from "data" field if it exists, otherwise use combinedDatos directly
      // The third agent expects the CONTENT of "data", not the "data" object itself
      let datosToSend = combinedDatos;
      if (combinedDatos.data && typeof combinedDatos.data === 'object') {
        // If there's a "data" field with object content, send only that content
        datosToSend = combinedDatos.data;
        logger.info({ 
          userId, 
          originalKeys: Object.keys(combinedDatos),
          extractedKeys: Object.keys(datosToSend),
          source: 'combined-data'
        }, 'Extracted content from "data" field to send to routine agent');
      } else if (combinedDatos.datos && typeof combinedDatos.datos === 'object') {
        // If there's a "datos" field with object content, send only that content
        datosToSend = combinedDatos.datos;
        logger.info({ 
          userId, 
          originalKeys: Object.keys(combinedDatos),
          extractedKeys: Object.keys(datosToSend),
          source: 'combined-data'
        }, 'Extracted content from "datos" field to send to routine agent');
      }
      
      logger.info({ 
        userId, 
        combinedKeys: Object.keys(combinedDatos),
        sendingKeys: Object.keys(datosToSend),
        datosToSend: datosToSend,
        source: 'combined-data'
      }, 'Combined datos from reception and data agents - calling routine agent and waiting for response');
      
      // STEP 4: Call routine agent synchronously (await - wait for response)
      const routineResponse = await this.callRoutineAgent(userId, conversationId, text, datosToSend, userSupabase);
      
      logger.info({ userId, conversationId, source: 'third-agent' }, 'Routine agent response received, returning to user');
      
      // Return routine agent response (final response)
      return {
        response: routineResponse,
        receptionHasData: true,
        dataHasData: true
      };
    } catch (error: any) {
      logger.error({ error, userId }, 'Failed to communicate with AI agents');
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Failed to contact agent: ${error.message}`);
    }
  },

  /**
   * Helper function to call routine agent (third agent) with combined datos
   */
  async callRoutineAgent(
    userId: string,
    conversationId: string | undefined,
    userMessage: string,
    combinedDatos: Record<string, any>,
    userSupabase?: SupabaseClient<Database>
  ): Promise<string> {
    try {
      logger.info({ userId, recommendExercisesUrl: env.RECOMMEND_EXERCISES_WEBHOOK_URL }, 'Calling routine agent (third agent) with combined datos');
      
      const recommendExercisesUrl = env.RECOMMEND_EXERCISES_WEBHOOK_URL;
        
        logger.info({ 
          userId, 
          url: recommendExercisesUrl, 
          dataSize: JSON.stringify(combinedDatos).length,
          datos: combinedDatos,
          dataKeys: Object.keys(combinedDatos),
          source: 'third-agent' 
        }, 'Calling routine agent (third agent) with combined datos - no timeout, no retries');
        
        // NOTE: ngrok free tier has a 5-minute connection timeout limit
        // If agents take longer, consider upgrading ngrok or implementing async processing
        const response = await fetch(recommendExercisesUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(combinedDatos), // Send ONLY the combined datos
        });
        
        logger.info({ userId, status: response.status, ok: response.ok, source: 'third-agent' }, 'Routine agent (third agent) HTTP response received');
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          logger.error(
            { userId, status: response.status, errorText, source: 'third-agent' },
            'Routine agent (third agent) returned HTTP error'
          );
          throw new AppError(
            ErrorCode.EXTERNAL_SERVICE_ERROR,
            `Routine agent failed: ${response.status} ${response.statusText}`,
            { agentName: 'routine' }
          );
        }
        
        logger.info({ userId, status: response.status, source: 'third-agent' }, 'Routine agent (third agent) responded successfully - processing routine data');
        
        // Get raw response text first (can only be read once)
        const rawResponseText = await response.text();
        logger.info({ 
          userId, 
          rawResponseLength: rawResponseText.length, 
          rawResponsePreview: rawResponseText.substring(0, 1000),
          isEmpty: !rawResponseText || rawResponseText.trim().length === 0,
          source: 'third-agent' 
        }, 'Raw response text from routine agent (first 1000 chars)');
        
        if (!rawResponseText || rawResponseText.trim().length === 0) {
          logger.error({ userId, source: 'third-agent' }, 'Routine agent returned empty response body');
          throw new AppError(
            ErrorCode.EXTERNAL_SERVICE_ERROR, 
            'Routine agent returned empty response',
            { agentName: 'routine' }
          );
        }
        
        const contentType = response.headers.get('content-type');
        let routineData: any;
        
        // Try to parse as JSON first
        if (contentType && contentType.includes('application/json')) {
          try {
            const trimmedText = rawResponseText.trim();
            if (trimmedText.length === 0) {
              logger.error({ userId, source: 'third-agent' }, 'Routine agent returned empty JSON response');
              throw new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'Routine agent returned empty JSON response');
            }
            
            routineData = JSON.parse(trimmedText);
            
            logger.info({ 
              userId, 
              isArray: Array.isArray(routineData),
              isObject: typeof routineData === 'object' && routineData !== null && !Array.isArray(routineData),
              isNull: routineData === null,
              dataType: routineData === null ? 'null' : (Array.isArray(routineData) ? 'array' : typeof routineData),
              hasRutina: routineData?.rutina ? true : (Array.isArray(routineData) && routineData[0]?.rutina ? true : false),
              routineDataKeys: routineData && typeof routineData === 'object' ? Object.keys(routineData) : [],
              arrayLength: Array.isArray(routineData) ? routineData.length : 0,
              firstElementKeys: Array.isArray(routineData) && routineData[0] ? Object.keys(routineData[0]) : [],
              source: 'third-agent' 
            }, 'Parsed routine data from routine agent (third agent)');
            
            // Log the complete response structure for debugging
            if (routineData) {
              logger.debug({ userId, completeResponse: routineData, source: 'third-agent' }, 'Complete response structure from routine agent');
            } else {
              logger.warn({ userId, rawResponseText: trimmedText.substring(0, 500), source: 'third-agent' }, 'Parsed JSON is null - checking if response is plain text');
              // If JSON parse returned null, treat as plain text
              routineData = { response: trimmedText };
            }
          } catch (parseError: any) {
            logger.warn({ 
              error: parseError, 
              userId, 
              responsePreview: rawResponseText.substring(0, 500),
              responseLength: rawResponseText.length,
              source: 'third-agent' 
            }, 'Failed to parse JSON response from routine agent - treating as plain text');
            // If JSON parsing fails, treat as plain text response
            routineData = { response: rawResponseText.trim() };
          }
        } else {
          // Not JSON content type - treat as plain text
          routineData = rawResponseText.trim() ? { response: rawResponseText.trim() } : null;
          logger.info({ userId, contentType, responseLength: rawResponseText.length, source: 'third-agent' }, 'Routine agent response is not JSON - treating as plain text');
        }
        
        // Format the response for display in chat
        let formattedResponse = '';
        
        if (!routineData) {
          logger.error({ userId, source: 'third-agent' }, 'Routine agent returned empty or null response');
          formattedResponse = 'Error: No se recibió respuesta del agente de rutinas.';
        } else if (Array.isArray(routineData) && routineData.length > 0) {
          // Handle array response - take first element
          const routine = routineData[0];
          logger.debug({ userId, routineKeys: routine ? Object.keys(routine) : 'null', hasRutina: !!routine?.rutina, source: 'third-agent' }, 'Processing array response from routine agent');
          
          if (routine && routine.rutina) {
            try {
              formattedResponse = this.formatRoutineResponse(routine);
              logger.info(
                { 
                  userId, 
                  sessionsCount: routine.rutina.sessions?.length || 0,
                  objective: routine.rutina.objectiu,
                  duration: routine.rutina.durada_programa,
                  formattedLength: formattedResponse.length,
                  source: 'third-agent'
                }, 
                'Routine successfully generated by routine agent (third agent) - array format'
              );
            } catch (formatError: any) {
              logger.error({ error: formatError, userId, routine, source: 'third-agent' }, 'Error formatting routine response');
              formattedResponse = JSON.stringify(routine, null, 2);
            }
          } else {
            logger.warn({ userId, routineKeys: routine ? Object.keys(routine) : 'null', source: 'third-agent' }, 'Routine agent response array element does not contain rutina');
            formattedResponse = JSON.stringify(routineData, null, 2);
          }
        } else if (routineData.rutina) {
          // Handle object with rutina property directly
          try {
            formattedResponse = this.formatRoutineResponse(routineData);
            logger.info(
              { 
                userId, 
                sessionsCount: routineData.rutina.sessions?.length || 0,
                objective: routineData.rutina.objectiu,
                duration: routineData.rutina.durada_programa,
                formattedLength: formattedResponse.length,
                source: 'third-agent'
              }, 
              'Routine successfully generated by routine agent (third agent) - object format'
            );
          } catch (formatError: any) {
            logger.error({ error: formatError, userId, routineData, source: 'third-agent' }, 'Error formatting routine response');
            formattedResponse = JSON.stringify(routineData, null, 2);
          }
        } else if (routineData && typeof routineData === 'object') {
          // Fallback: show the raw data structure for debugging
          logger.warn({ 
            userId, 
            routineDataKeys: Object.keys(routineData || {}), 
            routineDataType: typeof routineData,
            isArray: Array.isArray(routineData),
            source: 'third-agent' 
          }, 'Routine agent response does not contain expected rutina structure - showing raw data');
          formattedResponse = JSON.stringify(routineData, null, 2);
        } else if (routineData && typeof routineData === 'string') {
          // If it's a plain string response, use it directly
          logger.info({ userId, responseLength: routineData.length, source: 'third-agent' }, 'Routine agent returned plain text response');
          formattedResponse = routineData;
        } else {
          // Last resort: use raw response text if available
          logger.warn({ 
            userId, 
            routineDataType: typeof routineData,
            routineData: routineData,
            rawResponseLength: rawResponseText.length || 0,
            source: 'third-agent' 
          }, 'Routine agent response format not recognized - using raw response text');
          formattedResponse = rawResponseText.trim() || 'Error: No se recibió respuesta del agente de rutinas.';
        }
        
        if (!formattedResponse || formattedResponse.trim() === '') {
          logger.error({ userId, routineData, rawResponseText, source: 'third-agent' }, 'Formatted response is empty after processing');
          formattedResponse = 'Error: No se pudo formatear la respuesta de la rutina.';
        }
        
        logger.info({ userId, responseLength: formattedResponse.length, source: 'third-agent' }, 'Routine agent (third agent) response formatted and ready to display in chat');
        
        // Save user message and final routine response to conversation
        await this.saveConversationMessages(userId, conversationId, userMessage, formattedResponse, userSupabase);
        
        logger.info({ userId, source: 'third-agent' }, 'Returning routine response from routine agent (third agent)');
        return formattedResponse;
    } catch (error: any) {
      logger.error({ error, userId, source: 'third-agent', errorName: error?.name, errorMessage: error?.message }, 'Failed to call routine agent (third agent)');
      if (error instanceof AppError) {
        // Preserve agent name if already set, otherwise create new error with agent name
        if (!error.details?.agentName) {
          throw new AppError(
            error.code,
            error.message,
            { ...error.details, agentName: 'routine' }
          );
        }
        throw error;
      }
      throw new AppError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Routine agent failed: ${error.message || 'Unknown error'}`,
        { agentName: 'routine' }
      );
    }
  },

  /**
   * Helper function to save routine response as assistant message (without user message)
   */
  async saveRoutineResponse(
    userId: string,
    conversationId: string | undefined,
    routineResponse: string,
    userSupabase?: SupabaseClient<Database>
  ): Promise<void> {
    try {
      // Always prefer supabaseAdmin (service role) if available to bypass RLS issues
      const persistenceClient = (env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : null) || userSupabase;

      if (!persistenceClient) {
        logger.warn(
          { userId },
          'Skipping routine response persistence because no Supabase client with auth context or service role is available'
        );
        return;
      }

      if (!conversationId) {
        logger.warn({ userId }, 'Cannot save routine response without conversation ID');
        return;
      }

      // Verify conversation belongs to user (security check)
      const { data: conv, error: convCheckError } = await persistenceClient
        .from('ai_conversations')
        .select('user_id')
        .eq('id', conversationId)
        .single();
      
      if (convCheckError || !conv || conv.user_id !== userId) {
        logger.error({ 
          error: convCheckError, 
          userId, 
          conversationId, 
          conversationUserId: conv?.user_id 
        }, 'Conversation does not belong to user or not found');
        return;
      }

      // Save Routine Response as Assistant Message (without user message)
      const { error: routineMsgError } = await persistenceClient.from('ai_messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: routineResponse
      } as any);

      if (routineMsgError) {
        logger.error({ 
          error: routineMsgError, 
          conversationId, 
          userId,
          errorCode: routineMsgError.code,
          errorMessage: routineMsgError.message
        }, 'Error saving routine response');
      } else {
        logger.info({ userId, conversationId }, 'Routine response saved successfully');
      }

      // Update conversation updated_at timestamp
      try {
        await persistenceClient
          .from('ai_conversations')
          .update({ updated_at: new Date().toISOString() } as any)
          .eq('id', conversationId);
      } catch (err: any) {
        logger.warn({ error: err, conversationId }, 'Failed to update conversation timestamp');
      }
    } catch (persistError) {
      logger.error({ error: persistError, userId, conversationId }, 'Failed to persist routine response');
    }
  },

  /**
   * Helper function to save user message and assistant response to conversation
   */
  async saveConversationMessages(
    userId: string,
    conversationId: string | undefined,
    userMessage: string,
    assistantResponse: string,
    userSupabase?: SupabaseClient<Database>
  ): Promise<void> {
    try {
      // Always prefer supabaseAdmin (service role) if available to bypass RLS issues
      // Fallback to userSupabase if admin is not available
      const persistenceClient = (env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : null) || userSupabase;

        if (!persistenceClient) {
          logger.warn(
            { userId },
            'Skipping chat persistence because no Supabase client with auth context or service role is available'
          );
        return;
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
          return;
           } else {
             targetConversationId = newConv?.id;
           }
        }

        if (targetConversationId) {
        // Verify conversation belongs to user (security check)
        const { data: conv, error: convCheckError } = await persistenceClient
          .from('ai_conversations')
          .select('user_id')
          .eq('id', targetConversationId)
          .single();
        
        if (convCheckError || !conv || conv.user_id !== userId) {
          logger.error({ 
            error: convCheckError, 
            userId, 
            conversationId: targetConversationId, 
            conversationUserId: conv?.user_id 
          }, 'Conversation does not belong to user or not found');
          return;
        }

        // Save User Message
          const { error: userMsgError } = await persistenceClient.from('ai_messages').insert({
            conversation_id: targetConversationId,
            role: 'user',
          content: userMessage
          } as any);

          if (userMsgError) {
          logger.error({ 
            error: userMsgError, 
            conversationId: targetConversationId, 
            userId,
            errorCode: userMsgError.code,
            errorMessage: userMsgError.message
          }, 'Error saving user message');
          // Don't return early - try to save assistant message anyway
        }

        // Save Assistant Message
          const { error: assistantMsgError } = await persistenceClient.from('ai_messages').insert({
            conversation_id: targetConversationId,
            role: 'assistant',
          content: assistantResponse
          } as any);

          if (assistantMsgError) {
          logger.error({ 
            error: assistantMsgError, 
            conversationId: targetConversationId, 
            userId,
            errorCode: assistantMsgError.code,
            errorMessage: assistantMsgError.message
          }, 'Error saving assistant message');
        }

        // Update conversation updated_at timestamp
        try {
          await persistenceClient
            .from('ai_conversations')
            .update({ updated_at: new Date().toISOString() } as any)
            .eq('id', targetConversationId);
        } catch (err: any) {
          logger.warn({ error: err, conversationId: targetConversationId }, 'Failed to update conversation timestamp');
        }
      }
      } catch (persistError) {
      logger.error({ error: persistError, userId, conversationId }, 'Failed to persist chat messages');
    }
  },

  /**
   * Format routine response for display in chat
   */
  formatRoutineResponse(routine: any): string {
    try {
      if (!routine) {
        logger.warn({ routine, source: 'formatRoutineResponse' }, 'Received null or undefined routine object for formatting');
        return 'Error: No se recibió un objeto de rutina válido para formatear.';
      }
      
      // If the routine object is wrapped in an array, extract the first element
      const actualRoutine = Array.isArray(routine) && routine.length > 0 ? routine[0] : routine;

      if (!actualRoutine || !actualRoutine.rutina) {
        logger.warn({ actualRoutine, source: 'formatRoutineResponse' }, 'Routine object does not contain expected "rutina" property');
        return JSON.stringify(actualRoutine || {}, null, 2);
      }

      const rutina = actualRoutine.rutina;
      let formatted = `# Rutina Personalizada\n\n`;
      
      if (rutina.objectiu) {
        formatted += `**Objetivo:** ${rutina.objectiu}\n\n`;
      }
      
      if (rutina.descripcio) {
        formatted += `${rutina.descripcio}\n\n`;
      }
      
      if (rutina.durada_programa) {
        formatted += `**Duración del programa:** ${rutina.durada_programa}\n\n`;
      }
      
      if (rutina.sessions && Array.isArray(rutina.sessions)) {
        formatted += `## Sesiones de Entrenamiento\n\n`;
        rutina.sessions.forEach((session: any, index: number) => {
          formatted += `### Sesión ${index + 1}: ${session.dia || 'Día no especificado'}\n`;
          if (session.horaInici && session.horaFi) {
            formatted += `**Horario:** ${session.horaInici} - ${session.horaFi}\n`;
          }
          if (session.focus) {
            formatted += `**Enfoque:** ${session.focus}\n`;
          }
          formatted += `\n**Ejercicios:**\n`;
          
          if (session.exercicis && Array.isArray(session.exercicis)) {
            session.exercicis.forEach((ejercicio: any, ejIndex: number) => {
              formatted += `${ejIndex + 1}. **${ejercicio.nom || 'Ejercicio'}**\n`;
              if (ejercicio.series) formatted += `   - Series: ${ejercicio.series}\n`;
              if (ejercicio.repeticions) formatted += `   - Repeticiones: ${ejercicio.repeticions}\n`;
              if (ejercicio.descanso) formatted += `   - Descanso: ${ejercicio.descanso}\n`;
              if (ejercicio.notes) formatted += `   - Notas: ${ejercicio.notes}\n`;
              formatted += `\n`;
            });
          }
          formatted += `\n`;
        });
      }
      
      if (rutina.consells_generals && Array.isArray(rutina.consells_generals)) {
        formatted += `## Consejos Generales\n\n`;
        rutina.consells_generals.forEach((consejo: string) => {
          formatted += `- ${consejo}\n`;
        });
        formatted += `\n`;
      }
      
      if (rutina.progressio) {
        formatted += `## Progresión Semanal\n\n`;
        Object.entries(rutina.progressio).forEach(([semana, descripcion]) => {
          formatted += `**${semana.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}:** ${descripcion}\n\n`;
        });
      }
      
      return formatted;
    } catch (formatError: any) {
      logger.error({ error: formatError, routine, source: 'formatRoutineResponse' }, 'Error during routine formatting');
      return `Error al formatear la rutina: ${formatError.message || 'Error desconocido'}`;
    }
  },

  /**
   * Helper function to parse text in "key: value" format into a JSON object.
   * Handles simple key-value pairs, numbers, booleans, and nested JSON arrays/objects.
   */
  parseTextFormatToObject(text: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Handle key: value format
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex === -1) continue;
      
      const key = trimmedLine.substring(0, colonIndex).trim();
      let value: any = trimmedLine.substring(colonIndex + 1).trim();
      
      // Try to parse value as JSON (for arrays, objects, numbers, booleans)
      if (value.startsWith('[') || value.startsWith('{')) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // If JSON parsing fails, keep as string
        }
      } else if (value === 'true' || value === 'false') {
        value = value === 'true';
      } else if (!isNaN(Number(value)) && value !== '') {
        value = Number(value);
      }
      
      result[key] = value;
    }
    
    return result;
  },

  /**
   * Get user context summary (profile/personal info completeness)
   */
  async getUserContextSummary(
    userId: string,
    userSupabase?: SupabaseClient<Database>
  ): Promise<any> {
    const db = userSupabase || supabase;

    try {
      const { data: profile, error: profileError } = await db
        .from('profiles')
        .select('full_name, username, preferences, fitness_level')
        .eq('id', userId)
        .single();

      if (profileError) {
        logger.error({ error: profileError, userId }, 'Failed to fetch user profile for context summary');
        return {
          hasEssentialInfo: false,
          missingFields: ['profile'],
          profile: null,
          personalInfo: null,
          dietaryPreferences: null,
        };
      }

      // Parse preferences if it's a string
      let preferencesData: Record<string, any> | null = null;
      if (profile?.preferences) {
        if (typeof profile.preferences === 'string') {
          try {
            preferencesData = JSON.parse(profile.preferences);
          } catch {
            preferencesData = null;
          }
        } else if (typeof profile.preferences === 'object') {
          preferencesData = profile.preferences as Record<string, any>;
        }
      }

      // Check for essential info
      const missingFields: string[] = [];
      const hasFullName = !!profile?.full_name;
      const hasUsername = !!profile?.username;
      const hasPreferences = !!preferencesData;
      const hasFitnessLevel = !!profile?.fitness_level;

      if (!hasFullName && !hasUsername) missingFields.push('name');
      if (!hasPreferences) missingFields.push('preferences');
      if (!hasFitnessLevel) missingFields.push('fitness_level');

      const hasEssentialInfo = missingFields.length === 0;

      return {
        hasEssentialInfo,
        missingFields,
        profile: {
          full_name: profile?.full_name,
          username: profile?.username,
          preferences: preferencesData,
          fitness_level: profile?.fitness_level,
        },
        personalInfo: null, // Can be extended if needed
        dietaryPreferences: null, // Can be extended if needed
      };
    } catch (error: any) {
      logger.error({ error, userId }, 'Failed to get user context summary');
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to retrieve user context summary'
      );
    }
  },

  /**
   * Get chat messages for a specific conversation
   */
  async getChatMessages(
    userId: string,
    conversationId: string,
    userSupabase?: SupabaseClient<Database>
  ): Promise<any[]> {
    const db = userSupabase || supabase;

    try {
      // Verify conversation belongs to user
      const { data: conversation, error: convError } = await db
      .from('ai_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
        .single();

      if (convError || !conversation) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Conversation not found');
    }

      // Get messages
      const { data: messages, error: messagesError } = await db
      .from('ai_messages')
        .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

      if (messagesError) {
        logger.error({ error: messagesError, conversationId, userId }, 'Failed to fetch messages');
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to retrieve messages');
    }

    return messages || [];
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error({ error, userId, conversationId }, 'Failed to get chat messages');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to retrieve chat messages');
    }
  },

  /**
   * Get chat history (legacy/global - all messages)
   */
  async getChatHistory(
    userId: string,
    userSupabase?: SupabaseClient<Database>
  ): Promise<any[]> {
    const db = userSupabase || supabase;

    try {
      // Get all conversations for user
      const { data: conversations, error: convError } = await db
      .from('ai_conversations')
        .select('id')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (convError) {
        logger.error({ error: convError, userId }, 'Failed to fetch conversations');
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to retrieve conversations');
      }

      if (!conversations || conversations.length === 0) {
        return [];
      }

      const conversationIds = conversations.map(c => c.id);

      // Get all messages from all conversations
      const { data: messages, error: messagesError } = await db
        .from('ai_messages')
        .select('id, conversation_id, role, content, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: true });

      if (messagesError) {
        logger.error({ error: messagesError, userId }, 'Failed to fetch messages');
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to retrieve messages');
      }

      return messages || [];
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error({ error, userId }, 'Failed to get chat history');
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to retrieve chat history');
    }
  },

  /**
   * Get all conversations for a user
   */
  async getUserConversations(
    userId: string,
    userSupabase?: SupabaseClient<Database>
  ): Promise<any[]> {
    const db = userSupabase || supabase;

    try {
      const { data: conversations, error: error } = await db
        .from('ai_conversations')
        .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
        logger.error({ error, userId }, 'Failed to fetch user conversations');
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to retrieve conversations');
    }

    return conversations || [];
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error({ error, userId }, 'Failed to get user conversations');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to retrieve conversations');
    }
  },

  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string,
    title: string | undefined,
    userSupabase?: SupabaseClient<Database>
  ): Promise<any> {
    const db = userSupabase || supabase;

    try {
      const { data: conversation, error: error } = await db
      .from('ai_conversations')
      .insert({
        user_id: userId,
          title: title || 'New Chat',
      } as any)
        .select('id, title, created_at, updated_at')
      .single();

    if (error) {
        logger.error({ error, userId }, 'Failed to create conversation');
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create conversation');
    }

    return conversation;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error({ error, userId }, 'Failed to create conversation');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create conversation');
    }
  },

  /**
   * Delete a conversation and its messages
   */
  async deleteConversation(
    userId: string,
    conversationId: string,
    userSupabase?: SupabaseClient<Database>
  ): Promise<void> {
    const db = userSupabase || supabase;

    try {
      // Verify conversation belongs to user
      const { data: conversation, error: convError } = await db
      .from('ai_conversations')
        .select('id')
      .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (convError || !conversation) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Conversation not found');
      }

      // Delete conversation (messages will be deleted via CASCADE)
      const { error: deleteError } = await db
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);

      if (deleteError) {
        logger.error({ error: deleteError, conversationId, userId }, 'Failed to delete conversation');
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete conversation');
      }
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error({ error, userId, conversationId }, 'Failed to delete conversation');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete conversation');
    }
  },

  /**
   * Rename a conversation
   */
  async renameConversation(
    userId: string,
    conversationId: string,
    title: string,
    userSupabase?: SupabaseClient<Database>
  ): Promise<any> {
    const db = userSupabase || supabase;

    try {
      // Verify conversation belongs to user
      const { data: conversation, error: convError } = await db
      .from('ai_conversations')
        .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
        .single();

      if (convError || !conversation) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Conversation not found');
    }

      // Update conversation title
      const { data: updatedConversation, error: updateError } = await db
      .from('ai_conversations')
        .update({ title } as any)
        .eq('id', conversationId)
        .select('id, title, created_at, updated_at')
        .single();

      if (updateError) {
        logger.error({ error: updateError, conversationId, userId }, 'Failed to rename conversation');
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to rename conversation');
      }

      return updatedConversation;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error({ error, userId, conversationId }, 'Failed to rename conversation');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to rename conversation');
    }
  },
};
