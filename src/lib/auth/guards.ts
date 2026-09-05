/**
 * Reading the current session inside a request.
 *
 * SERVER ONLY. Everything here touches `next/headers`, so it works in server
 * components, route handlers and server actions — never in a client component.
 *
 * The shape to follow in admin code:
 *
 *     const admin = await requireAdmin('catalogue.write');
 *     await store.upsertProduct(product, actorFor(admin));
 *
 * `requireAdmin` throws on a missing session or a missing capability, so a route
 * cannot forget the check and still compile a working page.
 */
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, CUSTOMER_COOKIE, unseal, type AdminSession, type CustomerSession } from './session';
import { ForbiddenError, requireCapability } from './capabilities';
import type { Actor } from '../data/store';
import type { AdminCapability, AdminUser } from '../data/types';

export class UnauthenticatedError extends Error {
  constructor(message = 'Please sign in to continue.') {
    super(message);
    this.name = 'UnauthenticatedError';
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const session = unseal(jar.get(ADMIN_COOKIE)?.value);
  return session?.kind === 'admin' ? session : null;
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const jar = await cookies();
  const session = unseal(jar.get(CUSTOMER_COOKIE)?.value);
  return session?.kind === 'customer' ? session : null;
}

/**
 * The admin for this request, or a throw.
 *
 * Pass the capability the operation needs. Omitting it authenticates without
 * authorising, which is right only for the admin shell itself — any route that
 * reads or writes business data should name its capability.
 */
export async function requireAdmin(capability?: AdminCapability): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new UnauthenticatedError('Your admin session has expired. Please sign in again.');
  if (capability) {
    requireCapability({ role: session.role, isActive: true }, capability);
  }
  return session;
}

export async function requireCustomer(): Promise<CustomerSession> {
  const session = await getCustomerSession();
  if (!session) throw new UnauthenticatedError();
  return session;
}

/** Session → the `Actor` the datastore stamps onto ledger and audit rows. */
export function actorFor(session: AdminSession | CustomerSession): Actor {
  return session.kind === 'admin'
    ? { id: session.adminId, name: session.name, kind: 'admin' }
    : { id: session.userId, name: session.name, kind: 'customer' };
}

export function adminToSessionFields(admin: AdminUser): Omit<AdminSession, 'kind' | 'exp'> {
  return { adminId: admin.id, email: admin.email, name: admin.name, role: admin.role };
}

/** Maps an auth failure to an HTTP status, so route handlers stay uniform. */
export function statusForAuthError(error: unknown): number | null {
  if (error instanceof UnauthenticatedError) return 401;
  if (error instanceof ForbiddenError) return 403;
  return null;
}
