'use client';

/**
 * The shell shared by the customer sign-in and create-account pages.
 *
 * A two-column card that lives inside the normal storefront chrome (header
 * above, footer below): a brown "stage" on the left echoing the hero — dimmed
 * devotional imagery, a warm diya glow and a gold orbit hairline — and the form
 * itself on the right, on calm ivory. Below `lg` the stage is dropped entirely
 * (a tall brown panel above a short form just pushes the form off-screen) and a
 * small wordmark cue stands in for the brand.
 *
 * Presentational only: it owns no form state. The pages pass the panel copy and
 * drop the relevant <LoginForm>/<RegisterForm> in as `children`.
 */
import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { ArrowLeft, Check } from 'lucide-react';

import { Photo } from '@/components/ui/Photo';
import { EASE_OUT_SOFT } from '@/lib/motion';

export interface AuthShellProps {
  /** Brand-panel eyebrow, e.g. "Welcome back". */
  eyebrow: string;
  /** Brand-panel serif headline. */
  title: string;
  /** One supporting line under the brand headline. */
  subtitle: string;
  /** Reasons to hold an account — rendered as a checked list. */
  highlights: string[];
  /** Form-column heading (on ivory), e.g. "Sign in". */
  heading: string;
  /** One line under the form heading. */
  subheading: string;
  /** The form itself. */
  children: React.ReactNode;
}

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  highlights,
  heading,
  subheading,
  children,
}: AuthShellProps) {
  const reduced = useReducedMotion();

  const card: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : 24 },
    visible: { opacity: 1, y: 0, transition: { duration: reduced ? 0.2 : 0.7, ease: EASE_OUT_SOFT } },
  };

  return (
    <section className="section-y relative isolate overflow-hidden bg-ivory-warm">
      {/* Ambient gold wash + paper grain behind the card, so it reads as lit. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(90%_60%_at_50%_-10%,var(--color-gold-wash),transparent_60%)]"
      />
      <div aria-hidden className="texture-paper pointer-events-none absolute inset-0 -z-10 opacity-40" />

      <div className="container-page">
        <motion.div
          variants={card}
          initial="hidden"
          animate="visible"
          className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-ivory shadow-overlay ring-1 ring-sand-deep/70 lg:min-h-[36rem] lg:grid-cols-[1.05fr_1fr]"
        >
          {/* --- Brand stage (desktop only) -------------------------------- */}
          <aside className="relative hidden overflow-hidden bg-brown p-10 text-ivory lg:flex lg:flex-col lg:justify-between xl:p-12">
            {/* Devotional imagery, dimmed so the copy stays legible. Not
                `priority`: the panel is display:none below lg, so on a phone it
                must not eagerly fetch a large image it will never show. */}
            <motion.div
              aria-hidden
              className="absolute inset-0 -z-10"
              initial={{ opacity: 0, scale: reduced ? 1 : 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduced ? 0.2 : 1.1, ease: EASE_OUT_SOFT }}
            >
              <Photo
                name="story-ganesh"
                sizes="(min-width: 1024px) 40vw, 1px"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/95 via-brown/85 to-brown/70" />
              <div className="texture-paper absolute inset-0 opacity-40" />
              <div className="glow-diya absolute -right-[15%] top-[8%] h-64 w-64 opacity-50 blur-2xl" />
            </motion.div>

            {/* A hairline echo of the hero's gold orbit. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full border border-dashed border-gold-soft/20"
            />

            {/* text-gold-soft overrides the eyebrow's default gold-deep for this
                dark stage; text-ivory on the heading is load-bearing — the base
                layer paints h2 brown, which would vanish on brown. */}
            <span className="eyebrow text-gold-soft">{eyebrow}</span>

            <div>
              <h2 className="font-display text-display-sm leading-[1.02] text-ivory">{title}</h2>
              <p className="mt-4 max-w-sm text-sand-soft">{subtitle}</p>

              <ul className="mt-8 space-y-3">
                {highlights.map((h) => (
                  <li key={h} className="flex items-center gap-3 text-sm text-ivory/90">
                    <span
                      aria-hidden
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-soft ring-1 ring-gold-soft/30"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* --- Form column ----------------------------------------------- */}
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-1.5 self-start text-xs uppercase tracking-[0.14em] text-brown-muted transition-colors hover:text-brown"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to store
            </Link>

            {/* The brand stage is desktop-only, so give small screens a cue. */}
            <span className="eyebrow mb-3 block lg:hidden">POOJARO</span>

            <h1 className="font-display text-display-sm text-brown">{heading}</h1>
            <p className="mt-2 text-brown-soft">{subheading}</p>

            <div className="mt-8">{children}</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
