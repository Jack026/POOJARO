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

