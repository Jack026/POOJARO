import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, statusForAuthError } from '@/lib/auth/guards';
import { uploadMediaToSupabase, type AllowedBucket } from '@/lib/supabase/storage';

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce admin authentication & capability
    await requireAdmin('catalogue.write');

    // 2. Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file');
    const bucket = (formData.get('bucket') as AllowedBucket) || 'poojaro-products';
    const folder = (formData.get('folder') as string) || 'catalogue';

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No valid file provided.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Upload with full magic byte, MIME, and size validation
    const result = await uploadMediaToSupabase({
      buffer,
      declaredMimeType: file.type,
      bucket,
      folder,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      url: result.url,
      path: result.path,
    });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) {
      return NextResponse.json({ error: (error as Error).message }, { status });
    }
    console.error('[Storage Upload Error]:', error);
    return NextResponse.json({ error: 'Failed to upload media.' }, { status: 500 });
  }
}

