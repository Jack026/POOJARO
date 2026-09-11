import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCustomerSession } from '@/lib/auth/guards';
import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  description:
    'Sign in to your POOJARO account to track orders, manage addresses and your ritual wishlist.',
  // A personal-account gateway has nothing to offer search engines.
  robots: { index: false, follow: false },
};

/** Only honour a same-origin, path-relative redirect — never an absolute URL. */
function safeReturnTo(raw: string | undefined): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/account';
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo: raw } = await searchParams;
  const returnTo = safeReturnTo(raw);

  // Already signed in? Skip the form and go where they were headed.
  if (await getCustomerSession()) redirect(returnTo);

  const registerHref = `/register?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Your rituals, kept close."
      subtitle="Sign in to follow your orders, revisit past pujas and pick up right where you left off."
      highlights={[
        'Track every order end to end',
        'Saved addresses for faster checkout',
        'Your ritual wishlist in one place',
      ]}
      heading="Sign in"
      subheading="Enter your email to reach your account."
    >
      <LoginForm returnTo={returnTo} registerHref={registerHref} />
    </AuthShell>
  );
}
