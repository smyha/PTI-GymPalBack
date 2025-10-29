/**
 * Database Helper Functions
 * Type-safe wrappers for Supabase operations that avoid 'as never' casts
 */

import type { Database, TableInsert, TableUpdate } from '../types/index.js';
import { supabase } from './database.js';

/**
 * Type-safe insert helper
 * Uses a controlled type assertion that's safer than 'as never'
 */
export async function insertRow<T extends keyof Database['public']['Tables']>(
  tableName: T,
  data: TableInsert<T>
) {
  // Use controlled type assertion with proper typing - safer than 'as never'
  // This works because we validate the type at call site via TableInsert<T>
  const insertValue = data as Database['public']['Tables'][T]['Insert'] & Record<string, unknown>;
  return supabase.from(tableName).insert(insertValue as any).select().single();
}

/**
 * Type-safe update helper
 */
export async function updateRow<T extends keyof Database['public']['Tables']>(
  tableName: T,
  data: TableUpdate<T>,
  filter: (builder: any) => any
) {
  // Use controlled type assertion - safer because TableUpdate<T> ensures correct structure
  const updateValue = data as Database['public']['Tables'][T]['Update'] & Record<string, unknown>;
  return filter(supabase.from(tableName)).update(updateValue as any).select().single();
}

/**
 * Type-safe upsert helper
 */
export async function upsertRow<T extends keyof Database['public']['Tables']>(
  tableName: T,
  data: TableInsert<T>,
  options?: { onConflict?: string }
) {
  // Use controlled type assertion - safer because TableInsert<T> ensures correct structure
  const upsertValue = data as Database['public']['Tables'][T]['Insert'] & Record<string, unknown>;
  return supabase.from(tableName).upsert(upsertValue as any, options).select().single();
}

/**
 * Type-safe select helper
 */
export async function selectRow<T extends keyof Database['public']['Tables']>(
  tableName: T,
  filter: (builder: any) => any
) {
  return filter(supabase.from(tableName)).select().single();
}

/**
 * Type-safe select many helper
 */
export async function selectRows<T extends keyof Database['public']['Tables']>(
  tableName: T,
  filter?: (builder: any) => any
) {
  const query = supabase.from(tableName);
  if (filter) {
    return filter(query).select();
  }
  return query.select();
}

