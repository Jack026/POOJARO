'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

function formatMoney(paise: number) {
  return (paise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        // In a real app, these would be actual API endpoints.
        // For demonstration, simulating API responses if endpoints don't exist yet.
        const [analyticsRes, ordersRes, inventoryRes] = await Promise.all([
          fetch('/api/admin/analytics?range=30d').catch(() => null),
          fetch('/api/admin/orders?limit=5').catch(() => null),
          fetch('/api/admin/inventory?lowStock=true').catch(() => null),
        ]);

        // Mock data fallback for UI development
        const analytics = analyticsRes?.ok ? await analyticsRes.json() : {
          revenue: 12500000, // ₹1,25,000
          orders: 145,
          aov: 86206, // ₹862
          customers: 120,
          revenueByDay: Array.from({ length: 30 }).map((_, i) => ({
            day: i,
            value: Math.floor(Math.random() * 500000) + 100000,
          })),
        };

        const orders = ordersRes?.ok ? await ordersRes.json() : [
          { id: 'ORD-1001', customerName: 'Rahul Sharma', totalAmount: 150000, status: 'pending', createdAt: new Date().toISOString() },
          { id: 'ORD-1002', customerName: 'Priya Patel', totalAmount: 85000, status: 'processing', createdAt: new Date().toISOString() },
          { id: 'ORD-1003', customerName: 'Amit Kumar', totalAmount: 320000, status: 'shipped', createdAt: new Date().toISOString() },
          { id: 'ORD-1004', customerName: 'Neha Singh', totalAmount: 45000, status: 'delivered', createdAt: new Date().toISOString() },
          { id: 'ORD-1005', customerName: 'Vikram Das', totalAmount: 120000, status: 'cancelled', createdAt: new Date().toISOString() },
        ];

        const lowStock = inventoryRes?.ok ? await inventoryRes.json() : [
          { id: 'PROD-1', name: 'Premium Diwali Puja Kit', sku: 'KIT-DWL-01', stock: 5, threshold: 20 },
          { id: 'PROD-2', name: 'Sandalwood Incense Sticks', sku: 'INC-SND-01', stock: 12, threshold: 50 },
          { id: 'PROD-3', name: 'Pure Cow Ghee (500ml)', sku: 'GHE-COW-01', stock: 2, threshold: 10 },
        ];

        setData({ analytics, orders, lowStock });
      } catch (e) {
        console.error('Failed to load dashboard data', e);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <AdminShell>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent"></div>
        </div>
      </AdminShell>
    );
  }

  const { analytics, orders, lowStock } = data || {};
  const maxRevenue = Math.max(...(analytics?.revenueByDay?.map((d: any) => d.value) || [0]));

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-brown">Dashboard</h1>
          <p className="text-sm text-brown-muted">Overview of your store's performance in the last 30 days.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-sand-deep bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-brown-soft">Total Revenue</h3>
            <p className="mt-2 text-3xl font-semibold text-brown">{formatMoney(analytics?.revenue || 0)}</p>
          </div>
          <div className="rounded-xl border border-sand-deep bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-brown-soft">Orders</h3>
            <p className="mt-2 text-3xl font-semibold text-brown">{analytics?.orders || 0}</p>
          </div>
          <div className="rounded-xl border border-sand-deep bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-brown-soft">Average Order Value</h3>
            <p className="mt-2 text-3xl font-semibold text-brown">{formatMoney(analytics?.aov || 0)}</p>
          </div>
          <div className="rounded-xl border border-sand-deep bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-brown-soft">New Customers</h3>
            <p className="mt-2 text-3xl font-semibold text-brown">{analytics?.customers || 0}</p>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="rounded-xl border border-sand-deep bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-brown mb-6">Revenue (Last 30 Days)</h3>
          <div className="h-64 w-full flex items-end gap-1">
            {analytics?.revenueByDay?.map((day: any, i: number) => {
              const heightPercent = maxRevenue > 0 ? (day.value / maxRevenue) * 100 : 0;
              return (
                <div key={i} className="group relative flex-1 flex flex-col justify-end h-full">
                  <div 
                    className="w-full bg-gold/60 hover:bg-gold rounded-t-sm transition-all"
                    style={{ height: `${heightPercent}%` }}
                  />
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#24201D] text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 transition-opacity">
                    {formatMoney(day.value)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Orders */}
          <div className="lg:col-span-2 rounded-xl border border-sand-deep bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-brown">Recent Orders</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-sand-deep text-brown-muted">
                    <th className="pb-3 font-medium">Order</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-deep">
                  {orders?.map((order: any) => (
                    <tr key={order.id} className="hover:bg-sand-soft/30 transition-colors">
                      <td className="py-3 font-medium text-brown">{order.id}</td>
                      <td className="py-3 text-brown">{order.customerName}</td>
                      <td className="py-3 text-brown-muted">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          month: 'short', day: 'numeric'
                        })}
                      </td>
                      <td className="py-3"><StatusBadge status={order.status} /></td>
                      <td className="py-3 text-right font-medium text-brown">{formatMoney(order.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="rounded-xl border border-sand-deep bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-brown mb-4">Low Stock Alerts</h3>
            <div className="space-y-4">
              {lowStock?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between border-b border-sand-deep pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-brown truncate max-w-[180px]">{item.name}</p>
                    <p className="text-xs text-brown-muted">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-danger">{item.stock} left</p>
                    <p className="text-xs text-brown-muted">Min: {item.threshold}</p>
                  </div>
                </div>
              ))}
              {(!lowStock || lowStock.length === 0) && (
                <p className="text-sm text-brown-muted italic">All products are well stocked.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
