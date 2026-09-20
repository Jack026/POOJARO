import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/env';

let adminClient: SupabaseClient | null = null;

/**
 * Privileged Supabase client with service_role key.
 *
 * SERVER ONLY. Never export to client or evaluate in the browser.
 * Used exclusively in server-side datastore operations and protected route handlers.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdminClient() must never be called on the client.');
  }

  if (adminClient) return adminClient;

  const env = serverEnv();
  const url = env.supabase.url ?? 'https://placeholder.supabase.co';
  const key = env.supabase.serviceRoleKey ?? env.supabase.anonKey ?? 'placeholder-key';

  adminClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

