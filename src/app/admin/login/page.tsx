'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';

import { PeacockMini } from '@/components/peacock';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <PeacockMini size={54} className="mb-2" />
          <h1 className="font-display text-4xl font-bold tracking-tight text-brown">POOJARO</h1>
          <p className="mt-1 text-sm text-brown-muted">Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-danger/10 p-3 text-sm text-danger text-center">
              {error}
            </div>
          )}

          <Field label="Email" required>
            {(props) => (
              <Input
                {...props}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@poojaro.in"
              />
            )}
          </Field>

          <Field label="Password" required>
            {(props) => (
              <Input
                {...props}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            )}
          </Field>

          <Button
            type="submit"
            fullWidth
            loading={loading}
            className="!bg-gold hover:!bg-gold-deep !text-white"
          >
            Sign In
          </Button>
        </form>

        {/* Demo Credentials & Quick Auto-fill 
        <div className="mt-6 rounded-lg border border-gold/30 bg-gold-wash/50 p-3 text-center text-xs text-brown">
          <p className="font-semibold text-brown">Admin Credentials</p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 text-brown-muted">
            <span>Email: <strong className="text-brown">owner@poojaro.in</strong></span>
            <span>•</span>
            <span>Password: <strong className="text-brown">admin123</strong></span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail('owner@poojaro.in');
              setPassword('admin123');
              setError('');
            }}
            className="mt-2 text-xs font-semibold text-gold-deep hover:underline focus:outline-none"
          >
            Click here to auto-fill
          </button>
        </div>*/}
      </div>
    </div>
  );
}
