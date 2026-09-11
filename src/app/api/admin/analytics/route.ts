import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('analytics.read');
    const store = await getStore();
    const url = new URL(req.url);
    const range = url.searchParams.get('range') || 'last_30_days';
    const analytics = await store.getAnalyticsSummary(range as any);
    return NextResponse.json(analytics);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}