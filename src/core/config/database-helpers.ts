/**
 * Database Helper Functions
 * Type-safe wrappers for Supabase operations that avoid 'as never' casts
 */

import type { Database, TableInsert, TableUpdate } from '../types/index.js';
import { supabaseAdmin } from './database.js';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Type-safe insert helper
 * Uses a controlled type assertion that's safer than 'as never'
 */
export async function insertRow<T extends keyof Database['public']['Tables']>(
  tableName: T,
  data: TableInsert<T>,
  client: SupabaseClient<Database> = supabaseAdmin
) {
  // Use provided client (or default to admin/global)
  const insertValue = data as Database['public']['Tables'][T]['Insert'] & Record<string, unknown>;
  return client.from(tableName).insert(insertValue as any).select().single();
}

/**
 * Type-safe update helper
 */
export async function updateRow<T extends keyof Database['public']['Tables']>(
  tableName: T,
  data: TableUpdate<T>,
  filter: (builder: any) => any,
  client: SupabaseClient<Database> = supabaseAdmin
) {
  // Use provided client (or default to admin/global)
  const updateValue = data as Database['public']['Tables'][T]['Update'] & Record<string, unknown>;
  return filter(client.from(tableName).update(updateValue as any)).select().maybeSingle();
}

/**
 * Type-safe upsert helper
 */
export async function upsertRow<T extends keyof Database['public']['Tables']>(
  tableName: T,
  data: TableInsert<T>,
  options?: { onConflict?: string },
  client: SupabaseClient<Database> = supabaseAdmin
) {
  // Use provided client (or default to admin/global)
  const upsertValue = data as Database['public']['Tables'][T]['Insert'] & Record<string, unknown>;
  return client.from(tableName).upsert(upsertValue as any, options).select().maybeSingle();
}

/**
 * Type-safe select helper
 */
export async function selectRow<T extends keyof Database['public']['Tables']>(
  tableName: T,
  filter: (builder: any) => any,
  client: SupabaseClient<Database> = supabaseAdmin
) {
  return filter(client.from(tableName).select()).maybeSingle();
}

/**
 * Type-safe select many helper
 */
export async function selectRows<T extends keyof Database['public']['Tables']>(
  tableName: T,
  filter?: (builder: any) => any,
  client: SupabaseClient<Database> = supabaseAdmin
) {
  const query = client.from(tableName);
  if (filter) {
    return filter(query).select();
  }
  return query.select();
}

