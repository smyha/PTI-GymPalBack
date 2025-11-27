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
   * Sends a message to an AI Agent webhook
   * 
   * There are 3 different agents:
   * 1. 'reception' - First agent for data reception
   * 2. 'data' - Second agent for collecting routine data
   * 3. 'routine' - Third agent that generates the workout routine
   * 
   * For 'routine' agent type: first calls 'data' agent (second agent), then passes its response 
   * to the third agent (recommend-exercises endpoint) to generate the routine.
   */
  async sendMessageToAgent(
    userId: string,
    text: string,
    conversationId?: string, 
    agentType: 'reception' | 'data' | 'routine' = 'reception', // If no agentType is provided, default to reception agent
    userSupabase?: SupabaseClient<Database> // If no userSupabase is provided, use the default supabase client
  ): Promise<string> {
      
    const db = userSupabase || supabase;
    
    // Special handling for routine agent (third agent): 
    // First calls data agent (second agent), and if it returns "data", chains to recommend-exercises (third agent)
    if (agentType === 'routine') {
      logger.info({ userId }, 'Routine agent (third agent) selected: will call data agent (second agent), then recommend-exercises (third agent) if data is available');
      
      // Step 1: Call data agent (second agent) to collect routine data (no retries, no timeout - agents can take time)
      const dataAgentWebhookUrl = env.DATA_AGENT_WEBHOOK_URL;
      logger.info({ userId }, 'Calling data agent (second agent) to collect routine information');
      
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
      const jwtExpirationSeconds = parseInt(env.AGENT_JWT_EXPIRATION_SECONDS || '1800', 10) || 1800;

      // Generate JWT token for data agent
      const token = jwt.sign(
        {
          iss: 'gympal-backend',
          sub: userId,
          aud: 'data-agent',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + jwtExpirationSeconds,
        },
        RECEPTION_AGENT_PRIVATE_KEY,
        { algorithm: 'PS512' }
      );

      // Call data agent (no timeout, no retries - agents can take time)
      // NOTE: ngrok free tier has a 5-minute connection timeout limit
      // If agents take longer, consider upgrading ngrok or implementing async processing
      const requestStartTime = Date.now();
      logger.info({ userId, url: dataAgentWebhookUrl, timestamp: new Date().toISOString() }, 'Sending request to data agent (second agent) - no timeout, no retries');
      
      let dataAgentResponse: Response;
      let dataAgentData: any;
      let dataAgentResponseText: string = '';
      
      try {
        dataAgentResponse = await fetch(dataAgentWebhookUrl, {
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
        });

        const requestDuration = Date.now() - requestStartTime;
        logger.info({ userId, status: dataAgentResponse.status, ok: dataAgentResponse.ok, duration: requestDuration, timestamp: new Date().toISOString() }, 'Data agent (second agent) response received');

        if (!dataAgentResponse.ok) {
          const errorText = await dataAgentResponse.text().catch(() => '');
          logger.error({ userId, status: dataAgentResponse.status, errorText }, 'Data agent webhook returned error');
          throw new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Data agent unavailable: ${dataAgentResponse.status} ${dataAgentResponse.statusText}`);
        }

        const contentType = dataAgentResponse.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const textResponse = await dataAgentResponse.text();
            dataAgentData = textResponse && textResponse.trim() ? JSON.parse(textResponse) : {};
            logger.debug({ userId, hasResponse: !!dataAgentData.response, hasData: !!(dataAgentData.data || dataAgentData.datos) }, 'Parsed data agent response');
          } catch (e) {
            logger.error({ error: e, userId }, 'Failed to parse JSON response from data agent');
            throw new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, "Received response from data agent, but couldn't process it.");
          }
        } else {
          const textResponse = await dataAgentResponse.text();
          if (textResponse) {
            dataAgentData = { response: textResponse };
          } else {
            dataAgentData = {};
          }
        }

        dataAgentResponseText = dataAgentData?.response || '';
        const hasDataField = !!(dataAgentData?.data || dataAgentData?.datos);
        const dataField = dataAgentData?.data || dataAgentData?.datos;
        
        logger.info({ 
          userId, 
          hasResponse: !!dataAgentResponseText, 
          hasData: hasDataField,
          dataKeys: dataField ? Object.keys(dataField) : [],
          dataPreview: dataField ? {
            nom: dataField.nom,
            edat: dataField.edat,
            pes: dataField.pes,
            altura: dataField.altura,
            objectiu: dataField.objectiu,
            disponibilitat: dataField.disponibilitat ? `${dataField.disponibilitat.length} slots` : 'none'
          } : null
        }, 'Data agent (second agent) response processed');
        
        // Log the complete datos structure if available
        if (dataField) {
          logger.info({ 
            userId, 
            datos: dataField, 
            datosType: typeof dataField,
            datosIsObject: typeof dataField === 'object' && !Array.isArray(dataField),
            datosKeys: typeof dataField === 'object' && !Array.isArray(dataField) ? Object.keys(dataField) : [],
            source: 'data-agent' 
          }, 'Complete datos structure received from data agent (second agent)');
        }
      } catch (fetchError: any) {
        const requestDuration = Date.now() - requestStartTime;
        // If it's an AppError, re-throw it
        if (fetchError instanceof AppError) {
          throw fetchError;
        }
        // For network errors or other issues, log detailed information
        logger.error({ 
          error: fetchError, 
          userId, 
          errorName: fetchError?.name, 
          errorMessage: fetchError?.message,
          errorCode: fetchError?.code,
          errorCause: fetchError?.cause,
          duration: requestDuration,
          url: dataAgentWebhookUrl,
          timestamp: new Date().toISOString(),
          stack: fetchError?.stack
        }, 'Failed to call data agent (second agent) - possible timeout or network issue');
        
        // Provide more informative error message
        let errorMessage = 'Network error';
        if (fetchError?.code === 'ECONNREFUSED') {
          errorMessage = 'Connection refused - the agent service may be down or unreachable';
        } else if (fetchError?.code === 'ETIMEDOUT' || fetchError?.name === 'TimeoutError') {
          errorMessage = `Request timed out after ${Math.round(requestDuration / 1000)} seconds - the agent may be processing or ngrok may have closed the connection`;
        } else if (fetchError?.message) {
          errorMessage = fetchError.message;
        }
        
        throw new AppError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to connect to data agent (second agent): ${errorMessage}`
        );
      }

      // Step 2: Check if data agent returned both "response" and "data" or "datos" - if yes, call recommend-exercises
      const hasData = !!(dataAgentData?.data || dataAgentData?.datos);
      const hasResponse = !!dataAgentResponseText;
      
      if (hasData && hasResponse) {
        // Extract ONLY the structured data object returned by the data agent
        // The data can be in dataAgentData.data or dataAgentData.datos as an object OR string
        // Priority: datos > data
        let structuredData = dataAgentData.datos || dataAgentData.data;
        
        // Handle both string and object formats
        if (typeof structuredData === 'string') {
          // Try to parse the string as JSON first
          try {
            structuredData = JSON.parse(structuredData);
            logger.info({ 
              userId, 
              source: 'data-agent'
            }, 'Parsed datos from JSON string to object');
          } catch (jsonParseError) {
            // If JSON parsing fails, try to parse as text format (key: value\nkey: value)
            try {
              structuredData = this.parseTextFormatToObject(structuredData);
              logger.info({ 
                userId, 
                source: 'data-agent'
              }, 'Parsed datos from text format to object');
            } catch (textParseError) {
              logger.error({ 
                error: textParseError, 
                userId, 
                structuredDataPreview: structuredData.substring(0, 200),
                source: 'data-agent'
              }, 'Failed to parse datos string - returning data agent response');
              return dataAgentResponseText;
            }
          }
        }
        
        // Verify that after parsing (if needed), we have a valid object
        if (!structuredData || typeof structuredData !== 'object' || Array.isArray(structuredData)) {
          logger.warn({ 
            userId, 
            hasData, 
            hasResponse, 
            structuredDataType: typeof structuredData,
            isArray: Array.isArray(structuredData),
            dataAgentDataKeys: Object.keys(dataAgentData || {}),
            source: 'data-agent'
          }, 'Structured datos is not a valid object after parsing - returning data agent response');
          return dataAgentResponseText;
        }
        
        // dataToSend should be ONLY the datos object, nothing else
        // This is the object that will be sent to the third agent
        // Field names may vary by language, so we only verify it's a non-empty object
        const dataToSend = structuredData;
        
        // Verify dataToSend is a non-empty object (field names vary by language)
        const dataKeys = Object.keys(dataToSend);
        if (dataKeys.length === 0) {
          logger.warn({ 
            userId, 
            source: 'data-agent'
          }, 'datos object is empty - returning data agent response');
          return dataAgentResponseText;
        }
        
        logger.info({ 
          userId, 
          dataKeysCount: dataKeys.length,
          dataKeys: dataKeys,
          source: 'data-agent'
        }, 'datos object validated - contains fields (field names may vary by language)');
        
        // Log the received datos structure
        logger.info(
          { 
            userId, 
            hasData: true,
            dataKeys: Object.keys(dataToSend),
            datos: dataToSend,  // Log complete datos structure
            dataPreview: {
              nom: dataToSend.nom,
              edat: dataToSend.edat,
              pes: dataToSend.pes,
              altura: dataToSend.altura,
              objectiu: dataToSend.objectiu,
              disponibilitat: dataToSend.disponibilitat ? `${dataToSend.disponibilitat.length} slots` : 'none'
            }
          }, 
          'Data agent returned structured datos - sending to third agent (recommend-exercises)'
        );
        logger.debug({ userId, fullData: dataToSend }, 'Complete datos structure to send to third agent');
        
        logger.info(
          { userId, recommendExercisesUrl: env.RECOMMEND_EXERCISES_WEBHOOK_URL },
          'Redirecting to third agent (routine agent / recommend-exercises) to generate workout routine'
        );
        
        logger.info({ userId }, 'Waiting for third agent (routine agent / recommend-exercises) response...');
        
        // Step 3: Call third agent (routine agent / recommend-exercises) with data from second agent (no timeout, no retries)
        try {
          const recommendExercisesUrl = env.RECOMMEND_EXERCISES_WEBHOOK_URL;
          const requestBody = dataToSend;
          
          logger.info({ 
            userId, 
            url: recommendExercisesUrl, 
            dataSize: JSON.stringify(requestBody).length,
            datos: requestBody,  // Log the complete datos being sent
            dataKeys: Object.keys(requestBody),
            source: 'third-agent' 
          }, 'Calling third agent (routine agent / recommend-exercises) with datos from second agent - no timeout, no retries');
          
          // NOTE: ngrok free tier has a 5-minute connection timeout limit
          // If agents take longer, consider upgrading ngrok or implementing async processing
          const response = await fetch(recommendExercisesUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });
          
          logger.info({ userId, status: response.status, ok: response.ok, source: 'third-agent' }, 'Third agent (recommend-exercises) HTTP response received');
          
          if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            logger.error(
              { userId, status: response.status, errorText, source: 'third-agent' },
              'Third agent (recommend-exercises) returned HTTP error'
            );
            throw new AppError(
              ErrorCode.EXTERNAL_SERVICE_ERROR,
              `Failed to generate routine: ${response.status} ${response.statusText}`
            );
          }
          
          logger.info({ userId, status: response.status, source: 'third-agent' }, 'Third agent (recommend-exercises) responded successfully - processing routine data');
          
          const contentType = response.headers.get('content-type');
          let routineData: any;
          let rawResponseText = '';
          
          if (contentType && contentType.includes('application/json')) {
            rawResponseText = await response.text();
            logger.debug({ userId, rawResponseLength: rawResponseText.length, rawResponsePreview: rawResponseText.substring(0, 500), source: 'third-agent' }, 'Raw response from third agent');
            
            try {
              routineData = rawResponseText && rawResponseText.trim() ? JSON.parse(rawResponseText) : null;
              
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
              }, 'Parsed routine data from third agent (recommend-exercises)');
              
              // Log the complete response structure for debugging
              if (routineData) {
                logger.debug({ userId, completeResponse: routineData, source: 'third-agent' }, 'Complete response structure from third agent');
              }
            } catch (parseError: any) {
              logger.error({ 
                error: parseError, 
                userId, 
                responsePreview: rawResponseText.substring(0, 500),
                responseLength: rawResponseText.length,
                source: 'third-agent' 
              }, 'Failed to parse JSON response from third agent');
              throw new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'Failed to parse routine response from agent');
            }
          } else {
            rawResponseText = await response.text();
            routineData = rawResponseText ? { response: rawResponseText } : null;
            logger.warn({ userId, contentType, source: 'third-agent' }, 'Third agent response is not JSON');
          }
          
          // Format the response for display in chat
          let formattedResponse = '';
          
          if (!routineData) {
            logger.error({ userId, source: 'third-agent' }, 'Third agent returned empty or null response');
            formattedResponse = 'Error: No se recibió respuesta del agente de rutinas.';
          } else if (Array.isArray(routineData) && routineData.length > 0) {
            // Handle array response - take first element
            const routine = routineData[0];
            logger.debug({ userId, routineKeys: routine ? Object.keys(routine) : 'null', hasRutina: !!routine?.rutina, source: 'third-agent' }, 'Processing array response from third agent');
            
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
                  'Routine successfully generated by third agent (recommend-exercises) - array format'
                );
              } catch (formatError: any) {
                logger.error({ error: formatError, userId, routine, source: 'third-agent' }, 'Error formatting routine response');
                formattedResponse = JSON.stringify(routine, null, 2);
              }
            } else {
              logger.warn({ userId, routineKeys: routine ? Object.keys(routine) : 'null', source: 'third-agent' }, 'Third agent response array element does not contain rutina');
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
                'Routine successfully generated by third agent (recommend-exercises) - object format'
              );
            } catch (formatError: any) {
              logger.error({ error: formatError, userId, routineData, source: 'third-agent' }, 'Error formatting routine response');
              formattedResponse = JSON.stringify(routineData, null, 2);
            }
          } else {
            // Fallback: show the raw data structure for debugging
            logger.warn({ 
              userId, 
              routineDataKeys: Object.keys(routineData || {}), 
              routineDataType: typeof routineData,
              isArray: Array.isArray(routineData),
              source: 'third-agent' 
            }, 'Third agent response does not contain expected rutina structure');
            formattedResponse = JSON.stringify(routineData, null, 2);
          }
          
          if (!formattedResponse || formattedResponse.trim() === '') {
            logger.error({ userId, routineData, source: 'third-agent' }, 'Formatted response is empty after processing');
            formattedResponse = 'Error: No se pudo formatear la respuesta de la rutina.';
          }
          
          logger.info({ userId, responseLength: formattedResponse.length, source: 'third-agent' }, 'Third agent (recommend-exercises) response formatted and ready to display in chat');
          
          // Save user message and final routine response to conversation
          await this.saveConversationMessages(userId, conversationId, text, formattedResponse, userSupabase);
          
          logger.info({ userId, source: 'third-agent' }, 'Returning routine response from third agent (recommend-exercises)');
          return formattedResponse;
        } catch (error: any) {
          logger.error({ error, userId, source: 'third-agent', errorName: error?.name, errorMessage: error?.message }, 'Failed to call recommend-exercises endpoint (no retries)');
          if (error instanceof AppError) throw error;
          throw new AppError(
            ErrorCode.EXTERNAL_SERVICE_ERROR,
            `Failed to generate routine: ${error.message || 'Unknown error'}`
          );
        }
      } else {
        // Data agent (second agent) is still asking questions, return its response normally
        logger.info({ userId, hasResponse: !!dataAgentResponseText, hasData: false, source: 'data-agent' }, 'Data agent (second agent) is still collecting information, returning response (no data yet)');
        
        // Save user message and data agent response to conversation
        await this.saveConversationMessages(userId, conversationId, text, dataAgentResponseText, userSupabase);
        
        return dataAgentResponseText;
      }
    }
    
    // Normal flow for first agent (reception) and second agent (data)
    const webhookUrl = agentType === 'data'
      ? env.DATA_AGENT_WEBHOOK_URL  // Second agent
      : env.RECEPTION_AGENT_WEBHOOK_URL;  // First agent
    
    // Log which agent is being contacted
    logger.info({ userId, agentType, webhookUrl, conversationId }, `Communicating with ${agentType} agent (${agentType === 'data' ? 'second' : 'first'} agent)`);

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
        } catch (historyErr) {
          logger.warn({ error: historyErr, conversationId, userId }, 'Error fetching conversation history, continuing without it');
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

      // Helper function to generate a fresh JWT token for each request/retry
      // Note: agentType can only be 'reception' or 'data' here since 'routine' is handled earlier
      const generateToken = () => {
        return jwt.sign(
          {
            iss: 'gympal-backend',
            sub: userId,
            aud: agentType === 'data' ? 'data-agent' : 'reception-agent',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + jwtExpirationSeconds, // Configurable expiration (default: 30 minutes)
          },
          RECEPTION_AGENT_PRIVATE_KEY,
          { algorithm: 'PS512' }
        );
      };

      // Wrap the agent call with retry logic so transient errors do not immediately fail the chat
      const callAgentWithRetry = async (attempt = 1): Promise<{ data: any; responseText: string }> => {
        // Generate a fresh token for each attempt to ensure it's not expired
        const token = generateToken();
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
          // Prepare request body with conversation history for context
          const requestBody: any = {
            user: userId,
            text: text,
            name: userName,
          };
          
          // Include conversation history if available (for reception agent to maintain context)
          if (conversationHistory.length > 0) {
            requestBody.history = conversationHistory;
            logger.debug({ userId, agentType, historyLength: conversationHistory.length }, 'Including conversation history in agent request');
          }
          
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
          logger.debug({ userId, agentType, duration, attempt }, 'Agent request completed');

          if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            
            // Check if webhook is not registered (404 with specific message)
            if (response.status === 404) {
              let errorMessage = '';
              try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.message && errorJson.message.includes('not registered')) {
                  errorMessage = `The ${agentType} agent webhook is not registered or not active. Please ensure the workflow is activated in the agent service.`;
                  logger.error(
                    { userId, agentType, webhookUrl, status: response.status, hint: errorJson.hint },
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
            
            // Provide more specific error message for 404
            if (response.status === 404) {
              throw new AppError(
                ErrorCode.EXTERNAL_SERVICE_ERROR,
                `The ${agentType} agent webhook endpoint was not found (404). Please verify the webhook URL is correct and the workflow is active.`
              );
            }
            
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
      const persistenceClient = userSupabase || (env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : null);

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
        // Save User Message
        const { error: userMsgError } = await persistenceClient.from('ai_messages').insert({
          conversation_id: targetConversationId,
          role: 'user',
          content: userMessage
        } as any);

        if (userMsgError) {
          logger.error({ error: userMsgError, conversationId: targetConversationId }, 'Error saving user message');
        }

        // Save Assistant Message
        const { error: assistantMsgError } = await persistenceClient.from('ai_messages').insert({
          conversation_id: targetConversationId,
          role: 'assistant',
          content: assistantResponse
        } as any);

        if (assistantMsgError) {
          logger.error({ error: assistantMsgError, conversationId: targetConversationId }, 'Error saving assistant message');
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
   * Parse text format data to JSON object
   * Handles formats like: "key: value\nkey2: value2" or "key: value, key2: value2"
   */
  parseTextFormatToObject(text: string): any {
    const result: any = {};
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Handle key: value format
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex === -1) continue;
      
      const key = trimmedLine.substring(0, colonIndex).trim();
      let valueStr = trimmedLine.substring(colonIndex + 1).trim();
      let value: any = valueStr;
      
      // Try to parse value as JSON (for arrays, objects, numbers, booleans)
      if (valueStr.startsWith('[') || valueStr.startsWith('{')) {
        try {
          value = JSON.parse(valueStr);
        } catch (e) {
          // If JSON parsing fails, keep as string
          value = valueStr;
        }
      } else if (valueStr === 'true' || valueStr === 'false') {
        value = valueStr === 'true';
      } else if (!isNaN(Number(valueStr)) && valueStr !== '') {
        value = Number(valueStr);
      }
      
      result[key] = value;
    }
    
    return result;
  },

  /**
   * Format routine response for display in chat
   */
  formatRoutineResponse(routine: any): string {
    if (!routine || !routine.rutina) {
      logger.warn({ routine, hasRutina: !!routine?.rutina }, 'formatRoutineResponse: routine or rutina is missing');
      return JSON.stringify(routine || {}, null, 2);
    }

    const rutina = routine.rutina;
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

