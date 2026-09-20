import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getStore } from '@/lib/data';
import { seal, CUSTOMER_COOKIE, cookieOptions, CUSTOMER_TTL_SECONDS, expiresIn } from '@/lib/auth/session';
import { nowIso } from '@/lib/data/shared';

/**
 * Supabase OAuth Callback Handler
 *
 * Handles the OAuth exchange after Google sign-in.
 * 1. Exchanges the one-time authorization code for Supabase SSR session tokens.
 * 2. Syncs or creates the customer profile in the datastore (public.users) with auth.uid().
 * 3. Sets the signed application CUSTOMER_COOKIE for unified session management.
 * 4. Redirects safely back to the user's intended destination (e.g. /account, /checkout).
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const returnTo = searchParams.get('returnTo') || '/account';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Prevent open redirect attacks: ensure path is relative
  const safeReturnTo = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/account';

  if (error) {
    console.error('[auth/callback] OAuth provider error:', error, errorDescription);
    const msg = errorDescription || error || 'Google sign-in was canceled or encountered an error.';
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`);
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('No authorization code was provided by Google.')}`
    );
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data.user) {
      console.error('[auth/callback] Code exchange failed:', exchangeError);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(
          exchangeError?.message || 'Failed to exchange authorization code for session.'
        )}`
      );
    }

    const authUser = data.user;
    const email = authUser.email?.toLowerCase();
    if (!email) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('No email address provided by your Google account.')}`
      );
    }

    const meta = authUser.user_metadata || {};
    const name =
      (meta.full_name as string) ||
      (meta.name as string) ||
      (meta.given_name ? `${meta.given_name} ${meta.family_name || ''}`.trim() : null) ||
      email.split('@')[0] ||
      'Devotee';
    const phone = (meta.phone as string) || '';

    // Synchronize customer profile into public.users
    const store = await getStore();
    let user = await store.getUserById(authUser.id);
    if (!user) {
      user = await store.getUserByEmail(email);
    }

    if (!user) {
      user = await store.upsertUser({
        id: authUser.id,
        name,
        email,
        phone,
        addresses: [],
        wishlist: [],
        recentlyViewed: [],
        marketingOptIn: true,
        createdAt: nowIso(),
      });
    } else if (user.id !== authUser.id) {
      // Ensure the ID matches Supabase auth.uid() for Row Level Security policies
      user = await store.upsertUser({
        ...user,
        id: authUser.id,
        name: user.name || name,
      });
    }

    // Seal customer cookie session
    const exp = expiresIn(CUSTOMER_TTL_SECONDS);
    const session = seal({
      kind: 'customer',
      userId: user.id,
      email: user.email,
      name: user.name,
      exp,
    });

    const redirectResponse = NextResponse.redirect(`${origin}${safeReturnTo}`);
    redirectResponse.cookies.set(CUSTOMER_COOKIE, session, cookieOptions(CUSTOMER_TTL_SECONDS));
    return redirectResponse;
  } catch (err) {
    console.error('[auth/callback] Unexpected error:', err);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('An unexpected error occurred during Google sign-in.')}`
    );
  }
}
