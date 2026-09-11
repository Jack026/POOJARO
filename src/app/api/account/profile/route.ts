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
    
    return NextResponse.json({ user });
  } catch (error) {
    const status = statusForAuthError(error) || 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, phone, marketingOptIn } = await req.json();
    
    const store = await getStore();
    const user = await store.getUserById(session.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (marketingOptIn !== undefined) user.marketingOptIn = marketingOptIn;

    await store.upsertUser(user);
    
    return NextResponse.json({ success: true, user });
  } catch (error) {
    const status = statusForAuthError(error) || 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
