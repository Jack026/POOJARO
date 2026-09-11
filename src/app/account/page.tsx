import { getCustomerSession } from '@/lib/auth/guards';
import { getStore } from '@/lib/data';
import Link from 'next/link';
import { Package, Heart, Edit2 } from 'lucide-react';
import { Price } from '@/components/ui/Price';

export default async function AccountPage() {
  const session = await getCustomerSession();
  if (!session) return null;

  const store = await getStore();
  const user = await store.getUserById(session.userId);
  if (!user) return null;

  const ordersList = await store.listOrders({ userId: session.userId, limit: 3 });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-brown font-medium">Overview</h1>
        <p className="text-brown-muted mt-1">Manage your profile and view your recent activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="border border-sand-deep/50 rounded-xl p-6 bg-sand-soft/10 relative">
          <div className="flex justify-between items-start mb-4">
            <h2 className="font-display text-xl text-brown font-medium">Personal Details</h2>
            <button className="text-gold hover:text-gold-deep transition-colors p-2 -mr-2 -mt-2">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-brown-muted block text-xs uppercase tracking-wider mb-0.5">Name</span>
              <span className="text-brown font-medium">{user.name}</span>
            </div>
            <div>
              <span className="text-brown-muted block text-xs uppercase tracking-wider mb-0.5">Email</span>
              <span className="text-brown font-medium">{user.email}</span>
            </div>
            <div>
              <span className="text-brown-muted block text-xs uppercase tracking-wider mb-0.5">Phone</span>
              <span className="text-brown font-medium">{user.phone || 'Not provided'}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-sand-deep/50 rounded-xl p-6 bg-sand-soft/10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center mb-3">
              <Package className="w-6 h-6 text-gold-deep" />
            </div>
            <span className="text-2xl font-display text-brown font-medium">{ordersList.items.length}</span>
            <span className="text-sm text-brown-muted">Total Orders</span>
          </div>
          <div className="border border-sand-deep/50 rounded-xl p-6 bg-sand-soft/10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center mb-3">
              <Heart className="w-6 h-6 text-gold-deep" />
            </div>
            <span className="text-2xl font-display text-brown font-medium">{user.wishlist.length}</span>
            <span className="text-sm text-brown-muted">Wishlist Items</span>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-xl text-brown font-medium">Recent Orders</h2>
          <Link href="/account/orders" className="text-sm text-gold hover:text-gold-deep font-medium transition-colors">
            View All
          </Link>
        </div>
        
        {ordersList.items.length === 0 ? (
          <div className="border border-sand-deep/30 rounded-xl p-8 text-center bg-sand-soft/5">
            <p className="text-brown-muted mb-4">You haven't placed any orders yet.</p>
            <Link href="/shop" className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-gold text-white font-medium hover:bg-gold-deep transition-colors text-sm">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {ordersList.items.map((order) => (
              <div key={order.id} className="border border-sand-deep/30 rounded-lg p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-sand-deep transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium text-brown">{order.orderNumber}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-sand text-brown">
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-brown-muted">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {' • '}
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-sm text-brown font-medium">
                      ₹{(order.totals.total / 100).toFixed(2)}
                    </span>
                  </div>
                  <Link href={`/orders/${order.id}`} className="px-4 py-2 text-sm font-medium border border-sand-deep rounded-full text-brown hover:bg-sand-soft transition-colors">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
