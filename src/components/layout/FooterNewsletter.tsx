'use client';

import React, { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/toast-store';

export function FooterNewsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('submitting');
    setMessage(null);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to subscribe.');
      }

      setStatus('success');
      setMessage('Thank you! Sacred offerings will arrive in your inbox.');
      setEmail('');
      toast.success('Newsletter Subscribed', {
        description: 'You will receive our auspicious festival guides and exclusive offerings.',
      });
    } catch (err: any) {
      setStatus('idle');
      setMessage(err.message || 'Subscription failed. Please try again.');
      toast.error('Newsletter Error', {
        description: err.message || 'Failed to subscribe.',
      });
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          disabled={status === 'success' || status === 'submitting'}
          required
          aria-label="Email address for newsletter"
          className="w-full bg-[#180A04]/90 border border-gold/40 rounded-full py-2.5 pl-4 pr-12 text-xs text-sand-soft placeholder:text-sand-deep/50 focus:outline-none focus:border-gold transition-colors disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'submitting' || status === 'success'}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-tr from-[#B78332] via-[#C5A059] to-[#E5C384] text-[#241208] flex items-center justify-center shadow-subtle hover:scale-105 active:scale-95 transition-transform disabled:opacity-80 cursor-pointer"
          aria-label="Subscribe to newsletter"
        >
          {status === 'submitting' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : status === 'success' ? (
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          )}
        </button>
      </form>
      <p className="text-[11px] text-gold-soft/80 flex items-center gap-1.5 leading-tight">
        <span className="text-xs">🪷</span>
        <span>
          {message || 'A little more divinity in your inbox.'}
        </span>
      </p>
    </div>
  );
}
