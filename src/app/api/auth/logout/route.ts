import { NextRequest, NextResponse } from 'next/server';
import { CUSTOMER_COOKIE, clearedCookieOptions } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.set(CUSTOMER_COOKIE, '', clearedCookieOptions());
  return response;
}
