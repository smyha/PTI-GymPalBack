import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';
import type { Database } from '../types/index.js';

// Create Supabase client for regular operations
export const supabase: SupabaseClient<Database> = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    },
  }
);

// Create Supabase admin client for admin operations
// Create admin client only when service role key is provided; otherwise fallback to regular client
export const supabaseAdmin: SupabaseClient<Database> = env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : supabase;

