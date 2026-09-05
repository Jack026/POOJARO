/**
 * Password hashing for admin accounts.
 *
 * SERVER ONLY — never import this from a client component. It uses node:crypto
 * scrypt rather than pulling in bcrypt, so there is no native dependency and no
 * extra package to audit.
 *
 * Format: scrypt$<n>$<salt-b64url>$<key-b64url>. The version field means the
 * cost parameters can be raised later without invalidating existing hashes.
 */
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const VERSION = 1;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scrypt(plain.normalize('NFKC'), salt, KEY_LENGTH);
  return `scrypt$${VERSION}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'scrypt') return false;

  const saltPart = parts[2];
  const keyPart = parts[3];
  if (!saltPart || !keyPart) return false;

  let expected: Buffer;
  try {
    expected = Buffer.from(keyPart, 'base64url');
  } catch {
    return false;
  }
  if (expected.length !== KEY_LENGTH) return false;

  const actual = await scrypt(plain.normalize('NFKC'), Buffer.from(saltPart, 'base64url'), KEY_LENGTH);
  // Constant-time: a length check alone would leak, and === would leak timing.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
