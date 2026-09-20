import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { serverEnv } from '@/lib/env';

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = serverEnv();
  const url = env.supabase.url ?? 'https://placeholder.supabase.co';
  const key = env.supabase.anonKey ?? env.supabase.serviceRoleKey ?? 'placeholder-key';

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Ignored if called from a Server Component
        }
      },
    },
  });
}

