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
    const user = await store.getUserById(session.userId);
    
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
