'use client';
import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Order } from '@/lib/data/types';
import Link from 'next/link';
import { Eye } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetch('/api/admin/orders')
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }, []);

  const filteredOrders = statusFilter 
    ? orders.filter(o => o.status === statusFilter)
    : orders;

  return (
    <AdminShell>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-charcoal">Orders</h1>
          <select 
            className="border border-sand rounded-md p-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-sand overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-ivory border-b border-sand">
                  <th className="p-4 font-medium text-charcoal">Order #</th>
                  <th className="p-4 font-medium text-charcoal">Customer</th>
                  <th className="p-4 font-medium text-charcoal">Items</th>
                  <th className="p-4 font-medium text-charcoal">Total</th>
                  <th className="p-4 font-medium text-charcoal">Payment</th>
                  <th className="p-4 font-medium text-charcoal">Status</th>
                  <th className="p-4 font-medium text-charcoal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id} className="border-b border-sand hover:bg-ivory/50">
                    <td className="p-4">{order.orderNumber}</td>
                    <td className="p-4">
                      <div className="font-medium text-charcoal">{order.shippingAddress.fullName}</div>
                      <div className="text-sm text-gray-500">{order.email}</div>
                    </td>
                    <td className="p-4">{order.items.length} items</td>
                    <td className="p-4">₹{(order.totals.total / 100).toLocaleString('en-IN')}</td>
                    <td className="p-4 text-sm capitalize">{order.paymentMethod} - {order.paymentStatus}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link href={`/admin/orders/${order.id}`} className="text-gold hover:text-gold/80 flex items-center gap-1">
                        <Eye size={16} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">No orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
