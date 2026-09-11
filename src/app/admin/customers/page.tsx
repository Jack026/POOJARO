'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';
import {
  Search,
  User as UserIcon,
  Mail,
  Phone,
  ShoppingBag,
  MapPin,
  Calendar,
  X,
  ExternalLink,
  CheckCircle2,
  Clock,
  ArrowRight,
  CreditCard,
  MessageSquare,
} from 'lucide-react';
import { formatMoney } from '@/lib/format';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<{
    customer: any;
    orders: any[];
    stats: any;
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetch('/api/admin/customers')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.items || [];
        setCustomers(list);
        setLoading(false);
      })
      .catch(() => {
        setCustomers([]);
        setLoading(false);
      });
  }, []);

  const handleSelectCustomer = async (customerId: string) => {
    setSelectedCustomerId(customerId);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`);
      const data = await res.json();
      if (!data.error) {
        setCustomerDetail(data);
      }
    } catch (e) {
      console.error('Failed to load customer details:', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    );
  });

  return (
    <AdminShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-charcoal">Customer Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              View customer profiles, address books, purchase histories, and lifetime values.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/30 bg-white"
            />
          </div>
        </div>

        {/* Customer Directory Table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-sand p-12 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold mb-3"></div>
            <p>Loading customers directory...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-sand overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-sand-soft/50 border-b border-sand text-xs font-semibold uppercase tracking-wider text-charcoal/70">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4 text-center">Orders</th>
                    <th className="p-4 text-right">Lifetime Spend</th>
                    <th className="p-4 text-center">Marketing</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand text-sm">
                  {filteredCustomers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleSelectCustomer(c.id)}
                      className="hover:bg-sand-soft/30 transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-sand-soft flex items-center justify-center font-bold text-brown">
                            {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div className="font-semibold text-charcoal">{c.name || 'Unnamed Devotee'}</div>
                            <div className="text-xs text-gray-400">ID: {c.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-charcoal flex items-center gap-1.5">
                          <Mail size={14} className="text-gray-400" />
                          <span>{c.email}</span>
                        </div>
                        {c.phone && (
                          <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <Phone size={13} className="text-gray-400" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sand-soft text-brown">
                          {c.ordersCount ?? 0} {c.ordersCount === 1 ? 'order' : 'orders'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold text-charcoal">
                        {formatMoney(c.totalSpend ?? 0)}
                      </td>
                      <td className="p-4 text-center">
                        {c.marketingOptIn ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                            Opted In
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCustomer(c.id);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gold hover:bg-gold/10 border border-gold/30 transition-colors inline-flex items-center gap-1"
                        >
                          View Details &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-500">
                        No customers found matching &quot;{search}&quot;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customer Inspection Slide-over Drawer */}
        {selectedCustomerId && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-sand animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-6 border-b border-sand bg-sand-soft/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center font-bold text-lg text-brown border border-gold/30">
                    {customerDetail?.customer?.name
                      ? customerDetail.customer.name.charAt(0).toUpperCase()
                      : 'C'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-charcoal">
                      {customerDetail?.customer?.name || 'Customer Details'}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Member since{' '}
                      {customerDetail?.customer?.createdAt
                        ? new Date(customerDetail.customer.createdAt).toLocaleDateString('en-IN', {
                            month: 'long',
                            year: 'numeric',
                          })
                        : '—'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedCustomerId(null);
                    setCustomerDetail(null);
                  }}
                  className="p-2 rounded-full hover:bg-sand-soft text-gray-500 hover:text-charcoal transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loadingDetail ? (
                  <div className="py-20 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold mb-3"></div>
                    <p>Loading customer profile &amp; order history...</p>
                  </div>
                ) : customerDetail ? (
                  <>
                    {/* KPI Metrics */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-sand-soft/40 p-4 rounded-xl border border-sand">
                        <span className="text-xs font-medium text-gray-500 block">Total Orders</span>
                        <span className="text-xl font-bold text-charcoal mt-1 block">
                          {customerDetail.stats?.totalOrders ?? 0}
                        </span>
                      </div>
                      <div className="bg-sand-soft/40 p-4 rounded-xl border border-sand">
                        <span className="text-xs font-medium text-gray-500 block">Lifetime Spend</span>
                        <span className="text-xl font-bold text-brown mt-1 block">
                          {formatMoney(customerDetail.stats?.totalSpend ?? 0)}
                        </span>
                      </div>
                      <div className="bg-sand-soft/40 p-4 rounded-xl border border-sand">
                        <span className="text-xs font-medium text-gray-500 block">Average Order</span>
                        <span className="text-xl font-bold text-charcoal mt-1 block">
                          {formatMoney(customerDetail.stats?.averageOrderValue ?? 0)}
                        </span>
                      </div>
                    </div>

                    {/* Contact Channels */}
                    <div className="bg-white p-4 rounded-xl border border-sand space-y-3">
                      <h3 className="font-semibold text-xs uppercase tracking-wider text-gray-400">
                        Contact Information
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <a
                          href={`mailto:${customerDetail.customer.email}`}
                          className="flex items-center gap-2 text-charcoal hover:text-gold transition-colors"
                        >
                          <Mail size={16} className="text-gold" />
                          <span>{customerDetail.customer.email}</span>
                        </a>
                        {customerDetail.customer.phone && (
                          <a
                            href={`tel:${customerDetail.customer.phone}`}
                            className="flex items-center gap-2 text-charcoal hover:text-gold transition-colors"
                          >
                            <Phone size={16} className="text-gold" />
                            <span>{customerDetail.customer.phone}</span>
                          </a>
                        )}
                        {customerDetail.customer.phone && (
                          <a
                            href={`https://wa.me/${customerDetail.customer.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-green-700 hover:text-green-800 transition-colors"
                          >
                            <MessageSquare size={16} />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Saved Addresses */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm text-charcoal flex items-center gap-2">
                        <MapPin size={16} className="text-gold" />
                        Saved Addresses ({(customerDetail.customer.addresses || []).length})
                      </h3>
                      {(customerDetail.customer.addresses || []).length === 0 ? (
                        <p className="text-sm text-gray-500 bg-sand-soft/20 p-4 rounded-lg border border-sand">
                          No saved addresses on profile.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {customerDetail.customer.addresses.map((addr: any, i: number) => (
                            <div
                              key={i}
                              className="p-3.5 rounded-lg border border-sand bg-white text-xs space-y-1 relative"
                            >
                              {addr.isDefault && (
                                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-gold/15 text-gold font-bold text-[10px] rounded-full">
                                  Default
                                </span>
                              )}
                              <div className="font-semibold text-charcoal text-sm">{addr.fullName}</div>
                              <div className="text-gray-500">{addr.phone}</div>
                              <div className="text-gray-600">
                                {addr.line1}
                                {addr.line2 ? `, ${addr.line2}` : ''}
                              </div>
                              {addr.landmark && (
                                <div className="text-gray-400">Landmark: {addr.landmark}</div>
                              )}
                              <div className="font-medium text-charcoal">
                                {addr.city}, {addr.state} - {addr.pincode}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Order History */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm text-charcoal flex items-center gap-2">
                        <ShoppingBag size={16} className="text-gold" />
                        Order History ({(customerDetail.orders || []).length})
                      </h3>
                      {(customerDetail.orders || []).length === 0 ? (
                        <p className="text-sm text-gray-500 bg-sand-soft/20 p-4 rounded-lg border border-sand">
                          Customer has not placed any orders yet.
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {customerDetail.orders.map((ord: any) => (
                            <div
                              key={ord.id}
                              className="p-4 rounded-xl border border-sand bg-white hover:border-gold/40 transition-colors flex items-center justify-between"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-charcoal text-sm">
                                    {ord.orderNumber}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                                      ord.status === 'delivered'
                                        ? 'bg-green-100 text-green-800'
                                        : ord.status === 'cancelled'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {ord.status}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase ${
                                      ord.paymentStatus === 'paid'
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-amber-50 text-amber-700'
                                    }`}
                                  >
                                    {ord.paymentMethod} · {ord.paymentStatus}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}{' '}
                                  · {(ord.items || []).length} item
                                  {(ord.items || []).length === 1 ? '' : 's'}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="font-bold text-charcoal text-sm">
                                  {formatMoney(ord.totals?.total ?? 0)}
                                </span>
                                <Link
                                  href={`/admin/orders/${ord.id}`}
                                  className="p-1.5 rounded-lg text-gold hover:bg-gold/10 border border-gold/30 transition-colors"
                                  title="View Order Details"
                                >
                                  <ArrowRight size={16} />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-gray-500">No customer details available.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
