'use client';

import { motion } from 'motion/react';
import { Sparkles, ShieldCheck, ScrollText, Truck } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { EASE_OUT_SOFT } from '@/lib/motion';
import { PeacockSignature, PeacockDivider } from '@/components/peacock';

const pillars = [
  {
    icon: Sparkles,
    title: 'Carefully Curated',
    description: 'Each item is sourced from trusted wholesalers and artisans who understand the spiritual significance of every component. No shortcuts, no substitutions.',
  },
  {
    icon: ScrollText,
    title: 'Ready to Prepare',
    description: 'Every kit comes with step-by-step instructions for beginners and experienced practitioners alike. We don’t just provide ingredients — we guide the ritual.',
  },
  {
    icon: ShieldCheck,
    title: 'Rooted in Tradition',
    description: 'Our pandits and cultural advisors work with centuries-old practices. What we place in your box has been blessed by tradition.',
  },
  {
    icon: Truck,
    title: 'Delivered to You',
    description: 'From submission to your doorstep, we ensure delivery within 3-6 business days across India, with premium packaging that protects every sacred item.',
  },
];

export function WhyPoojaro() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');

  return (
    <section className="section-y bg-ivory">
      <div className="container-page">
        <div className="text-center mb-12">
          <p className="text-xs eyebrow text-gold-deep mb-4">Why Choose Us</p>
          <h2 className="text-display-lg md:text-display-xl font-display text-brown">
            The POOJARO Difference
          </h2>
          <PeacockDivider maxWidth={240} className="my-2 opacity-80" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                className="text-center p-6 bg-sand-soft/40 rounded-2xl border border-sand-deep/30"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_SOFT, delay: reduced ? 0 : 0.08 + i * 0.08 }}
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold-wash mb-5">
                  <Icon className="w-6 h-6 text-brown" />
                </div>
                <h3 className="font-display text-lg text-brown mb-3">{pillar.title}</h3>
                <p className="text-sm text-brown-soft leading-relaxed">{pillar.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Authenticity seal */}
        <motion.div
          className="mt-14 flex justify-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: reduced ? 0.01 : 0.6, ease: EASE_OUT_SOFT }}
        >
          <PeacockSignature
            variant="henna-on-light"
            layout="vertical"
            size={110}
            className="opacity-75 hover:opacity-100 transition-opacity"
          />
        </motion.div>
      </div>
    </section>
  );
}