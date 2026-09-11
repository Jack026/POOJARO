import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';
import { hashPassword } from '@/lib/auth/password';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('admins.write');
    const store = await getStore();
    const admins = await store.listAdmins();
    return NextResponse.json(admins);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin('admins.write');
    const store = await getStore();
    const { password, ...body } = await req.json();
    const passwordHash = await hashPassword(password);
    const newAdmin = await store.upsertAdmin({ ...body, passwordHash }, actorFor(admin));
    return NextResponse.json(newAdmin);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}