import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCustomerSession } from '@/lib/auth/guards';
import { User, Package, MapPin, Heart, LogOut } from 'lucide-react';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCustomerSession();
  
  if (!session) {
    redirect('/login?returnTo=/account');
  }

  return (
    <div className="bg-ivory min-h-screen py-12 md:py-20">
      <div className="container-page max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-subtle border border-sand-deep/30 overflow-hidden sticky top-24">
              <div className="p-6 bg-sand-soft/30 border-b border-sand-deep/30">
                <h2 className="font-display text-2xl text-brown font-medium">My Account</h2>
                <p className="text-sm text-brown-muted mt-1 truncate">{session.email}</p>
              </div>
              <nav className="flex flex-col p-2">
                <Link href="/account" className="flex items-center gap-3 px-4 py-3 rounded-lg text-brown hover:bg-sand-soft hover:text-gold-deep transition-colors">
                  <User className="w-5 h-5 text-gold" />
                  <span className="font-medium">Profile</span>
                </Link>
                <Link href="/account/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg text-brown hover:bg-sand-soft hover:text-gold-deep transition-colors">
                  <Package className="w-5 h-5 text-gold" />
                  <span className="font-medium">Orders</span>
                </Link>
                <Link href="/account/addresses" className="flex items-center gap-3 px-4 py-3 rounded-lg text-brown hover:bg-sand-soft hover:text-gold-deep transition-colors">
                  <MapPin className="w-5 h-5 text-gold" />
                  <span className="font-medium">Addresses</span>
                </Link>
                <Link href="/wishlist" className="flex items-center gap-3 px-4 py-3 rounded-lg text-brown hover:bg-sand-soft hover:text-gold-deep transition-colors">
                  <Heart className="w-5 h-5 text-gold" />
                  <span className="font-medium">Wishlist</span>
                </Link>
                <div className="my-2 border-t border-sand-deep/30 mx-2"></div>
                <form action="/api/auth/logout" method="POST">
                  <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-danger hover:bg-danger/5 transition-colors text-left">
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </form>
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 bg-white rounded-xl shadow-subtle border border-sand-deep/30 p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
