import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { verifyPassword } from '@/lib/auth/password';
import { seal, ADMIN_COOKIE, cookieOptions, ADMIN_TTL_SECONDS, type AdminSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const store = await getStore();
    const admin = await store.getAdminByEmail(email);
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const session: AdminSession = {
      kind: 'admin',
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      exp: Math.floor(Date.now() / 1000) + ADMIN_TTL_SECONDS
    };

    const token = await seal(session);
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, token, cookieOptions(ADMIN_TTL_SECONDS));

    await store.recordAdminLogin(admin.id);

    const { passwordHash, ...adminInfo } = admin;
    return NextResponse.json(adminInfo);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}