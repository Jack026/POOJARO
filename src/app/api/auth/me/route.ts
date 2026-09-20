import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { getCustomerSession } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const store = await getStore();
    let user = await store.getUserById(session.userId);
    if (!user && session.email) {
      user = await store.getUserByEmail(session.email);
    }
    
    return NextResponse.json({ user, session });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
