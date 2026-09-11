import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('analytics.read');
    const store = await getStore();
    const url = new URL(req.url);

    // Parse date range: accept `from` & `to` ISO strings, or `range` shorthand
    let from = url.searchParams.get('from');
    let to = url.searchParams.get('to');

    if (!from || !to) {
      const range = url.searchParams.get('range') || '30d';
      const days = parseInt(range) || 30;
      const now = new Date();
      to = now.toISOString();
      from = new Date(now.getTime() - days * 86400000).toISOString();
    }

    const analytics = await store.getAnalyticsSummary({ from, to });
    return NextResponse.json(analytics);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}