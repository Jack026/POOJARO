import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/guards';
import { getStore } from '@/lib/data';

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const store = await getStore();
    const admin = await store.getAdminById(session.adminId);
    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { passwordHash, ...adminInfo } = admin;
    return NextResponse.json(adminInfo);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
