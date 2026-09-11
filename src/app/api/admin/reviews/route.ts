import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('content.write');
    const store = await getStore();
    const reviews = await store.listReviews(undefined, 'any');
    return NextResponse.json(reviews);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}