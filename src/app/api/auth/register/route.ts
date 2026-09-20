import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { seal, CUSTOMER_COOKIE, cookieOptions, CUSTOMER_TTL_SECONDS, expiresIn } from '@/lib/auth/session';
import { newId, nowIso } from '@/lib/data/shared';
import { isSupabaseConfigured } from '@/lib/env';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password } = body;
    
    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Name, email, and phone are required.' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = String(phone).trim();
    const cleanName = String(name).trim();

    const store = await getStore();
    const existing = await store.getUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    let userId = newId('usr');

    if (isSupabaseConfigured()) {
      try {
        const adminClient = getSupabaseAdminClient();
        
        // 1. Create user in Supabase Auth
        const { data: sbData, error: sbError } = await adminClient.auth.admin.createUser({
          email: cleanEmail,
          password: password ? String(password) : undefined,
          email_confirm: true,
          user_metadata: { name: cleanName, phone: cleanPhone },
        });

        if (sbError) {
          if (sbError.message.includes('already') || sbError.status === 422) {
            return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
          }
          return NextResponse.json({ error: sbError.message }, { status: 400 });
        }

        if (sbData.user) {
          userId = sbData.user.id;
        }

        // 2. Sign in to establish Supabase SSR cookies in browser
        if (password) {
          const ssrClient = await getSupabaseServerClient();
          await ssrClient.auth.signInWithPassword({
            email: cleanEmail,
            password: String(password),
          });
        }
      } catch (sbErr) {
        console.warn('[supabase] Customer registration notice:', (sbErr as Error).message);
      }
    }

    // 3. Upsert user in datastore (in public.users table in Supabase)
    const user = await store.upsertUser({
      id: userId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      addresses: [],
      wishlist: [],
      recentlyViewed: [],
      marketingOptIn: false,
      createdAt: nowIso(),
    });

    const exp = expiresIn(CUSTOMER_TTL_SECONDS);
    const session = seal({
      kind: 'customer',
      userId: user.id,
      email: user.email,
      name: user.name,
      exp,
    });

    const response = NextResponse.json({ user });
    response.cookies.set(CUSTOMER_COOKIE, session, cookieOptions(CUSTOMER_TTL_SECONDS));
    return response;
  } catch (error) {
    console.error('[auth/register error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
