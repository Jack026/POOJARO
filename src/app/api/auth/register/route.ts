import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { seal, CUSTOMER_COOKIE, cookieOptions, CUSTOMER_TTL_SECONDS, expiresIn } from '@/lib/auth/session';
import { newId, nowIso } from '@/lib/data/shared';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone } = body;
    
    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Name, email, and phone are required.' }, { status: 400 });
    }

    const store = await getStore();
    const existing = await store.getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const userId = newId('usr');
    const user = await store.upsertUser({
      id: userId,
      name,
      email,
      phone,
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
