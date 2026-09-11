import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('marketing.write');
    const store = await getStore();
    const { id } = await params;
    const body = await req.json();
    const rule = await store.upsertRecommendationRule({ ...body, id }, actorFor(admin));
    return NextResponse.json(rule);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('marketing.write');
    const store = await getStore();
    const { id } = await params;
    await store.deleteRecommendationRule(id, actorFor(admin));
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}