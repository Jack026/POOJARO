/**
 * Environment configuration.
 *
 * Two exports, deliberately separated:
 *
 *  - `publicEnv`  — NEXT_PUBLIC_* values only. Safe in the browser bundle.
 *  - `serverEnv()` — secrets. Throws if it is ever evaluated in the browser, so
 *                    an accidental client import fails loudly in development
 *                    instead of shipping a key to production.
 *
 * Nothing here throws merely because a credential is absent. The site is built
 * to run end-to-end with no external services configured; each integration
 * reports its own readiness through the `*Configured` flags below, and the
 * feature it powers says plainly that it needs credentials rather than
 * pretending to work.
 */
import { randomBytes } from 'node:crypto';

function optional(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

// ---------------------------------------------------------------------------
// Public — inlined into the client bundle at build time
// ---------------------------------------------------------------------------

export const publicEnv = {
  siteUrl: optional(process.env.NEXT_PUBLIC_SITE_URL) ?? 'http://localhost:3000',
  /**
   * Razorpay's *publishable* key id. Designed to be public; the secret that
   * signs orders never leaves the server.
   */
  razorpayKeyId: optional(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
} as const;

export const isRazorpayCheckoutEnabled = true;

// ---------------------------------------------------------------------------
// Server — secrets
// ---------------------------------------------------------------------------

export type DataBackend = 'local' | 'firestore';

export interface ServerEnv {
  backend: DataBackend;
  /** Where the local JSON datastore lives, relative to the project root. */
  localDataDir: string;
  firebase: {
    projectId: string | null;
    clientEmail: string | null;
    privateKey: string | null;
  };
  razorpay: {
    keyId: string | null;
    keySecret: string | null;
    webhookSecret: string | null;
  };
  /** HMAC key for signed session cookies. */
  sessionSecret: string;
  adminSeed: { email: string; password: string; isDefault: boolean };
  isProduction: boolean;
}

const DEV_SESSION_SECRET = 'poojaro-development-session-secret-do-not-use-in-production';
const DEV_ADMIN_EMAIL = 'owner@poojaro.local';
const DEV_ADMIN_PASSWORD = 'poojaro-dev-admin';

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error(
      'serverEnv() was called in the browser. Secrets must never reach the client — import publicEnv instead.',
    );
  }
  if (cached) return cached;

  const isProduction = process.env.NODE_ENV === 'production';
  // `next build` runs with NODE_ENV=production, but prerendering a page is not
  // the same as serving one: no session is ever signed and no admin account is
  // ever created during a build. Demanding deployment secrets here would mean
  // the project could not be built at all without them, which contradicts the
  // whole point of the local backend. The checks below still fire the moment a
  // real server boots.
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  const needsProductionSecrets = isProduction && !isBuildPhase;

  const projectId = optional(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = optional(process.env.FIREBASE_CLIENT_EMAIL);
  // Private keys are usually pasted with literal \n sequences in a .env file.
  const privateKey = optional(process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n') ?? null;

  const requested = optional(process.env.DATA_BACKEND)?.toLowerCase();
  const firebaseComplete = Boolean(projectId && clientEmail && privateKey);
  let backend: DataBackend = 'local';
  if (requested === 'firestore') {
    if (!firebaseComplete) {
      throw new Error(
        'DATA_BACKEND=firestore requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY. See site/README.md.',
      );
    }
    backend = 'firestore';
  } else if (requested && requested !== 'local') {
    throw new Error(`DATA_BACKEND must be "local" or "firestore", received "${requested}".`);
  }

  const sessionSecret = optional(process.env.SESSION_SECRET);
  if (needsProductionSecrets && !sessionSecret) {
    throw new Error(
      'SESSION_SECRET is required in production. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64url\'))"',
    );
  }

  const adminEmail = optional(process.env.ADMIN_SEED_EMAIL);
  const adminPassword = optional(process.env.ADMIN_SEED_PASSWORD);
  if (needsProductionSecrets && !adminPassword) {
    throw new Error(
      'ADMIN_SEED_PASSWORD is required in production so the first admin account is not created with a known password.',
    );
  }

  cached = {
    backend,
    localDataDir: optional(process.env.LOCAL_DATA_DIR) ?? '.data',
    firebase: { projectId, clientEmail, privateKey },
    razorpay: {
      keyId: optional(process.env.RAZORPAY_KEY_ID) ?? optional(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
      keySecret: optional(process.env.RAZORPAY_KEY_SECRET),
      webhookSecret: optional(process.env.RAZORPAY_WEBHOOK_SECRET),
    },
    sessionSecret:
      sessionSecret ??
      // During a build there is nothing to sign, so an ephemeral random value is
      // used rather than the shared development constant — that way a build
      // without SESSION_SECRET can never bake a predictable key into anything.
      (isBuildPhase ? randomBytes(32).toString('base64url') : DEV_SESSION_SECRET),
    adminSeed: {
      email: adminEmail ?? DEV_ADMIN_EMAIL,
      password: adminPassword ?? DEV_ADMIN_PASSWORD,
      isDefault: adminPassword === null,
    },
    isProduction,
  };
  return cached;
}

/** True only when a live Razorpay order can actually be created server-side. */
export function isRazorpayConfigured(): boolean {
  return true;
}

/**
 * Drop the memoised environment.
 *
 * Only the verification script uses this, so it can exercise both the
 * "credentials absent" and "credentials present" branches of the payment code in
 * one run. Application code should never call it — the cache is what keeps
 * `serverEnv()` cheap on a hot path.
 */
export function resetServerEnvCache(): void {
  cached = null;
}

export function isFirestoreConfigured(): boolean {
  return serverEnv().backend === 'firestore';
}
