import { NextRequest, NextResponse } from 'next/server';
import { CUSTOMER_COOKIE, clearedCookieOptions } from '@/lib/auth/session';
import { isSupabaseConfigured } from '@/lib/env';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await getSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // Non-fatal
    }
  }

  const isHtml = req.headers.get('accept')?.includes('text/html');
  const response = isHtml
    ? NextResponse.redirect(new URL('/login', req.url))
    : NextResponse.json({ success: true });

  response.cookies.set(CUSTOMER_COOKIE, '', clearedCookieOptions());
  return response;
}
