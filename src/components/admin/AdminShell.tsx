'use client';

import { useState, useEffect, useRef } from 'react';
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
  Database,
  Settings,
  Shield,
  ScrollText,
  Menu,
  X,
  LogOut,
  ExternalLink,
  Bell,
  Check,
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
  { name: 'Storage & Buckets', href: '/admin/storage', icon: Database },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Admin Users', href: '/admin/admins', icon: Shield },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string; role: string } | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = () => {
    fetch('/api/admin/notifications?limit=25')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      })
      .catch(() => {});
  };

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
      .catch(() => {});

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [router]);

  // Close notifications dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (e) {
      console.error('Failed to log out', e);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error('Failed to mark notifications read', e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6 shadow-sm relative z-30">
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

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-gray-500 hover:text-[#B78332] transition-colors rounded-full hover:bg-gray-100"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Panel */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E8DDCA] rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3.5 bg-[#FAF8F3] border-b border-[#E8DDCA] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#3A2118] uppercase tracking-wider">
                        Store Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] bg-[#B78332] text-white px-1.5 py-0.5 rounded-full font-semibold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-[#B78332] hover:underline font-semibold flex items-center gap-1"
                      >
                        <Check size={12} />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-gray-400">
                        No notifications recorded yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            'p-3.5 hover:bg-gray-50 transition-colors text-left',
                            !n.isRead ? 'bg-amber-50/40' : 'bg-white'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-[#3A2118] leading-snug">
                              {n.title}
                            </span>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-[#B78332] shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 whitespace-pre-line leading-relaxed">
                            {n.body}
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-1 text-[10px] text-gray-400">
                            <span>{new Date(n.createdAt).toLocaleString('en-IN')}</span>
                            {n.href && (
                              <Link
                                href={n.href}
                                onClick={() => setNotifOpen(false)}
                                className="text-[#B78332] font-semibold hover:underline"
                              >
                                View Details →
                              </Link>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
