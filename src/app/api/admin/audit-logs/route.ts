import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('audit.read');
    const store = await getStore();
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const logs = await store.listAuditLogs(query);
    return NextResponse.json(logs);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}