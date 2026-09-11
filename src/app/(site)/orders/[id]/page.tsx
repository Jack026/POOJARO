import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getStore } from '@/lib/data';
import { autoProgressOrder } from '@/lib/domain/orderProgress';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { buildMetadata } from '@/lib/seo';
import { OrderTracker } from './OrderTracker';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const store = await getStore();
  const raw = (await store.getOrderById(id)) ?? (await store.getOrderByNumber(id));
  const order = raw ? autoProgressOrder(raw).order : null;

  // Order pages carry a name, an address and a phone number. They are reachable
  // by unguessable id so a guest can return to one, but they must never be
  // indexed (§47).
  return buildMetadata({
    title: order ? `Order ${order.orderNumber}` : 'Order not found',
    path: `/orders/${id}`,
    noIndex: true,
  });
}

export default async function OrderPage({ params }: PageProps) {
  const { id } = await params;
  const store = await getStore();
  const raw = (await store.getOrderById(id)) ?? (await store.getOrderByNumber(id));

  if (!raw) notFound();

  const { order } = autoProgressOrder(raw);

  return (
    <main id="main" className="pt-10 pb-20">
      <div className="container-page max-w-3xl">
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: `Order ${order.orderNumber}` }]}
          className="mb-6"
        />
        <OrderTracker order={order} />
      </div>
    </main>
  );
}
