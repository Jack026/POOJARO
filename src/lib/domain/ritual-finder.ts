/**
 * The Ritual Finder resolver (§19).
 *
 * Four answers in — which puja, how many people, when, how prepared you want to
 * be — and one kit recommendation out, with the reason it was chosen.
 *
 * The rules are `RecommendationRule` rows in the datastore, not a switch
 * statement here, because the brief requires the owner to retune the finder from
 * the admin panel without a deploy (§57). This module only interprets them.
 *
 * Pure functions: no datastore, no clock reads except the one passed in. That
 * makes the whole feature testable and lets it run on the server for the initial
 * render and on the client for step transitions.
 */
import type {
  Occasion,
  PreparationLevel,
  Product,
  RecommendationRule,
  RitualFinderAnswers,
  RitualRecommendation,
  RitualTiming,
  Settings,
} from '../data/types';
import { availableStock, isPublished, isPurchasable } from './product';
import { deliveryWindow } from '../format';

// ---------------------------------------------------------------------------
// Step definitions — the UI renders from these, so copy lives in one place
// ---------------------------------------------------------------------------

export const PEOPLE_BANDS = [
  { id: 'few', label: 'Just my family', detail: '2–4 people', people: 4 },
  { id: 'household', label: 'A full household', detail: '5–10 people', people: 10 },
  { id: 'gathering', label: 'A gathering', detail: '11–25 people', people: 20 },
  { id: 'large', label: 'A large gathering', detail: '25 or more', people: 40 },
] as const;

export type PeopleBandId = (typeof PEOPLE_BANDS)[number]['id'];

export const TIMING_OPTIONS: ReadonlyArray<{ id: RitualTiming; label: string; detail: string }> = [
  { id: 'soon', label: 'In the next few days', detail: 'We will flag the fastest delivery option.' },
  { id: 'week', label: 'Within a week', detail: 'Comfortable for standard delivery anywhere in India.' },
  { id: 'month', label: 'Within a month', detail: 'Plenty of time to add anything you are missing.' },
  { id: 'planning', label: 'Still planning', detail: 'Save it to your wishlist and order when you are ready.' },
];

export const LEVEL_OPTIONS: ReadonlyArray<{
  id: PreparationLevel;
  label: string;
  detail: string;
}> = [
  {
    id: 'essentials',
    label: 'Essentials',
    detail: 'The items the ritual genuinely requires, nothing more.',
  },
  {
    id: 'complete',
    label: 'Complete',
    detail: 'The essentials plus the things households most often run short of.',
  },
  {
    id: 'premium',
    label: 'Premium',
    detail: 'Everything, with the brass and copper pieces you keep and reuse.',
  },
];

export const LEVEL_LABEL: Record<PreparationLevel, string> = {
  essentials: 'Essentials',
  complete: 'Complete',
  premium: 'Premium',
};

export function peopleForBand(id: PeopleBandId): number {
  return PEOPLE_BANDS.find((band) => band.id === id)?.people ?? 4;
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

export interface ResolveInput {
  answers: RitualFinderAnswers;
  rules: RecommendationRule[];
  products: Product[];
  occasions: Occasion[];
  settings: Settings;
  now?: Date;
}

export type ResolveFailure =
  | { ok: false; code: 'no_rule'; message: string }
  | { ok: false; code: 'product_missing'; message: string };

export type ResolveResult = { ok: true; recommendation: RitualRecommendation } | ResolveFailure;

/**
 * Find the best rule for a set of answers.
 *
 * Matching is deliberately forgiving. An exact occasion + level + headcount band
 * wins; failing that we widen, first to any headcount band for that occasion and
 * level, then to any level for that occasion. Returning *something* useful beats
 * telling a shopper who answered four questions that we have no idea — but if the
 * occasion itself has no active rules at all, we say so rather than guess.
 */
function selectRule(answers: RitualFinderAnswers, rules: RecommendationRule[]): RecommendationRule | null {
  const active = rules.filter((rule) => rule.isActive && rule.occasionId === answers.occasionId);
  if (active.length === 0) return null;

  const byBand = active.filter(
    (rule) => answers.people >= rule.minPeople && answers.people <= rule.maxPeople,
  );

  const ordered = (list: RecommendationRule[]) => [...list].sort((a, b) => a.sortOrder - b.sortOrder);

  const exact = ordered(byBand).find((rule) => rule.level === answers.level);
  if (exact) return exact;

  // Right level, wrong band: take the band closest to the answered headcount.
  const sameLevel = active.filter((rule) => rule.level === answers.level);
  if (sameLevel.length > 0) {
    return [...sameLevel].sort(
      (a, b) => bandDistance(answers.people, a) - bandDistance(answers.people, b) || a.sortOrder - b.sortOrder,
    )[0] ?? null;
  }

  // Right band, any level.
  const bandFallback = ordered(byBand)[0];
  if (bandFallback) return bandFallback;

  return ordered(active)[0] ?? null;
}

function bandDistance(people: number, rule: RecommendationRule): number {
  if (people < rule.minPeople) return rule.minPeople - people;
  if (people > rule.maxPeople) return people - rule.maxPeople;
  return 0;
}

/**
 * Turn `timing` into concrete delivery guidance rather than a mood.
 *
 * It uses the store's own configured lead times, so if an admin changes the
 * delivery window in Settings this sentence changes with it (§68 — nothing
 * date-related is hard-coded).
 */
export function timingNoteFor(timing: RitualTiming, settings: Settings, now: Date = new Date()): string {
  const window = deliveryWindow(settings.deliveryDaysMin, settings.deliveryDaysMax, now);
  // The seed ships without a support phone, so fall back to email rather than
  // printing "call  and we will tell you".
  const contact = settings.supportPhone ? `call ${settings.supportPhone}` : `write to ${settings.supportEmail}`;
  switch (timing) {
    case 'soon':
      return `Order today and delivery is estimated ${window}. If your puja falls before that, ${contact} and we will tell you honestly whether we can make it.`;
    case 'week':
      return `Estimated delivery ${window}, which leaves room before a puja next week.`;
    case 'month':
      return `Estimated delivery ${window} — comfortably ahead of a puja later this month.`;
    case 'planning':
      return 'No hurry. Save this to your wishlist and order when the date is fixed; delivery usually takes a few working days.';
  }
}

/** Availability note for the recommended quantity, in the shopper's words. */
export function stockNoteFor(product: Product, qty: number): string | null {
  if (!isPurchasable(product)) return 'This is out of stock at the moment. We will show you the nearest alternative.';
  const available = availableStock(product);
  if (available >= qty) return null;
  return available === 1
    ? 'Only one left in stock, so you may need to reduce the quantity.'
    : `Only ${available} in stock right now, so you may need to reduce the quantity.`;
}

export function resolveRecommendation(input: ResolveInput): ResolveResult {
  const { answers, rules, products, occasions, settings } = input;
  const now = input.now ?? new Date();

  const occasion = occasions.find((o) => o.id === answers.occasionId);
  const occasionName = occasion?.name ?? 'that occasion';

  const rule = selectRule(answers, rules);
  if (!rule) {
    return {
      ok: false,
      code: 'no_rule',
      message: `We have not set up a recommendation for ${occasionName} yet. Browse the kits, or message us and we will put one together.`,
    };
  }

  const product = products.find((p) => p.id === rule.productId && isPublished(p));
  if (!product) {
    return {
      ok: false,
      code: 'product_missing',
      message: 'The kit we would normally suggest is unavailable right now. Please browse the full range.',
    };
  }

  const addOns = rule.addOnProductIds
    .map((id) => products.find((p) => p.id === id && isPublished(p)))
    .filter((p): p is Product => p !== undefined);

  return {
    ok: true,
    recommendation: {
      product,
      suggestedQty: Math.max(1, rule.suggestedQty),
      reason: rule.reason,
      addOns,
      timingNote: timingNoteFor(answers.timing, settings, now),
    },
  };
}

/**
 * A one-line summary of the answers, shown above the result so the shopper can
 * see what it was based on — and correct it if we misread them.
 */
export function summariseAnswers(answers: RitualFinderAnswers, occasions: Occasion[]): string {
  const occasion = occasions.find((o) => o.id === answers.occasionId)?.name ?? 'Your puja';
  const band = PEOPLE_BANDS.find((b) => b.people === answers.people);
  const people = band ? band.detail : `about ${answers.people} people`;
  const timing = TIMING_OPTIONS.find((t) => t.id === answers.timing)?.label.toLowerCase() ?? 'soon';
  return `${occasion} · ${people} · ${timing} · ${LEVEL_LABEL[answers.level].toLowerCase()}`;
}
