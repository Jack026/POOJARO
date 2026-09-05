/**
 * Signed session cookies.
 *
 * SERVER ONLY. Sessions are stateless and signed with HMAC-SHA256 over the
 * payload, so a tampered cookie fails verification rather than granting access.
 * There is no session table to keep in sync — the trade is that revocation waits
 * for expiry, which is why the admin TTL is short.
 *
 * Deliberately no `jose`/`jsonwebtoken`: node:crypto covers signing, and this is
 * one file rather than a dependency with its own release cadence (§48).
 *
 * The secret comes from SESSION_SECRET. `serverEnv()` refuses to start in
 * production without it, so a deployment can never fall back to a shared
 * default (§53).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { serverEnv } from '../env';
import type { AdminRole, Id } from '../data/types';

export const ADMIN_COOKIE = 'poojaro_admin';
export const CUSTOMER_COOKIE = 'poojaro_session';

/** Admin sessions are short: a stateless token cannot be revoked before expiry. */
export const ADMIN_TTL_SECONDS = 60 * 60 * 8;
export const CUSTOMER_TTL_SECONDS = 60 * 60 * 24 * 30;

export interface AdminSession {
  kind: 'admin';
  adminId: Id;
  email: string;
  name: string;
  role: AdminRole;
  /** Unix seconds. */
  exp: number;
}

export interface CustomerSession {
  kind: 'customer';
  userId: Id;
  email: string;
  name: string;
  exp: number;
}

export type Session = AdminSession | CustomerSession;

function sign(payload: string): string {
  return createHmac('sha256', serverEnv().sessionSecret).update(payload).digest('base64url');
}

/** `<base64url payload>.<base64url signature>` */
export function seal(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
  return `${payload}.${sign(payload)}`;
}

/**
 * Verify and decode. Returns null for anything not provably ours and current:
 * bad shape, bad signature, or expired. Never throws — a malformed cookie is a
 * logged-out visitor, not a server error.
 */
export function unseal(token: string | undefined | null): Session | null {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  let provided: Buffer;
  let expected: Buffer;
  try {
    provided = Buffer.from(signature, 'base64url');
    expected = Buffer.from(sign(payload), 'base64url');
  } catch {
    return null;
  }
  // Compare lengths first: timingSafeEqual throws on a mismatch.
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  let session: Session;
  try {
    session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Session;
  } catch {
    return null;
  }

  if (typeof session?.exp !== 'number' || session.exp * 1000 <= Date.now()) return null;
  if (session.kind !== 'admin' && session.kind !== 'customer') return null;
  return session;
}

export function expiresIn(seconds: number): number {
  return Math.floor(Date.now() / 1000) + seconds;
}

export interface CookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  maxAge: number;
}

/**
 * `sameSite: 'lax'` rather than 'strict' so a shopper following an emailed order
 * link is not silently logged out. `httpOnly` keeps the token out of reach of
 * any script on the page.
 */
export function cookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure: serverEnv().isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}

/** maxAge 0 clears the cookie. */
export function clearedCookieOptions(): CookieOptions {
  return cookieOptions(0);
}
