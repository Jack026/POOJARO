import { randomUUID } from 'node:crypto';
import { getSupabaseAdminClient } from './admin';

export const ALLOWED_BUCKETS = ['poojaro-products', 'poojaro-banners', 'poojaro-media'] as const;
export type AllowedBucket = (typeof ALLOWED_BUCKETS)[number];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

/**
 * Validates the file buffer's magic bytes to prevent renamed malicious payloads (.exe, .php disguised as .jpg).
 */
export function verifyImageMagicBytes(buffer: Buffer): { isValid: boolean; detectedMime?: string } {
  if (buffer.length < 12) return { isValid: false };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedMime: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, detectedMime: 'image/png' };
  }

  // WebP: RIFF ... WEBP (52 49 46 46 .... 57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { isValid: true, detectedMime: 'image/webp' };
  }

  // AVIF: contains ftypavif or ftypavis in first 24 bytes
  const headerStr = buffer.subarray(4, 24).toString('ascii');
  if (headerStr.includes('ftypavif') || headerStr.includes('ftypavis')) {
    return { isValid: true, detectedMime: 'image/avif' };
  }

  return { isValid: false };
}

export interface UploadResult {
  ok: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Securely uploads a validated image to Supabase Storage using a random UUID filename.
 */
export async function uploadMediaToSupabase({
  buffer,
  declaredMimeType,
  bucket = 'poojaro-products',
  folder = 'uploads',
}: {
  buffer: Buffer;
  declaredMimeType: string;
  bucket?: AllowedBucket;
  folder?: string;
}): Promise<UploadResult> {
  // 1. Bucket whitelist validation
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return { ok: false, error: `Invalid storage bucket. Allowed: ${ALLOWED_BUCKETS.join(', ')}` };
  }

  // 2. File size enforcement
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: `File exceeds maximum allowed size of 5 MB.` };
  }

  // 3. MIME type check
  if (!ALLOWED_MIME_TYPES.has(declaredMimeType)) {
    return { ok: false, error: 'Only JPG, PNG, WebP, and AVIF image formats are allowed.' };
  }

  // 4. Magic bytes security check
  const magicCheck = verifyImageMagicBytes(buffer);
  if (!magicCheck.isValid || magicCheck.detectedMime !== declaredMimeType) {
    return { ok: false, error: 'File signature does not match declared image format.' };
  }

  // 5. Generate collision-proof randomized filename (prevents directory traversal attacks)
  const extension = MIME_EXTENSION_MAP[magicCheck.detectedMime] ?? 'jpg';
  const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `${randomUUID()}.${extension}`;
  const filePath = cleanFolder ? `${cleanFolder}/${fileName}` : fileName;

  const adminClient = getSupabaseAdminClient();

  const { data, error } = await adminClient.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: magicCheck.detectedMime,
      cacheControl: '31536000', // 1 year immutable cache
      upsert: false,
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  const { data: urlData } = adminClient.storage.from(bucket).getPublicUrl(data.path);

  return {
    ok: true,
    url: urlData.publicUrl,
    path: data.path,
  };
}

// ---------------------------------------------------------------------------
// Bucket Management & File Operations
// ---------------------------------------------------------------------------

export interface SupabaseBucketInfo {
  id: string;
  name: string;
  public: boolean;
  fileSizeLimit?: number | null;
  allowedMimeTypes?: string[] | null;
  createdAt: string;
  updatedAt: string;
  isAnalytics?: boolean;
}

export async function listSupabaseBuckets(): Promise<SupabaseBucketInfo[]> {
  const adminClient = getSupabaseAdminClient();
  const { data, error } = await adminClient.storage.listBuckets();
  if (error) {
    throw new Error(`Failed to list buckets: ${error.message}`);
  }
  return (data || []).map((b) => ({
    id: b.id,
    name: b.name,
    public: b.public,
    fileSizeLimit: b.file_size_limit,
    allowedMimeTypes: b.allowed_mime_types,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    isAnalytics:
      b.id.includes('analytic') ||
      b.name.includes('analytic') ||
      b.id.includes('lake') ||
      b.id.includes('log'),
  }));
}

export async function createSupabaseBucket({
  id,
  isPublic = true,
  isAnalytics = false,
  fileSizeLimit = 10 * 1024 * 1024,
  allowedMimeTypes,
}: {
  id: string;
  isPublic?: boolean;
  isAnalytics?: boolean;
  fileSizeLimit?: number;
  allowedMimeTypes?: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const adminClient = getSupabaseAdminClient();
  const cleanId = id.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const { error } = await adminClient.storage.createBucket(cleanId, {
    public: isPublic,
    fileSizeLimit,
    allowedMimeTypes:
      allowedMimeTypes ||
      (isAnalytics ? undefined : ['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  });

  if (error && !error.message.includes('already exists')) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export interface BucketFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  publicUrl: string;
}

export async function listBucketFiles(
  bucket: string,
  folder = '',
  limit = 100,
  offset = 0,
  search?: string
): Promise<{ files: BucketFile[]; total: number }> {
  const adminClient = getSupabaseAdminClient();
  const { data, error } = await adminClient.storage.from(bucket).list(folder, {
    limit,
    offset,
    search,
    sortBy: { column: 'created_at', order: 'desc' },
  });

  if (error) {
    throw new Error(`Failed to list files in ${bucket}: ${error.message}`);
  }

  const files: BucketFile[] = (data || [])
    .filter((f) => f.name !== '.emptyFolderPlaceholder')
    .map((f) => {
      const filePath = folder ? `${folder}/${f.name}` : f.name;
      const { data: urlData } = adminClient.storage.from(bucket).getPublicUrl(filePath);
      return {
        id: f.id || f.name,
        name: f.name,
        size: f.metadata?.size || 0,
        mimeType: f.metadata?.mimetype || 'application/octet-stream',
        createdAt: f.created_at || new Date().toISOString(),
        updatedAt: f.updated_at || new Date().toISOString(),
        publicUrl: urlData.publicUrl,
      };
    });

  return { files, total: files.length };
}

export async function deleteBucketFile(
  bucket: string,
  path: string
): Promise<{ ok: boolean; error?: string }> {
  const adminClient = getSupabaseAdminClient();
  const { error } = await adminClient.storage.from(bucket).remove([path]);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function exportEventsToAnalyticsBucket(): Promise<{
  ok: boolean;
  count: number;
  error?: string;
  fileUrl?: string;
}> {
  const adminClient = getSupabaseAdminClient();
  const bucketId = 'poojaro-analytics';

  // Ensure analytics bucket exists
  await adminClient.storage.createBucket(bucketId, {
    public: false,
    fileSizeLimit: 50 * 1024 * 1024,
  });

  // Query events from PostgreSQL analytics_events table
  const { data: events, error } = await adminClient
    .from('analytics_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) {
    return { ok: false, count: 0, error: error.message };
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `events/events-dump-${timestamp}.json`;
  const jsonBuffer = Buffer.from(JSON.stringify(events || [], null, 2), 'utf-8');

  const { data: uploadData, error: uploadError } = await adminClient.storage
    .from(bucketId)
    .upload(fileName, jsonBuffer, {
      contentType: 'application/json',
      upsert: true,
    });

  if (uploadError) {
    return { ok: false, count: 0, error: uploadError.message };
  }

  return {
    ok: true,
    count: (events || []).length,
    fileUrl: uploadData?.path,
  };
}


