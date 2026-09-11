'use client';

/**
 * Customer sign-up.
 *
 * `POST /api/auth/register` needs name, email and phone; it 409s if the email
 * is taken. Per-field problems (empty, malformed email, taken email) land on
 * the field that owns them; anything unexpected — a network drop, a 500 —
 * shows once at the top of the form.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm({ returnTo, loginHref }: { returnTo: string; loginHref: string }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  function clearFieldError(key: keyof FieldErrors) {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = 'Please enter your name.';
    if (!email.trim()) next.email = 'Please enter your email.';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Please enter a valid email address.';
    if (!phone.trim()) next.phone = 'Please enter your phone number.';
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setFormError('');

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 409) {
          setErrors({ email: 'An account with this email already exists.' });
          setLoading(false);
          return;
        }
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      router.push(returnTo);
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && (
        <motion.p
          role="alert"
          initial={reduced ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 px-3.5 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </motion.p>
      )}

      <Field label="Full name" required error={errors.name}>
        {(props) => (
          <Input
            {...props}
            type="text"
            name="name"
            autoComplete="name"
            autoFocus
            placeholder="Ananya Sharma"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError('name');
            }}
            invalid={Boolean(errors.name)}
          />
        )}
      </Field>

      <Field label="Email address" required error={errors.email}>
        {(props) => (
          <Input
            {...props}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError('email');
            }}
            invalid={Boolean(errors.email)}
          />
        )}
      </Field>

      <Field label="Phone number" required error={errors.phone} hint="For order and delivery updates.">
        {(props) => (
          <Input
            {...props}
            type="tel"
            inputMode="tel"
            name="phone"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clearFieldError('phone');
            }}
            invalid={Boolean(errors.phone)}
          />
        )}
      </Field>

      <Button type="submit" variant="gold" size="lg" fullWidth loading={loading} loadingLabel="Creating account…">
        Create account
      </Button>

      <p className="text-center text-sm text-brown-soft">
        Already have an account?{' '}
        <Link href={loginHref} className="font-medium text-gold-deep underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
