'use client';

/**
 * Customer sign-in powered by Supabase Auth.
 *
 * Supports email and secure password authentication.
 * If the user logs in, Supabase SSR cookies and app sessions are established.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { GoogleButton } from './GoogleButton';

export function LoginForm({
  returnTo,
  registerHref,
  initialError,
}: {
  returnTo: string;
  registerHref: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(
          res.status === 401
            ? data.error || 'We couldn’t find an account matching those credentials.'
            : data.error || 'Something went wrong. Please try again.',
        );
      }

      // Land on the intended page and refresh so server components pick up the new session
      router.push(returnTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="flex items-center gap-2 rounded-lg bg-gold-pale/30 px-3 py-2 text-xs text-gold-deep border border-gold-pale">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>Secured with Supabase Zero-Trust Authentication</span>
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger font-medium">
          {error}
        </div>
      )}

      {/* Google One-Click Sign In */}
      <div className="pt-1">
        <GoogleButton
          returnTo={returnTo}
          label="Sign in with Google"
          onError={(err) => setError(err)}
          disabled={loading}
        />
      </div>

      {/* Elegant Divider */}
      <div className="relative flex items-center justify-center my-1">
        <span className="h-[1px] w-full bg-sand-deep/30" />
        <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-brown-muted font-medium shrink-0">
          or continue with email
        </span>
        <span className="h-[1px] w-full bg-sand-deep/30" />
      </div>

      <Field label="Email address" required hint="The email you used to create your account.">
        {(props) => (
          <Input
            {...props}
            type="email"
            name="email"
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
          />
        )}
      </Field>

      <Field label="Password" hint="Enter your account password.">
        {(props) => (
          <div className="relative">
            <Input
              {...props}
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
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

      <Button type="submit" variant="gold" size="lg" fullWidth loading={loading} loadingLabel="Signing in…">
        Sign in
      </Button>

      <p className="text-center text-sm text-brown-soft">
        New to POOJARO?{' '}
        <Link href={registerHref} className="font-medium text-gold-deep underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
