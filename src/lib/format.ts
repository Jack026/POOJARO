/**
 * Money, dates and Indian formatting helpers.
 *
 * Amounts are integer paise everywhere. Rupee conversion happens only at the
 * moment of display, which is why there is no `toRupees()` used in arithmetic.
 */
import type { Paise } from './data/types';

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const INR_PRECISE = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹1,499 — drops paise when the amount is a whole rupee, which it usually is. */
export function formatMoney(paise: Paise): string {
  const rupees = paise / 100;
  return Number.isInteger(rupees) ? INR.format(rupees) : INR_PRECISE.format(rupees);
}

/** "1,499" without the symbol, for use beside a separately styled ₹. */
export function formatAmount(paise: Paise): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function rupees(amount: number): Paise {
  return Math.round(amount * 100);
}

/** Percentage off, rounded down so the badge never overstates the saving. */
export function discountPercent(price: Paise, mrp: Paise): number {
  if (mrp <= 0 || price >= mrp) return 0;
  return Math.floor(((mrp - price) / mrp) * 100);
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const DATE_MEDIUM = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});

const DATE_SHORT = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Asia/Kolkata',
});

const DATE_TIME = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

export function formatDate(iso: string): string {
  return DATE_MEDIUM.format(new Date(iso));
}

export function formatDateShort(iso: string): string {
  return DATE_SHORT.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}

/**
 * Whole days from `now` until `iso`, in IST. Returns null for a past date so a
 * countdown can hide itself rather than display a negative number — the guard
 * against a festival date nobody updated.
 */
export function daysUntil(iso: string, now: Date = new Date()): number | null {
  const target = istMidnight(new Date(iso));
  const today = istMidnight(now);
  const days = Math.round((target - today) / 86_400_000);
  return days < 0 ? null : days;
}

function istMidnight(date: Date): number {
  // IST is a fixed +05:30 with no DST, so a plain offset is exact here.
  const shifted = new Date(date.getTime() + 5.5 * 3_600_000);
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - 5.5 * 3_600_000;
}

export function countdownLabel(name: string, iso: string | null, now: Date = new Date()): string | null {
  if (!iso) return null;
  const days = daysUntil(iso, now);
  if (days === null) return null;
  if (days === 0) return `${name} is today.`;
  if (days === 1) return `${name} begins tomorrow.`;
  return `${name} begins in ${days} days.`;
}

/** Adds business days (Mon–Sat; couriers in India work Saturdays). */
export function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0) added += 1;
  }
  return date;
}

export function deliveryWindow(minDays: number, maxDays: number, from: Date = new Date()): string {
  const start = addBusinessDays(from, minDays);
  const end = addBusinessDays(from, maxDays);
  return `${DATE_SHORT.format(start)} – ${DATE_SHORT.format(end)}`;
}

// ---------------------------------------------------------------------------
// India-specific
// ---------------------------------------------------------------------------

/** 10 digits, starting 6–9. Accepts and strips +91 / 0 prefixes. */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

export function formatPhone(local: string): string {
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}

/** 6 digits, first digit 1–8. PIN codes never begin with 0 or 9. */
export function isValidPincode(input: string): boolean {
  return /^[1-8]\d{5}$/.test(input.trim());
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}
