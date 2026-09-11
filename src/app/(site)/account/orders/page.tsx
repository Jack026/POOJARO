import { getCustomerSession } from '@/lib/auth/guards';
import { getStore } from '@/lib/data';
import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';
import { resolveImageUrl } from '@/lib/photos';

export default async function OrdersPage() {
  const session = await getCustomerSession();
  if (!session) return null;

  const store = await getStore();
  const ordersList = await store.listOrders({ userId: session.userId });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-brown font-medium">Order History</h1>
        <p className="text-brown-muted mt-1">View and track all your past orders.</p>
      </div>

      {ordersList.items.length === 0 ? (
        <div className="border border-sand-deep/30 rounded-xl p-12 text-center bg-sand-soft/5 flex flex-col items-center">
          <div className="w-16 h-16 bg-sand-soft/50 rounded-full flex items-center justify-center mb-4 text-gold">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-display text-xl text-brown font-medium mb-2">No orders yet</h3>
          <p className="text-brown-muted mb-6">You haven't placed any orders yet. Once you do, they will appear here.</p>
          <Link href="/shop" className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-gold text-white font-medium hover:bg-gold-deep transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {ordersList.items.map((order) => (
            <div key={order.id} className="border border-sand-deep/40 rounded-xl overflow-hidden hover:shadow-subtle transition-shadow">
              <div className="bg-sand-soft/20 p-4 border-b border-sand-deep/30 flex flex-wrap justify-between items-center gap-4">
                <div className="flex flex-wrap gap-x-8 gap-y-2">
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-brown-muted mb-0.5">Order Placed</span>
                    <span className="text-sm font-medium text-brown">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-brown-muted mb-0.5">Total</span>
                    <span className="text-sm font-medium text-brown">₹{(order.totals.total / 100).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-brown-muted mb-0.5">Order #</span>
                    <span className="text-sm font-medium text-brown">{order.orderNumber}</span>
                  </div>
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider bg-gold/10 text-gold-deep border border-gold/20">
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex -space-x-4">
                  {order.items.slice(0, 3).map((item, i) => (
                    <div key={i} className="w-16 h-16 rounded-lg bg-sand-soft/50 border-2 border-white overflow-hidden relative z-10" style={{ zIndex: 10 - i }}>
                      {item.image ? (
                        <img src={resolveImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brown-muted/50">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-16 h-16 rounded-lg bg-sand-soft flex items-center justify-center border-2 border-white z-0 text-xs font-medium text-brown">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>
                <div className="text-sm text-brown-muted max-w-sm">
                  <p className="line-clamp-2">
                    {order.items.map(item => `${item.qty}x ${item.name}`).join(', ')}
                  </p>
                </div>
                <Link href={`/orders/${order.id}`} className="flex items-center gap-1 text-sm font-medium text-gold hover:text-gold-deep transition-colors whitespace-nowrap">
                  Order Details <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
