'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, RotateCcw, ShoppingCart, AlertCircle } from 'lucide-react';
import type { Occasion, Product, RecommendationRule, Settings, RitualFinderAnswers, PreparationLevel } from '@/lib/data/types';
import {
  resolveRecommendation,
  PEOPLE_BANDS,
  TIMING_OPTIONS,
  LEVEL_OPTIONS,
  summariseAnswers,
  type PeopleBandId,
} from '@/lib/domain/ritual-finder';
import { productPricing } from '@/lib/domain/product';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { EASE_OUT_SOFT } from '@/lib/motion';
import { resolveImageUrl } from '@/lib/photos';
import { PeacockSignature } from '@/components/peacock';

interface Props {
  occasions: Occasion[];
  rules: RecommendationRule[];
  products: Product[];
  settings: Settings;
}

type Step = 'occasion' | 'people' | 'timing' | 'level' | 'result';
const STEPS: Step[] = ['occasion', 'people', 'timing', 'level', 'result'];

const STEP_LABELS: Record<Step, string> = {
  occasion: 'The Puja',
  people: 'How Many',
  timing: 'When',
  level: 'How Complete',
  result: 'Your Kit',
};

interface Answers {
  occasionId: string | null;
  people: number | null;
  timing: RitualFinderAnswers['timing'] | null;
  level: PreparationLevel | null;
}

const INITIAL_ANSWERS: Answers = {
  occasionId: null,
  people: null,
  timing: null,
  level: null,
};

function StepBar({ step }: { step: Step }) {
  const current = STEPS.indexOf(step);
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.slice(0, -1).map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full transition-colors duration-300',
                done && 'bg-gold-deep',
                active && 'bg-brown',
                !done && !active && 'bg-sand-deep',
              )}
            />
            {i < STEPS.length - 2 && (
              <div className={cn('h-px w-6 transition-colors duration-300', done ? 'bg-gold-deep' : 'bg-sand-deep')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-xl border-2 transition-all duration-200',
        selected
          ? 'border-gold-deep bg-gold-wash'
          : 'border-sand-deep bg-sand-soft/20 hover:border-brown/50',
        className,
      )}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Step panels
// ---------------------------------------------------------------------------

function OccasionStep({
  occasions,
  value,
  onChange,
}: {
  occasions: Occasion[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-display-sm text-brown mb-1">Which puja are you planning?</h2>
      <p className="text-brown-soft text-sm mb-6">Select one to get started.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {occasions.map((occ) => (
          <OptionCard key={occ.id} selected={value === occ.id} onClick={() => onChange(occ.id)}>
            <span className="block font-medium text-brown leading-snug">{occ.name}</span>
            {occ.description && (
              <span className="block text-xs text-brown-soft mt-0.5 leading-snug">{occ.description}</span>
            )}
          </OptionCard>
        ))}
      </div>
    </div>
  );
}

function PeopleStep({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (people: number) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-display-sm text-brown mb-1">How many people will attend?</h2>
      <p className="text-brown-soft text-sm mb-6">This helps us match the right kit size.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PEOPLE_BANDS.map((band) => (
          <OptionCard
            key={band.id}
            selected={value === band.people}
            onClick={() => onChange(band.people)}
          >
            <span className="block font-medium text-brown">{band.label}</span>
            <span className="block text-xs text-brown-soft mt-0.5">{band.detail}</span>
          </OptionCard>
        ))}
      </div>
    </div>
  );
}

function TimingStep({
  value,
  onChange,
}: {
  value: RitualFinderAnswers['timing'] | null;
  onChange: (t: RitualFinderAnswers['timing']) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-display-sm text-brown mb-1">When is the puja?</h2>
      <p className="text-brown-soft text-sm mb-6">We will flag the right delivery option.</p>
      <div className="grid grid-cols-1 gap-3">
        {TIMING_OPTIONS.map((opt) => (
          <OptionCard key={opt.id} selected={value === opt.id} onClick={() => onChange(opt.id)}>
            <span className="block font-medium text-brown">{opt.label}</span>
            <span className="block text-xs text-brown-soft mt-0.5">{opt.detail}</span>
          </OptionCard>
        ))}
      </div>
    </div>
  );
}

function LevelStep({
  value,
  onChange,
}: {
  value: PreparationLevel | null;
  onChange: (l: PreparationLevel) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-display-sm text-brown mb-1">How complete should the kit be?</h2>
      <p className="text-brown-soft text-sm mb-6">You can always add individual items separately.</p>
      <div className="grid grid-cols-1 gap-3">
        {LEVEL_OPTIONS.map((opt) => (
          <OptionCard key={opt.id} selected={value === opt.id} onClick={() => onChange(opt.id)}>
            <span className="block font-medium text-brown">{opt.label}</span>
            <span className="block text-xs text-brown-soft mt-0.5">{opt.detail}</span>
          </OptionCard>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Result panel
// ---------------------------------------------------------------------------

function ResultPanel({
  answers,
  occasions,
  rules,
  products,
  settings,
  onReset,
}: {
  answers: RitualFinderAnswers;
  occasions: Occasion[];
  rules: RecommendationRule[];
  products: Product[];
  settings: Settings;
  onReset: () => void;
}) {
  const result = resolveRecommendation({ answers, rules, products, occasions, settings });
  const summary = summariseAnswers(answers, occasions);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h2 className="font-display text-display-sm text-brown">Your recommendation</h2>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-brown-soft hover:text-brown transition-colors shrink-0 mt-1"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden />
          Start over
        </button>
      </div>
      <p className="text-xs text-brown-muted mb-6">{summary}</p>

      {!result.ok ? (
        <div className="rounded-xl border border-sand-deep bg-sand-soft/30 p-5 flex gap-3">
          <AlertCircle className="w-5 h-5 text-brown-muted shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="text-brown-soft text-sm leading-relaxed">{result.message}</p>
            <Link
              href="/kits"
              className="inline-block mt-3 text-sm text-gold-deep underline underline-offset-2 hover:text-brown transition-colors"
            >
              Browse all kits →
            </Link>
          </div>
        </div>
      ) : (
        <RecommendationCard
          rec={result.recommendation}
          answers={answers}
        />
      )}
    </div>
  );
}

function RecommendationCard({
  rec,
  answers,
}: {
  rec: { product: Product; suggestedQty: number; reason: string; addOns: Product[]; timingNote: string };
  answers: RitualFinderAnswers;
}) {
  const pricing = productPricing(rec.product);
  const image = rec.product.images[0];

  return (
    <div className="space-y-5">
      {/* Main product card */}
      <div className="rounded-xl border border-sand-deep overflow-hidden">
        <div className="flex gap-4 p-4">
          {image && (
            <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-sand-soft/50">
              <Image
                src={resolveImageUrl(image.url)}
                alt={image.alt ?? rec.product.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-brown leading-snug mb-1 truncate">{rec.product.name}</p>
            <Price pricing={pricing} size="sm" />
            {rec.suggestedQty > 1 && (
              <p className="text-xs text-brown-muted mt-1">Suggested quantity: {rec.suggestedQty}</p>
            )}
          </div>
        </div>

        {rec.reason && (
          <div className="px-4 pb-4">
            <p className="text-xs text-brown-soft leading-relaxed border-t border-sand-deep/60 pt-3">
              {rec.reason}
            </p>
          </div>
        )}

        <div className="px-4 pb-4">
          <Link
            href={`/products/${rec.product.slug}`}
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-brown text-sand-soft text-sm font-medium py-2.5 px-4 hover:bg-brown/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2"
          >
            <ShoppingCart className="w-4 h-4" aria-hidden />
            View &amp; Add to Cart
          </Link>
        </div>
      </div>

      {/* Timing note */}
      {rec.timingNote && answers.timing !== 'planning' && (
        <p className="text-xs text-brown-soft leading-relaxed bg-sand-soft/40 rounded-lg px-4 py-3 border border-sand-deep/40">
          {rec.timingNote}
        </p>
      )}

      {/* Add-ons */}
      {rec.addOns.length > 0 && (
        <div>
          <p className="text-xs eyebrow text-gold-deep mb-3">You might also need</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rec.addOns.map((addon) => {
              const addonPricing = productPricing(addon);
              const addonImage = addon.images[0];
              return (
                <Link
                  key={addon.id}
                  href={`/products/${addon.slug}`}
                  className="flex gap-3 p-3 rounded-xl border border-sand-deep bg-sand-soft/20 hover:border-brown/40 transition-colors"
                >
                  {addonImage && (
                    <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden bg-sand-soft/60">
                      <Image
                        src={resolveImageUrl(addonImage.url)}
                        alt={addonImage.alt ?? addon.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brown leading-snug truncate">{addon.name}</p>
                    <Price pricing={addonPricing} size="sm" showDiscount={false} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Handcrafted recommendation seal */}
      <div className="pt-8 pb-2 flex justify-center">
        <PeacockSignature
          variant="henna-on-light"
          layout="vertical"
          size={100}
          className="opacity-75 hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main exported wizard
// ---------------------------------------------------------------------------

export function RitualFinderClient({ occasions, rules, products, settings }: Props) {
  const [step, setStep] = useState<Step>('occasion');
  const [answers, setAnswers] = useState<Answers>(INITIAL_ANSWERS);

  const canAdvance = (() => {
    switch (step) {
      case 'occasion': return answers.occasionId !== null;
      case 'people':   return answers.people !== null;
      case 'timing':   return answers.timing !== null;
      case 'level':    return answers.level !== null;
      default:         return false;
    }
  })();

  function advance() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1] as Step);
  }

  function back() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1] as Step);
  }

  function reset() {
    setAnswers(INITIAL_ANSWERS);
    setStep('occasion');
  }

  // Auto-advance once an answer is chosen (except on the last question step)
  function handleOccasion(id: string) {
    setAnswers((a) => ({ ...a, occasionId: id }));
    setTimeout(advance, 220);
  }
  function handlePeople(p: number) {
    setAnswers((a) => ({ ...a, people: p }));
    setTimeout(advance, 220);
  }
  function handleTiming(t: RitualFinderAnswers['timing']) {
    setAnswers((a) => ({ ...a, timing: t }));
    setTimeout(advance, 220);
  }
  function handleLevel(l: PreparationLevel) {
    setAnswers((a) => ({ ...a, level: l }));
    setTimeout(advance, 220);
  }

  const isResultStep = step === 'result';
  const activeOccasions = occasions.filter((o) => o.isActive);

  return (
    <div className="max-w-xl mx-auto">
      {!isResultStep && <StepBar step={step} />}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.22, ease: EASE_OUT_SOFT }}
        >
          {step === 'occasion' && (
            <OccasionStep occasions={activeOccasions} value={answers.occasionId} onChange={handleOccasion} />
          )}
          {step === 'people' && (
            <PeopleStep value={answers.people} onChange={handlePeople} />
          )}
          {step === 'timing' && (
            <TimingStep value={answers.timing} onChange={handleTiming} />
          )}
          {step === 'level' && (
            <LevelStep value={answers.level} onChange={handleLevel} />
          )}
          {step === 'result' && answers.occasionId && answers.people && answers.timing && answers.level && (
            <ResultPanel
              answers={{
                occasionId: answers.occasionId,
                people: answers.people,
                timing: answers.timing,
                level: answers.level,
              }}
              occasions={occasions}
              rules={rules}
              products={products}
              settings={settings}
              onReset={reset}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav buttons — hidden on result step */}
      {!isResultStep && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-sand-deep/40">
          <button
            type="button"
            onClick={back}
            disabled={step === 'occasion'}
            className="flex items-center gap-1.5 text-sm text-brown-soft hover:text-brown transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
            Back
          </button>
          <button
            type="button"
            onClick={advance}
            disabled={!canAdvance}
            className="flex items-center gap-1.5 text-sm font-medium text-brown hover:text-gold-deep transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            Next
            <ChevronRight className="w-4 h-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
