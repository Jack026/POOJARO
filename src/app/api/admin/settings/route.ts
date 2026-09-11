import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';
import { paymentReadiness } from '@/lib/domain/payments';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('settings.write');
    const store = await getStore();
    const settings = await store.getSettings();
    const readiness = paymentReadiness();
    return NextResponse.json({ settings, readiness });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin('settings.write');
    const store = await getStore();
    const body = await req.json();
    const settings = await store.updateSettings(body, actorFor(admin));
    return NextResponse.json(settings);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}