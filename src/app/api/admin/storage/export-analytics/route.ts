import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, statusForAuthError } from '@/lib/auth/guards';
import { exportEventsToAnalyticsBucket } from '@/lib/supabase/storage';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin('analytics.read');
    const result = await exportEventsToAnalyticsBucket();

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      exportedEvents: result.count,
      path: result.fileUrl,
      bucket: 'poojaro-analytics',
    });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    console.error('[Export Analytics Bucket error]:', error);
    return NextResponse.json({ error: 'Failed to export analytics events to bucket.' }, { status: 500 });
  }
}
