/**
 * Social Service
 * Business logic layer for social features operations
 */

import { insertRow, selectRow, selectRows, updateRow, upsertRow } from '../../core/config/database-helpers.js';
import { supabase, supabaseAdmin } from '../../core/config/database.js';
import { AppError, ErrorCode } from '../../core/utils/error-types.js';
import type * as Unified from '../../core/types/unified.types.js';
import type { Database } from '../../core/types/index.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreatePostData, UpdatePostData, PostFilters, CreateCommentData } from './types.js';

/**
 * Helper function to map post row to Unified.Post
 */
function mapPostRowToPost(row: any): Unified.Post {
  return {
    id: row.id,
    user_id: row.user_id,
    content: row.content,
    post_type: row.post_type || 'general',
    workout_id: row.workout_id,
    image_urls: row.image_urls || [],
    video_url: row.video_url,
    hashtags: row.hashtags || [],
    likes_count: row.likes_count || 0,
    comments_count: row.comments_count || 0,
    shares_count: row.shares_count || 0,
    reposts_count: row.reposts_count || 0,
    is_public: row.is_public ?? true,
    is_original: row.is_original ?? true,
    original_post_id: row.original_post_id,
    shared_from_user_id: row.shared_from_user_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

import { RECEPTION_AGENT_PRIVATE_KEY } from '../../core/config/agent-key.js';
import jwt from 'jsonwebtoken';
import { logger } from '../../core/config/logger.js';

export const socialService = {
  /**
   * Sends a message to the Reception Agent webhook
   */
  async sendMessageToAgent(userId: string, text: string, conversationId?: string, agentType: 'reception' | 'data' | 'routine' = 'reception', userSupabase?: SupabaseClient<Database>): Promise<string> {
    const db = userSupabase || supabase;
    const webhookUrl = agentType === 'data'
      ? 'https://carrol-eudemonistical-gregg.ngrok-free.dev/webhook/dataAgent'
      : agentType === 'routine'
        ? 'https://carrol-eudemonistical-gregg.ngrok-free.dev/webhook/routineAgent'
        : 'https://carrol-eudemonistical-gregg.ngrok-free.dev/webhook/receptionAgent';
    
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
      // The user provided a key for signing. Usually RS512 or PS512 requires a proper key format.
      // We assume the key provided is valid PEM for signing.
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

      // Send request to webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user: userId,
          text: text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Webhook error: ${response.status} ${response.statusText}`, errorText);
        throw new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Reception agent unavailable: ${response.status}`);
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
          // Fallback if it's not valid JSON but we got an OK response
          return "Received response from agent, but couldn't process it.";
        }
      } else {
        // If not JSON, maybe it returned plain text?
        const text = await response.text();
        if (text) {
           // If it's just text, maybe that's the response?
           // But the logs show "SyntaxError: Unexpected end of JSON input" specifically for JSON.parse
           // so we likely expect JSON.
           // If it's plain text and we expected JSON, let's check if it looks like the answer.
           return text;
        }
        data = {}; 
      }
      
      // Expecting { response: "..." } or { datos: ... } based on user feedback
      let responseText = data?.response;
      
      // If we got structured data ("datos"), format it as a message or use it
      if (data?.datos) {
        console.log(`Received structured data from ${agentType} agent:`, data.datos);
        
        if (agentType === 'reception') {
            // Attempt to update user profile with the data
            // NOTE: This logic is currently commented out as it requires proper handling of data distribution across multiple tables 
            // and potentially needs admin privileges or updated RLS policies to allow the user to update these specific fields.
            // The data returned by the agent might need to be split and updated in:
            // 1. 'profiles' table (for basic info like name)
            // 2. 'user_personal_info' table (for detailed metrics like height, weight, age)
            // 3. potentially other tables depending on the data structure (e.g. fitness goals)
            
            /*
            try {
                const agentData = data.datos;
                const updates: any = {};
                const personalInfoUpdates: any = {};

                if (agentData.name) updates.full_name = agentData.name;

                if (agentData.fitness_level) {
                    const level = agentData.fitness_level;
                    if (level <= 3) updates.fitness_level = 'beginner';
                    else if (level <= 6) updates.fitness_level = 'intermediate';
                    else if (level <= 8) updates.fitness_level = 'advanced';
                    else updates.fitness_level = 'expert';
                }
                
                if (agentData.age) personalInfoUpdates.age = agentData.age;
                if (agentData.weight) personalInfoUpdates.weight_kg = agentData.weight;
                if (agentData.height) {
                    // Assuming height is in meters if < 3 (like 1.85) or cm if > 100
                    if (agentData.height < 3) {
                        personalInfoUpdates.height_cm = Math.round(agentData.height * 100);
                    } else {
                        personalInfoUpdates.height_cm = Math.round(agentData.height);
                    }
                }

                if (Object.keys(updates).length > 0) {
                    const { error: profileError } = await db // previously supabaseAdmin
                        .from('profiles')
                        .update(updates)
                        .eq('id', userId);
                    
                    if (profileError) logger.error({ error: profileError }, 'Error updating profile');
                }

                if (Object.keys(personalInfoUpdates).length > 0) {
                    // Check if personal info row exists
                    const { data: exists } = await db.from('user_personal_info').select('id').eq('user_id', userId).maybeSingle();
                    
                    if (exists) {
                        const { error: updateError } = await db
                            .from('user_personal_info')
                            .update(personalInfoUpdates)
                            .eq('user_id', userId);
                        if (updateError) logger.error({ error: updateError }, 'Error updating personal info');
                    } else {
                        const { error: insertError } = await db
                            .from('user_personal_info')
                            .insert({ ...personalInfoUpdates, user_id: userId });
                        if (insertError) logger.error({ error: insertError }, 'Error inserting personal info');
                    }
                }
                
                logger.info('Updated user profile from agent data');

            } catch (updateError) {
                logger.error({ error: updateError }, 'Failed to update profile from agent data');
            }
            */
            // Just log the data for now as requested
            logger.info({ userId, agentData: data.datos }, 'Received profile data from reception agent (update skipped)');
        } else if (agentType === 'data') {
            // Handle data from dataAgent (Routine preferences)
            logger.info({ data: data.datos }, 'Routine data collected');
            // Here we could trigger workout generation or save preferences
            // For now, we'll just confirm receipt
        } else if (agentType === 'routine') {
             // Handle routine generation completion
             logger.info({ data: data.datos }, 'Routine generation completed');
        }

        // If response text is missing but we have data, indicate success
        if (!responseText) {
          responseText = "Great! I have all the information I need. Here is what I found: " + JSON.stringify(data.datos, null, 2);
        }
      }
      
      if (!responseText) {
         responseText = "Sorry, I didn't get a response from the agent.";
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
             console.error('Error creating conversation:', convError);
           } else {
             targetConversationId = newConv?.id;
           }
        }

        if (targetConversationId) {
          // 2. Save User Message
          await supabaseAdmin.from('ai_messages').insert({
            conversation_id: targetConversationId,
            role: 'user',
            content: text
          } as any);

          // 3. Save Assistant Message
          await supabaseAdmin.from('ai_messages').insert({
            conversation_id: targetConversationId,
            role: 'assistant',
            content: responseText
          } as any);
        }

      } catch (persistError) {
        logger.error({ error: persistError }, 'Failed to persist chat message');
        // Don't fail the request if persistence fails, just log it
      }
      // --- End Chat Persistence ---

      return responseText;
    } catch (error: any) {
      logger.error({ error }, 'Failed to communicate with reception agent');
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

  /**
   * Creates a new post
   */
  async createPost(userId: string, data: CreatePostData): Promise<Unified.Post> {
    const postData: any = {
      user_id: userId,
      content: data.content,
      post_type: (data as any).post_type || 'general',
      image_urls: Array.isArray((data as any).images)
        ? ((data as any).images as Array<{ url: string }>).map((i) => i?.url).filter(Boolean)
        : [],
      workout_id: data.workout_id,
      hashtags: Array.isArray((data as any).tags) ? (data as any).tags : [],
      is_public: data.is_public ?? true,
    };

    const { data: post, error } = await insertRow('posts', postData);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to create post: ${error.message}`);
    }

    if (!post) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create post');
    }

    return mapPostRowToPost(post);
  },

  /**
   * Finds multiple posts with filters
   * Returns posts with author information, likes count, and comments count
   */
  async findMany(userId: string, filters: PostFilters): Promise<{ posts: any[]; total: number }> {
    const { page = 1, limit = 20 } = filters as any;
    const user_id = (filters as any).user_id as string | undefined;
    const offset = (page - 1) * limit;

    // Build base query with author profile join
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey(id, username, full_name, avatar_url)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true);

    const totalCount = count || 0;

    // Get paginated posts
    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get posts: ${error.message}`);
    }

    // Type assertion for the query result with join
    const postsData = (data || []) as any[];

    // Enrich posts with author info, likes, and comments count
    const enrichedPosts = await Promise.all(postsData.map(async (post: any) => {
      // Get likes count
      const { count: likesCount } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      // Get comments count
      const { count: commentsCount } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      // Check if current user liked this post
      const { data: userLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', userId)
        .maybeSingle();

      return {
        id: post.id,
        content: post.content,
        image_urls: post.image_urls || [],
        hashtags: post.hashtags || [],
        workout_id: post.workout_id,
        is_public: post.is_public ?? true,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        userId: post.user_id,  // Include user_id directly
        author: post.profiles ? {
          id: post.profiles.id,
          username: post.profiles.username,
          fullName: post.profiles.full_name,
          avatar: post.profiles.avatar_url,
        } : {
          // Fallback when profile is missing
          id: post.user_id,
          username: 'Usuario',
          fullName: 'Usuario',
          avatar: null,
        },
        likesCount: likesCount || 0,
        commentsCount: commentsCount || 0,
        isLiked: !!userLike,
      };
    }));

    return {
      posts: enrichedPosts,
      total: totalCount,
    };
  },

  /**
   * Finds a post by ID with author information
   */
  async findById(id: string, userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey(id, username, full_name, avatar_url)
      `)
      .eq('id', id)
      .or(`user_id.eq.${userId},is_public.eq.true`)
      .maybeSingle();

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get post: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Type assertion for the query result with join
    const postData = data as any;

    // Get likes count
    const { count: likesCount } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id);

    // Get comments count
    const { count: commentsCount } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id);

    // Check if current user liked this post
    const { data: userLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    return {
      id: postData.id,
      content: postData.content,
      image_urls: postData.image_urls || [],
      hashtags: postData.hashtags || [],
      workout_id: postData.workout_id,
      is_public: postData.is_public ?? true,
      createdAt: postData.created_at,
      updatedAt: postData.updated_at,
      author: postData.profiles ? {
        id: postData.profiles.id,
        username: postData.profiles.username,
        fullName: postData.profiles.full_name,
        avatar: postData.profiles.avatar_url,
      } : null,
      likesCount: likesCount || 0,
      commentsCount: commentsCount || 0,
      isLiked: !!userLike,
    };
  },

  /**
   * Updates a post
   */
  async updatePost(id: string, userId: string, data: UpdatePostData): Promise<Unified.Post> {
    const updateData: any = {};

    if (data.content !== undefined) updateData.content = data.content;
    if ((data as any).images !== undefined) {
      const imgs = (data as any).images as Array<{ url: string }>;
      updateData.image_urls = Array.isArray(imgs) ? imgs.map((i) => i?.url).filter(Boolean) : [];
    }
    if ((data as any).tags !== undefined) updateData.hashtags = (data as any).tags;
    if (data.is_public !== undefined) updateData.is_public = data.is_public;

    const { data: updated, error } = await updateRow('posts', updateData, (q) =>
      q.eq('id', id).eq('user_id', userId)
    );

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to update post: ${error.message}`);
    }

    if (!updated) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Post not found or access denied');
    }

    return mapPostRowToPost(updated);
  },

  /**
   * Deletes a post
   */
  async deletePost(id: string, userId: string): Promise<boolean> {
    const { error } = await supabase.from('posts').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to delete post: ${error.message}`);
    }

    return true;
  },

  /**
   * Likes a post (toggles like/unlike)
   */
  async likePost(postId: string, userId: string): Promise<void> {
    // First check if the like already exists
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to check like status: ${checkError.message}`);
    }

    if (existingLike) {
      // Unlike: delete the existing like
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (deleteError) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to unlike post: ${deleteError.message}`);
      }
    } else {
      // Like: insert new like using admin client to bypass RLS
      const likeData = {
        post_id: postId,
        user_id: userId,
      };

      const { error: insertError } = await supabaseAdmin
        .from('post_likes')
        .insert(likeData as any);

      if (insertError) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to like post: ${insertError.message}`);
      }
    }
  },

  /**
   * Creates a comment on a post (or replies to another comment)
   *
   * @param postId - ID of the post to comment on
   * @param userId - ID of the user creating the comment
   * @param data - Comment data (content, optional parent_comment_id for replies)
   * @param userSupabase - Authenticated Supabase client with proper RLS context
   *
   * Note: Must use authenticated Supabase client to bypass RLS policy violations
   */
  async createComment(
    postId: string,
    userId: string,
    data: CreateCommentData,
    userSupabase: SupabaseClient<Database>
  ): Promise<{
    id: string;
    post_id: string;
    user_id: string;
    parent_comment_id: string | null;
    content: string;
    createdAt: string;
    updatedAt: string;
    author: {
      id: string;
      username: string;
      fullName: string | null;
      avatar: string | null;
    } | null;
  }> {
    const commentData = {
      post_id: postId,
      user_id: userId,
      content: data.content,
      parent_comment_id: data.parent_comment_id || null,
    };

    // Use authenticated client to avoid RLS violations
    const { data: comment, error } = await userSupabase
      .from('post_comments')
      .insert(commentData as any)
      .select()
      .single();

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to create comment: ${error.message}`);
    }

    if (!comment) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create comment');
    }

    // Get author info for the comment
    type ProfileSelect = {
      id: string;
      username: string;
      full_name: string | null;
      avatar_url: string | null;
    };

    const { data: author, error: authorError } = await userSupabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', userId)
      .single() as { data: ProfileSelect | null; error: any };

    if (authorError) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get author info: ${authorError.message}`);
    }

    if (!author) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Author not found');
    }

    const commentRow = comment as Database['public']['Tables']['post_comments']['Row'];

    return {
      id: commentRow.id,
      post_id: commentRow.post_id,
      user_id: commentRow.user_id,
      parent_comment_id: commentRow.parent_comment_id || null,
      content: commentRow.content,
      createdAt: commentRow.created_at || '',
      updatedAt: commentRow.updated_at || '',
      author: {
        id: author.id,
        username: author.username,
        fullName: author.full_name,
        avatar: author.avatar_url,
      },
    };
  },

  /**
   * Gets comments for a post (including replies)
   */
  async getComments(postId: string, page: number = 1, limit: number = 20): Promise<{
    comments: Array<{
      id: string;
      post_id: string;
      user_id: string;
      parent_comment_id: string | null;
      content: string;
      createdAt: string;
      updatedAt: string;
      author: {
        id: string;
        username: string;
        fullName: string | null;
        avatar: string | null;
      } | null;
      replies: Array<{
        id: string;
        post_id: string;
        user_id: string;
        parent_comment_id: string | null;
        content: string;
        createdAt: string;
        updatedAt: string;
        author: {
          id: string;
          username: string;
          fullName: string | null;
          avatar: string | null;
        } | null;
      }>;
    }>;
    total: number;
  }> {
    const offset = (page - 1) * limit;

    type CommentWithProfile = Database['public']['Tables']['post_comments']['Row'] & {
      profiles: Database['public']['Tables']['profiles']['Row'] | null;
    };

    const { data: comments, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles!post_comments_user_id_fkey(id, username, full_name, avatar_url)
      `)
      .eq('post_id', postId)
      .is('parent_comment_id', null) // Only top-level comments for pagination
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get comments: ${error.message}`);
    }

    // Get replies for each comment
    const commentsWithReplies = await Promise.all((comments || []).map(async (comment) => {
      // Explicitly cast comment to match expected structure with profile
      const commentWithProfile = comment as CommentWithProfile;
      
      const { data: replies } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles!post_comments_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq('parent_comment_id', comment.id)
        .order('created_at', { ascending: true });

      return {
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        parent_comment_id: comment.parent_comment_id || null,
        content: comment.content,
        createdAt: comment.created_at || '',
        updatedAt: comment.updated_at || '',
        author: commentWithProfile.profiles ? {
          id: commentWithProfile.profiles.id,
          username: commentWithProfile.profiles.username || '',
          fullName: commentWithProfile.profiles.full_name,
          avatar: commentWithProfile.profiles.avatar_url,
        } : null,
        replies: (replies || []).map((reply) => {
          const replyWithProfile = reply as CommentWithProfile;
          return {
            id: reply.id,
            post_id: reply.post_id,
            user_id: reply.user_id,
            parent_comment_id: reply.parent_comment_id || null,
            content: reply.content,
            createdAt: reply.created_at || '',
            updatedAt: reply.updated_at || '',
            author: replyWithProfile.profiles ? {
              id: replyWithProfile.profiles.id,
              username: replyWithProfile.profiles.username || '',
              fullName: replyWithProfile.profiles.full_name,
              avatar: replyWithProfile.profiles.avatar_url,
            } : null,
          };
        }),
      };
    }));

    // Get total count
    const { count } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .is('parent_comment_id', null);

    return {
      comments: commentsWithReplies,
      total: count || 0,
    };
  },

  /**
   * Deletes a comment (only by owner)
   */
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to delete comment: ${error.message}`);
    }

    return true;
  },

  /**
   * Follows a user
   */
  async followUser(followerId: string, followingId: string): Promise<void> {
    // Prevent self-follow
    if (followerId === followingId) {
      throw new AppError(ErrorCode.INVALID_INPUT, 'Cannot follow yourself');
    }

    // Check if user exists
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', followingId)
      .single();

    if (!user) {
      throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (existingFollow) {
      // Already following, return success
      return;
    }

    // Create follow relationship using type-safe helper
    const followData: Database['public']['Tables']['follows']['Insert'] = {
      follower_id: followerId,
      following_id: followingId,
    };

    const { error } = await insertRow('follows', followData);
    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to follow user: ${error.message}`);
    }
  },

  /**
   * Unfollows a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to unfollow user: ${error.message}`);
    }
  },

  /**
   * Repost a post (toggle repost/unrepost)
   */
  async repostPost(postId: string, userId: string): Promise<{ reposted: boolean }> {
    // First check if the repost already exists
    const { data: existingRepost, error: checkError } = await supabase
      .from('post_reposts')
      .select('id')
      .eq('original_post_id', postId)
      .eq('reposted_by_user_id', userId)
      .maybeSingle();

    if (checkError) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to check repost status: ${checkError.message}`);
    }

    if (existingRepost) {
      // Remove the repost
      const { error: deleteError } = await supabase
        .from('post_reposts')
        .delete()
        .eq('original_post_id', postId)
        .eq('reposted_by_user_id', userId);

      if (deleteError) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to remove repost: ${deleteError.message}`);
      }

      // Decrement reposts_count
      try {
        // Get current count
        const { data: postData, error: fetchError } = await supabase
          .from('posts')
          .select('reposts_count')
          .eq('id', postId)
          .single() as any;

        if (fetchError || !postData) {
          throw new Error(`Failed to fetch post: ${fetchError?.message || 'unknown'}`);
        }

        // Calculate and update new count
        const newCount = Math.max(0, ((postData as any).reposts_count as number || 0) - 1);
        const updateResult = await (supabase as any)
          .from('posts')
          .update({ reposts_count: newCount } as any)
          .eq('id', postId as any);

        const updateError = (updateResult as any)?.error;
        if (updateError) {
          throw new Error(`Failed to update reposts_count: ${updateError.message}`);
        }
      } catch (error: any) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to decrement reposts: ${error.message}`);
      }

      return { reposted: false };
    } else {
      // Add the repost
      const { error: insertError } = await supabase
        .from('post_reposts')
        .insert([{
          original_post_id: postId,
          reposted_by_user_id: userId,
        }] as any);

      if (insertError) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to create repost: ${insertError.message}`);
      }

      // Increment reposts_count
      try {
        // Get current count
        const { data: postData, error: fetchError } = await supabase
          .from('posts')
          .select('reposts_count')
          .eq('id', postId)
          .single() as any;

        if (fetchError || !postData) {
          throw new Error(`Failed to fetch post: ${fetchError?.message || 'unknown'}`);
        }

        // Calculate and update new count
        const newCount = ((postData as any).reposts_count as number || 0) + 1;
        const updateResult = await (supabase as any)
          .from('posts')
          .update({ reposts_count: newCount } as any)
          .eq('id', postId as any);

        const updateError = (updateResult as any)?.error;
        if (updateError) {
          throw new Error(`Failed to update reposts_count: ${updateError.message}`);
        }
      } catch (error: any) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to increment reposts: ${error.message}`);
      }

      return { reposted: true };
    }
  },

  /**
   * Get user's reposts
   */
  async getUserReposts(userId: string, page: number = 1, limit: number = 20): Promise<{ reposts: any[]; total: number }> {
    const offset = (page - 1) * limit;

    // Get the count
    const { count } = await supabase
      .from('post_reposts')
      .select('*', { count: 'exact', head: true })
      .eq('reposted_by_user_id', userId);

    const total = count || 0;

    // Get the reposts with joined post data
    const { data: reposts, error } = await supabase
      .from('post_reposts')
      .select(`
        id,
        original_post_id,
        reposted_at,
        posts:original_post_id(
          *,
          profiles!posts_user_id_fkey(id, username, full_name, avatar_url)
        )
      `)
      .eq('reposted_by_user_id', userId)
      .order('reposted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get reposts: ${error.message}`);
    }

    return { reposts: reposts || [], total };
  },

  /**
   * Check if user has reposted a post
   */
  async hasUserReposted(postId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('post_reposts')
      .select('id')
      .eq('original_post_id', postId)
      .eq('reposted_by_user_id', userId)
      .maybeSingle();

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to check repost status: ${error.message}`);
    }

    return !!data;
  },

  /**
   * Get follow statistics for a user
   */
  async getFollowStats(targetUserId: string, currentUserId?: string): Promise<{ followersCount: number; followingCount: number; isFollowing: boolean }> {
    // Get followers count
    const { count: followersCount, error: followersError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', targetUserId);

    if (followersError) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get followers count: ${followersError.message}`);
    }

    // Get following count
    const { count: followingCount, error: followingError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', targetUserId);

    if (followingError) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get following count: ${followingError.message}`);
    }

    let isFollowing = false;
    if (currentUserId) {
      const { data: followData, error: followError } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (followError) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to check follow status: ${followError.message}`);
      }
      isFollowing = !!followData;
    }

    return {
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
      isFollowing
    };
  },

  /**
   * Get post count for a user
   */
  async getUserPostCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_public', true);

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get post count: ${error.message}`);
    }

    return count || 0;
  },
};

