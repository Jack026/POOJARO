import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { getCustomerSession, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const store = await getStore();
    const user = await store.getUserById(session.userId);
    
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    return NextResponse.json({ addresses: user.addresses });
  } catch (error) {
    const status = statusForAuthError(error) || 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { addresses } = await req.json();
    if (!Array.isArray(addresses)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const store = await getStore();
    const user = await store.getUserById(session.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    user.addresses = addresses;
    await store.upsertUser(user);
    
    return NextResponse.json({ success: true, addresses: user.addresses });
  } catch (error) {
    const status = statusForAuthError(error) || 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
