import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, statusForAuthError } from '@/lib/auth/guards';
import { listSupabaseBuckets, createSupabaseBucket } from '@/lib/supabase/storage';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('catalogue.read');
    const buckets = await listSupabaseBuckets();
    return NextResponse.json({ buckets });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    console.error('[Admin Storage Buckets GET error]:', error);
    return NextResponse.json({ error: 'Failed to list storage buckets.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin('catalogue.write');
    const body = await req.json();
    const { id, isPublic, isAnalytics, fileSizeLimit } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Bucket ID is required.' }, { status: 400 });
    }

    const result = await createSupabaseBucket({
      id,
      isPublic: Boolean(isPublic),
      isAnalytics: Boolean(isAnalytics),
      fileSizeLimit: fileSizeLimit ? Number(fileSizeLimit) : undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, bucketId: id.toLowerCase().replace(/[^a-z0-9_-]/g, '-') });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    console.error('[Admin Storage Buckets POST error]:', error);
    return NextResponse.json({ error: 'Failed to create storage bucket.' }, { status: 500 });
  }
}
