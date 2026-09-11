import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';
import { hashPassword } from '@/lib/auth/password';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('admins.write');
    const store = await getStore();
    const { id } = await params;
    const body = await req.json();
    
    let updateData = { ...body, id };
    if (body.password) {
      updateData.passwordHash = await hashPassword(body.password);
      delete updateData.password;
    }
    
    const updatedAdmin = await store.upsertAdmin(updateData, actorFor(admin));
    return NextResponse.json(updatedAdmin);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('admins.write');
    const store = await getStore();
    const { id } = await params;
    await store.deleteAdmin(id, actorFor(admin));
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}