import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, clearedCookieOptions } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, '', clearedCookieOptions());
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}