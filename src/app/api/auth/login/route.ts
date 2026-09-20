import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { seal, CUSTOMER_COOKIE, cookieOptions, CUSTOMER_TTL_SECONDS, expiresIn } from '@/lib/auth/session';
import { isSupabaseConfigured } from '@/lib/env';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const store = await getStore();
    let user = await store.getUserByEmail(cleanEmail);

    if (isSupabaseConfigured()) {
      if (password) {
        const ssrClient = await getSupabaseServerClient();
        const { data: authData, error: authError } = await ssrClient.auth.signInWithPassword({
          email: cleanEmail,
          password: String(password),
        });

        if (authError) {
          return NextResponse.json(
            { error: authError.message || 'Invalid email or password.' },
            { status: 401 }
          );
        }

        // Sync or retrieve user in datastore
        if (!user && authData.user) {
          user = await store.upsertUser({
            id: authData.user.id,
            name: (authData.user.user_metadata?.name as string) || cleanEmail.split('@')[0] || 'Devotee',
            email: cleanEmail,
            phone: (authData.user.user_metadata?.phone as string) || '',
            addresses: [],
            wishlist: [],
            recentlyViewed: [],
            marketingOptIn: false,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        // Passwordless check for demo / OTP login mode
        if (!user) {
          return NextResponse.json({ error: 'No account found with this email.' }, { status: 401 });
        }
      }
    } else {
      if (!user) {
        return NextResponse.json({ error: 'No account found with this email.' }, { status: 401 });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email.' }, { status: 401 });
    }

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
    console.error('[auth/login error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
