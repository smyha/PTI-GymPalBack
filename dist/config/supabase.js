import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';
// ============================================================================
// SUPABASE CLIENTS
// ============================================================================
/**
 * Supabase client for client-side operations (with anon key)
 * Used for user-facing operations that require authentication
 *
 * @ts-ignore - Database types cause complex inference issues, using any for now
 */
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});
/**
 * Supabase admin client for server-side operations (with service role key)
 * Used for administrative operations that bypass RLS
 *
 * @ts-ignore - Database types cause complex inference issues, using any for now
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
