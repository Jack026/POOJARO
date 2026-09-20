import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, statusForAuthError } from '@/lib/auth/guards';
import { listBucketFiles, deleteBucketFile } from '@/lib/supabase/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bucketId: string }> }
) {
  try {
    await requireAdmin('catalogue.read');
    const { bucketId } = await params;
    const url = new URL(req.url);
    const folder = url.searchParams.get('folder') || '';
    const search = url.searchParams.get('search') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const result = await listBucketFiles(bucketId, folder, limit, offset, search);
    return NextResponse.json(result);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    console.error('[Admin Storage Files GET error]:', error);
    return NextResponse.json({ error: 'Failed to list bucket files.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ bucketId: string }> }
) {
  try {
    await requireAdmin('catalogue.write');
    const { bucketId } = await params;
    const url = new URL(req.url);
    const filePath = url.searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'File path query parameter is required.' }, { status: 400 });
    }

    const result = await deleteBucketFile(bucketId, filePath);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, deletedPath: filePath });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    console.error('[Admin Storage File DELETE error]:', error);
    return NextResponse.json({ error: 'Failed to delete file from bucket.' }, { status: 500 });
  }
}
