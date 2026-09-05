/**
 * Delivery estimates and pincode checking.
 *
 * What this does honestly: validates a PIN code's format, maps it to a state and
 * zone from the offline India Post prefix allocation, and returns a delivery
 * window from the store's own configured lead times.
 *
 * What it does NOT do: tell you whether a courier will actually serve that
 * address today. That needs a live serviceability API (Delhivery, Shiprocket,
 * Blue Dart), which is a credentialed integration — see `checkServiceability`
 * below and SHIPPING_PROVIDER_API_KEY in .env.example. Until that is
 * configured, the UI must say "estimated", not "guaranteed" (§64).
 */
import { addBusinessDays, isValidPincode } from '../format';
import type { Settings } from '../data/types';

export type ShippingZone = 'metro' | 'north' | 'south' | 'east' | 'west' | 'central' | 'north-east';

interface PrefixRange {
  /** Inclusive first two or three digits of the PIN. */
  from: number;
  to: number;
  state: string;
  zone: ShippingZone;
}

/**
 * India Post allocates PIN codes by region, and the first two digits identify
 * the circle. This table is the public allocation — it is stable, offline, and
 * costs nothing, which is why the pincode field can answer instantly.
 */
const PREFIXES: PrefixRange[] = [
  { from: 11, to: 11, state: 'Delhi', zone: 'metro' },
  { from: 12, to: 13, state: 'Haryana', zone: 'north' },
  { from: 14, to: 16, state: 'Punjab', zone: 'north' },
  { from: 17, to: 17, state: 'Himachal Pradesh', zone: 'north' },
  { from: 18, to: 19, state: 'Jammu & Kashmir', zone: 'north' },
  { from: 20, to: 28, state: 'Uttar Pradesh', zone: 'central' },
  { from: 30, to: 34, state: 'Rajasthan', zone: 'west' },
  { from: 36, to: 39, state: 'Gujarat', zone: 'west' },
  { from: 40, to: 40, state: 'Maharashtra', zone: 'metro' },
  { from: 41, to: 44, state: 'Maharashtra', zone: 'west' },
  { from: 45, to: 48, state: 'Madhya Pradesh', zone: 'central' },
  { from: 49, to: 49, state: 'Chhattisgarh', zone: 'central' },
  { from: 50, to: 50, state: 'Telangana', zone: 'metro' },
  { from: 51, to: 53, state: 'Andhra Pradesh', zone: 'south' },
  { from: 56, to: 56, state: 'Karnataka', zone: 'metro' },
  { from: 57, to: 59, state: 'Karnataka', zone: 'south' },
  { from: 60, to: 60, state: 'Tamil Nadu', zone: 'metro' },
  { from: 61, to: 64, state: 'Tamil Nadu', zone: 'south' },
  { from: 67, to: 69, state: 'Kerala', zone: 'south' },
  { from: 70, to: 70, state: 'West Bengal', zone: 'metro' },
  { from: 71, to: 74, state: 'West Bengal', zone: 'east' },
  { from: 75, to: 77, state: 'Odisha', zone: 'east' },
  { from: 78, to: 78, state: 'Assam', zone: 'north-east' },
  { from: 79, to: 79, state: 'Arunachal Pradesh', zone: 'north-east' },
  { from: 80, to: 85, state: 'Bihar & Jharkhand', zone: 'east' },
];

/** Extra business days on top of the store's base window, by zone. */
const ZONE_DELAY: Record<ShippingZone, number> = {
  metro: 0,
  north: 1,
  west: 1,
  south: 1,
  central: 2,
  east: 2,
  'north-east': 4,
};

const ZONE_LABEL: Record<ShippingZone, string> = {
  metro: 'Metro',
  north: 'North India',
  south: 'South India',
  east: 'East India',
  west: 'West India',
  central: 'Central India',
  'north-east': 'North-East India',
};

export interface PincodeLookup {
  pincode: string;
  state: string;
  zone: ShippingZone;
  zoneLabel: string;
}

export function lookupPincode(input: string): PincodeLookup | null {
  const pincode = input.trim();
  if (!isValidPincode(pincode)) return null;
  const prefix = Number(pincode.slice(0, 2));
  const match = PREFIXES.find((range) => prefix >= range.from && prefix <= range.to);
  if (!match) return null;
  return { pincode, state: match.state, zone: match.zone, zoneLabel: ZONE_LABEL[match.zone] };
}

export type DeliveryCheckStatus = 'deliverable' | 'not-served' | 'invalid';

export interface DeliveryCheck {
  status: DeliveryCheckStatus;
  message: string;
  pincode: string;
  state: string | null;
  zoneLabel: string | null;
  /** ISO dates bounding the estimated window; null when not deliverable. */
  from: string | null;
  to: string | null;
  /**
   * False while no courier API is configured. The UI must present the window as
   * an estimate, never as a confirmed promise, when this is false.
   */
  isLiveEstimate: boolean;
}

/**
 * Estimated delivery for a pincode, using the store's own configured lead times
 * and the blocked-prefix list an admin maintains in Settings.
 */
export function checkDelivery(input: string, settings: Settings, now: Date = new Date()): DeliveryCheck {
  const pincode = input.trim();
  const base: Omit<DeliveryCheck, 'status' | 'message'> = {
    pincode,
    state: null,
    zoneLabel: null,
    from: null,
    to: null,
    isLiveEstimate: false,
  };

  const lookup = lookupPincode(pincode);
  if (!lookup) {
    return {
      ...base,
      status: 'invalid',
      message: 'That does not look like a valid 6-digit PIN code.',
    };
  }

  if (settings.blockedPincodePrefixes.some((prefix) => pincode.startsWith(prefix))) {
    return {
      ...base,
      status: 'not-served',
      state: lookup.state,
      zoneLabel: lookup.zoneLabel,
      message: `We are not delivering to ${pincode} at the moment. Write to ${settings.supportEmail} and we will see what we can do.`,
    };
  }

  const delay = ZONE_DELAY[lookup.zone];
  const from = addBusinessDays(now, settings.deliveryDaysMin + delay);
  const to = addBusinessDays(now, settings.deliveryDaysMax + delay);

  return {
    status: 'deliverable',
    pincode,
    state: lookup.state,
    zoneLabel: lookup.zoneLabel,
    from: from.toISOString(),
    to: to.toISOString(),
    isLiveEstimate: false,
    message: `Delivers to ${lookup.state}`,
  };
}

// ---------------------------------------------------------------------------
// Live courier serviceability — integration point, not an implementation
// ---------------------------------------------------------------------------

export interface ServiceabilityResult {
  configured: boolean;
  serviceable: boolean | null;
  courier: string | null;
  etaDays: number | null;
  codAvailable: boolean | null;
  message: string;
}

export function isShippingProviderConfigured(): boolean {
  return Boolean(process.env.SHIPPING_PROVIDER_API_KEY && process.env.SHIPPING_PROVIDER);
}

/**
 * Ask the configured courier whether it serves a pincode.
 *
 * There is no provider wired up yet, and this deliberately does not fake one. It
 * returns `configured: false` so callers fall back to `checkDelivery`, which is
 * honest about being an estimate. To make it live:
 *
 *   1. Set SHIPPING_PROVIDER (delhivery | shiprocket) and
 *      SHIPPING_PROVIDER_API_KEY in the server environment.
 *   2. Implement the branch below against that provider's pincode API.
 *   3. Return `isLiveEstimate: true` from the calling route so the UI can drop
 *      the "estimated" qualifier.
 */
export async function checkServiceability(pincode: string): Promise<ServiceabilityResult> {
  if (!isShippingProviderConfigured()) {
    return {
      configured: false,
      serviceable: null,
      courier: null,
      etaDays: null,
      codAvailable: null,
      message: 'No courier API is configured, so delivery dates are estimates from the store settings.',
    };
  }

  // A provider is configured but no adapter has been written for it. Saying so
  // is better than silently returning a made-up "yes".
  return {
    configured: true,
    serviceable: null,
    courier: process.env.SHIPPING_PROVIDER ?? null,
    etaDays: null,
    codAvailable: null,
    message: `SHIPPING_PROVIDER is set to "${process.env.SHIPPING_PROVIDER}", but no adapter for it has been implemented in src/lib/domain/shipping.ts.`,
  };
}

/** Indian states and union territories, for address forms (§51). */
export const INDIAN_STATES = [
  'Andaman & Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu & Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];
