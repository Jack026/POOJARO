'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';
import { Order, OrderStatus } from '@/lib/data/types';
import { ORDER_STATUS_LABEL } from '@/lib/domain/orders';
import { formatMoney } from '@/lib/format';
import {
  Search,
  Eye,
  Filter,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  CreditCard,
  RefreshCw,
} from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const fetchOrders = () => {
    setLoading(true);
    fetch('/api/admin/orders')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.items || [];
        setOrders(list);
        setLoading(false);
      })
      .catch(() => {
        setOrders([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const orderList = Array.isArray(orders) ? orders : [];

  const filteredOrders = orderList.filter((order) => {
    if (statusFilter && order.status !== statusFilter) return false;
    if (paymentFilter && order.paymentStatus !== paymentFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchNumber = (order.orderNumber || '').toLowerCase().includes(q);
      const matchCustomer = (order.shippingAddress?.fullName || '').toLowerCase().includes(q);
      const matchEmail = (order.email || '').toLowerCase().includes(q);
      const matchPhone = (order.phone || '').includes(q);
      if (!matchNumber && !matchCustomer && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  // Calculate top KPI counters
  const totalRevenuePaise = orderList.reduce((sum, o) => {
    return o.paymentStatus === 'paid' ? sum + (o.totals?.total || 0) : sum;
  }, 0);
  const pendingCount = orderList.filter((o) => ['pending', 'payment_confirmed', 'processing'].includes(o.status)).length;
  const inTransitCount = orderList.filter((o) => ['packed', 'shipped', 'out_for_delivery'].includes(o.status)).length;
  const deliveredCount = orderList.filter((o) => o.status === 'delivered').length;

  return (
    <AdminShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header & KPI Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-charcoal font-display">Orders &amp; Shipments</h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitor customer purchases, Amazon-style progression milestones, tracking, and payments.
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="px-3.5 py-2 rounded-lg border border-sand bg-white hover:bg-sand-soft text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh List
          </button>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-sand shadow-sm">
            <span className="text-xs font-semibold uppercase text-gray-400 block">Total Orders</span>
            <span className="text-2xl font-bold text-charcoal mt-1 block">{orderList.length}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-sand shadow-sm">
            <span className="text-xs font-semibold uppercase text-gray-400 block">Paid Revenue</span>
            <span className="text-2xl font-bold text-brown mt-1 block">{formatMoney(totalRevenuePaise)}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-sand shadow-sm">
            <span className="text-xs font-semibold uppercase text-amber-600 block">Processing &amp; Pending</span>
            <span className="text-2xl font-bold text-amber-700 mt-1 block">{pendingCount}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-sand shadow-sm">
            <span className="text-xs font-semibold uppercase text-blue-600 block">In Transit / Shipped</span>
            <span className="text-2xl font-bold text-blue-700 mt-1 block">{inTransitCount}</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-sand shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by Order #, name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>

          <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
            {/* Status dropdown */}
            <select
              className="border border-sand rounded-lg px-3 py-2 text-xs bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/30"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Fulfillment Statuses</option>
              <option value="pending">Order Placed (Pending)</option>
              <option value="payment_confirmed">Payment Confirmed</option>
              <option value="processing">Processing &amp; Verification</option>
              <option value="packed">Packed &amp; Courier Assigned</option>
              <option value="shipped">In Transit (Shipped)</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Payment filter */}
            <select
              className="border border-sand rounded-lg px-3 py-2 text-xs bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/30"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>

            {(statusFilter || paymentFilter || search) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setPaymentFilter('');
                  setSearch('');
                }}
                className="text-xs text-gold hover:underline px-2 py-2 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-sand p-12 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold mb-3"></div>
            <p>Loading orders records...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-sand overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-sand-soft/50 border-b border-sand text-xs font-semibold uppercase tracking-wider text-charcoal/70">
                    <th className="p-4">Order #</th>
                    <th className="p-4">Customer &amp; Location</th>
                    <th className="p-4">Items</th>
                    <th className="p-4 text-right">Total Amount</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Fulfillment Status</th>
                    <th className="p-4">Courier / AWB</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand text-sm">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-sand-soft/20 transition-colors">
                      <td className="p-4 font-bold text-charcoal font-display">
                        <Link href={`/admin/orders/${order.id}`} className="hover:text-gold transition-colors">
                          {order.orderNumber}
                        </Link>
                        <div className="text-[11px] text-gray-400 font-sans font-normal">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-charcoal">
                          {order.shippingAddress?.fullName || '—'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.shippingAddress?.city}, {order.shippingAddress?.state}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-gray-600">
                        {order.items?.length || 0} item{(order.items?.length || 0) === 1 ? '' : 's'}
                      </td>
                      <td className="p-4 text-right font-bold text-brown">
                        {formatMoney(order.totals?.total ?? 0)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${
                            order.paymentStatus === 'paid'
                              ? 'bg-green-50 text-green-700'
                              : order.paymentStatus === 'refunded'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {order.paymentMethod} · {order.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            order.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : order.status === 'refunded'
                              ? 'bg-purple-100 text-purple-800'
                              : order.status === 'shipped' || order.status === 'out_for_delivery'
                              ? 'bg-purple-50 text-purple-700'
                              : order.status === 'packed'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {ORDER_STATUS_LABEL[order.status] || order.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs">
                        {order.trackingNumber ? (
                          <div>
                            <span className="font-mono text-gray-700">{order.trackingNumber}</span>
                            <div className="text-[10px] text-gray-400">{order.courier || 'Delhivery'}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sand-soft hover:bg-gold/20 text-brown hover:text-gold transition-colors inline-flex items-center gap-1"
                        >
                          <Eye size={13} /> Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-gray-500">
                        No orders match the selected search &amp; filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
