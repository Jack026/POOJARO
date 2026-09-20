'use client';

/**
 * Customer sign-up powered by Supabase Auth.
 *
 * Registers customer with name, email, phone, and secure password.
 * Establishes Supabase SSR session and datastore user record.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { GoogleButton } from './GoogleButton';

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm({
  returnTo,
  loginHref,
  initialError,
}: {
  returnTo: string;
  loginHref: string;
  initialError?: string;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState(initialError || '');
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
    if (!password || password.length < 6) next.password = 'Password must be at least 6 characters.';
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
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        }),
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
      <div className="flex items-center gap-2 rounded-lg bg-gold-pale/30 px-3 py-2 text-xs text-gold-deep border border-gold-pale">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>Secured with Supabase Zero-Trust Authentication</span>
      </div>

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

      {/* Google One-Click Sign Up */}
      <div className="pt-1">
        <GoogleButton
          returnTo={returnTo}
          label="Sign up with Google"
          onError={(err) => setFormError(err)}
          disabled={loading}
        />
      </div>

      {/* Elegant Divider */}
      <div className="relative flex items-center justify-center my-1">
        <span className="h-[1px] w-full bg-sand-deep/30" />
        <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-brown-muted font-medium shrink-0">
          or register with email
        </span>
        <span className="h-[1px] w-full bg-sand-deep/30" />
      </div>

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

      <Field label="Password" required error={errors.password} hint="At least 6 characters.">
        {(props) => (
          <div className="relative">
            <Input
              {...props}
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
              }}
              invalid={Boolean(errors.password)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-muted hover:text-brown transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
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
