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

  const navItems = [
    { href: '/account', label: 'Profile', icon: User },
    { href: '/account/orders', label: 'Orders', icon: Package },
    { href: '/account/addresses', label: 'Addresses', icon: MapPin },
    { href: '/wishlist', label: 'Wishlist', icon: Heart },
  ];

  return (
    <div className="bg-ivory min-h-screen py-8 md:py-16">
      <div className="container-page max-w-6xl mx-auto">
        {/* Mobile Header Banner */}
        <div className="md:hidden bg-white p-4 rounded-xl border border-sand-deep/30 shadow-subtle mb-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl text-brown font-semibold">My Account</h1>
            <p className="text-xs text-brown-muted truncate max-w-[220px]">{session.email}</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="px-3 py-1.5 text-xs text-danger hover:bg-danger/5 rounded-lg border border-danger/20 font-medium transition-colors"
            >
              Logout
            </button>
          </form>
        </div>

        {/* Mobile Horizontal Pill Navigation Bar */}
        <div className="md:hidden mb-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-sand-deep/40 text-xs font-medium text-brown hover:bg-sand-soft whitespace-nowrap shadow-2xs shrink-0"
              >
                <Icon className="w-3.5 h-3.5 text-gold-deep" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Sidebar Navigation */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-subtle border border-sand-deep/30 overflow-hidden sticky top-28">
              <div className="p-6 bg-sand-soft/30 border-b border-sand-deep/30">
                <h2 className="font-display text-2xl text-brown font-medium">My Account</h2>
                <p className="text-sm text-brown-muted mt-1 truncate">{session.email}</p>
              </div>
              <nav className="flex flex-col p-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-brown hover:bg-sand-soft hover:text-gold-deep transition-colors text-sm font-medium"
                    >
                      <Icon className="w-4 h-4 text-gold-deep" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <div className="my-2 border-t border-sand-deep/30 mx-2"></div>
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-danger hover:bg-danger/5 transition-colors text-left text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </form>
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 bg-white rounded-xl shadow-subtle border border-sand-deep/30 p-5 sm:p-6 md:p-8 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
