'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingBag,
  Users,
  FolderTree,
  Calendar,
  Sparkles,
  Ticket,
  Image as ImageIcon,
  Star,
  Compass,
  BarChart3,
  Settings,
  Shield,
  ScrollText,
  Menu,
  X,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PeacockMini } from '@/components/peacock/PeacockMini';

const NAVIGATION = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Inventory', href: '/admin/inventory', icon: Warehouse },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree },
  { name: 'Occasions', href: '/admin/occasions', icon: Calendar },
  { name: 'Festivals', href: '/admin/festivals', icon: Sparkles },
  { name: 'Coupons', href: '/admin/coupons', icon: Ticket },
  { name: 'Banners', href: '/admin/banners', icon: ImageIcon },
  { name: 'Reviews', href: '/admin/reviews', icon: Star },
  { name: 'Ritual Finder', href: '/admin/ritual-finder', icon: Compass },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Admin Users', href: '/admin/admins', icon: Shield },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/admin/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/admin/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && mounted) {
          setAdminUser(data);
        }
      })
      .catch(() => {
        // network issue
      });
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (e) {
      console.error('Failed to log out', e);
    }
  };

  return (
    <div className="flex min-h-dvh bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-[#24201D] text-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <PeacockMini size={28} className="brightness-125" />
            <span className="font-display text-2xl font-bold tracking-wider text-white">
              POOJARO
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/70 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="h-[calc(100vh-4rem)] overflow-y-auto py-4">
          <ul className="space-y-1">
            {NAVIGATION.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/10 text-white border-l-4 border-[#B78332]'
                        : 'text-white/70 hover:bg-white/5 hover:text-white border-l-4 border-transparent',
                    )}
                  >
                    <Icon size={18} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-brown-muted hover:text-brown"
          >
            <Menu size={24} />
          </button>
          
          <div className="ml-auto flex items-center gap-3 md:gap-5">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-brown-muted hover:text-gold-deep transition-colors"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">View Store</span>
            </Link>

            <div className="h-4 w-px bg-sand-deep" />

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-brown">
                {adminUser?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-charcoal leading-tight">
                  {adminUser?.name || 'Store Owner'}
                </span>
                <span className="text-[10px] text-brown-muted capitalize leading-tight">
                  {adminUser?.role || 'owner'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs md:text-sm text-brown-muted hover:text-danger transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
