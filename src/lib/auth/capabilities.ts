/**
 * Role-based authorisation for the admin panel (§53).
 *
 * Capabilities, not roles, are what code checks. `can(admin, 'orders.refund')`
 * reads clearly and survives a role being renamed or a fourth role appearing.
 *
 * The rule for adding an admin route: name the capability it needs, add it to
 * the map below, and gate the route with `requireCapability`. Never gate on
 * `role === 'owner'` inline — that scatters the policy across the codebase.
 */
import { ADMIN_CAPABILITIES, type AdminCapability, type AdminRole, type AdminUser } from '../data/types';

/**
 * What each role may do.
 *
 * owner   — everything, including other admins, settings and the audit log.
 * manager — runs the business day to day: catalogue, stock, orders, refunds,
 *           marketing, homepage content and analytics. Cannot add admins,
 *           change store settings, or read the audit log that records them.
 * staff   — fulfilment: sees the catalogue and orders, moves orders along and
 *           adjusts stock. No refunds, no pricing, no customer exports.
 */
const ROLE_CAPABILITIES: Record<AdminRole, readonly AdminCapability[]> = {
  owner: ADMIN_CAPABILITIES,
  manager: [
    'catalogue.read',
    'catalogue.write',
    'inventory.read',
    'inventory.write',
    'orders.read',
    'orders.write',
    'orders.refund',
    'customers.read',
    'marketing.write',
    'content.write',
    'analytics.read',
  ],
  staff: ['catalogue.read', 'inventory.read', 'inventory.write', 'orders.read', 'orders.write'],
};

export const ROLE_LABEL: Record<AdminRole, string> = {
  owner: 'Owner',
  manager: 'Manager',
  staff: 'Staff',
};

export const ROLE_DESCRIPTION: Record<AdminRole, string> = {
  owner: 'Full access, including admin accounts, store settings and the audit log.',
  manager: 'Runs the store: products, stock, orders, refunds, coupons, content and analytics.',
  staff: 'Fulfilment only: view products, adjust stock, and move orders through their stages.',
};

export function capabilitiesFor(role: AdminRole): readonly AdminCapability[] {
  return ROLE_CAPABILITIES[role];
}

/** An inactive admin has no capabilities, whatever their role says. */
export function can(admin: Pick<AdminUser, 'role' | 'isActive'> | null, capability: AdminCapability): boolean {
  if (!admin || !admin.isActive) return false;
  return ROLE_CAPABILITIES[admin.role].includes(capability);
}

export function canAny(
  admin: Pick<AdminUser, 'role' | 'isActive'> | null,
  capabilities: AdminCapability[],
): boolean {
  return capabilities.some((capability) => can(admin, capability));
}

/** Thrown by `requireCapability`; route handlers turn this into a 403. */
export class ForbiddenError extends Error {
  readonly capability: AdminCapability;

  constructor(capability: AdminCapability) {
    super(`This action needs the "${capability}" permission, which your role does not have.`);
    this.name = 'ForbiddenError';
    this.capability = capability;
  }
}

export function requireCapability(
  admin: Pick<AdminUser, 'role' | 'isActive'> | null,
  capability: AdminCapability,
): void {
  if (!can(admin, capability)) throw new ForbiddenError(capability);
}
