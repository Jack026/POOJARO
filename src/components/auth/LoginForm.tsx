'use client';

/**
 * Customer sign-in.
 *
 * The API (`POST /api/auth/login`) is passwordless: it signs you in if an
 * account with that email exists. So the form asks for the email and nothing
 * else — a password field the backend ignores would only imply a security
 * check that isn't there. Validation failures surface on the field itself
 * (Field already gives it `role="alert"` and `aria-invalid`).
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';

export function LoginForm({ returnTo, registerHref }: { returnTo: string; registerHref: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(
          res.status === 401
            ? 'We couldn’t find an account with that email.'
            : data.error || 'Something went wrong. Please try again.',
        );
      }
      // Land on the intended page and re-run its server render so the account
      // area picks up the freshly set session cookie.
      router.push(returnTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Field label="Email address" required error={error} hint="The email you used to create your account.">
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
            invalid={Boolean(error)}
          />
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
