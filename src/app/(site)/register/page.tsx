import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCustomerSession } from '@/lib/auth/guards';
import { AuthShell } from '@/components/auth/AuthShell';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Create your account',
  description:
    'Create a POOJARO account to track orders, save addresses and build your ritual wishlist.',
  robots: { index: false, follow: false },
};

/** Only honour a same-origin, path-relative redirect — never an absolute URL. */
function safeReturnTo(raw: string | undefined): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/account';
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo: raw } = await searchParams;
  const returnTo = safeReturnTo(raw);

  if (await getCustomerSession()) redirect(returnTo);

  const loginHref = `/login?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <AuthShell
      eyebrow="Join POOJARO"
      title="Bring every ritual together."
      subtitle="Create your account to keep your orders, addresses and cherished rituals in one sacred place."
      highlights={[
        'Track orders from puja to doorstep',
        'Save addresses for one-tap checkout',
        'Curate a wishlist of your rituals',
      ]}
      heading="Create your account"
      subheading="It takes less than a minute."
    >
      <RegisterForm returnTo={returnTo} loginHref={loginHref} />
    </AuthShell>
  );
}
