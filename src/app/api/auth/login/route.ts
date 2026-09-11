import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { seal, CUSTOMER_COOKIE, cookieOptions, CUSTOMER_TTL_SECONDS, expiresIn } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const store = await getStore();
    const user = await store.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email.' }, { status: 401 });
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
