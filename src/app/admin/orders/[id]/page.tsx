'use client';
import { useState, useEffect, use } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Order, OrderStatus } from '@/lib/data/types';
import Link from 'next/link';

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
      });
  }, [id]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setStatusUpdating(true);
    try {
      await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', status: newStatus, note: 'Status updated by admin' })
      });
      setOrder({ ...order, status: newStatus });
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) return <AdminShell><div className="p-6">Loading...</div></AdminShell>;
  if (!order) return <AdminShell><div className="p-6">Order not found</div></AdminShell>;

  return (
    <AdminShell>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Link href="/admin/orders" className="text-gold hover:underline mb-4 inline-block">&larr; Back to Orders</Link>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-sand flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-charcoal">Order {order.orderNumber}</h1>
            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 capitalize">{order.status}</span>
            <select 
              value={order.status}
              onChange={e => handleStatusChange(e.target.value as OrderStatus)}
              disabled={statusUpdating}
              className="border border-sand rounded p-1 text-sm"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-sand">
            <h2 className="font-semibold text-charcoal mb-4">Customer Details</h2>
            <p><strong>Name:</strong> {order.shippingAddress.fullName}</p>
            <p><strong>Email:</strong> {order.email}</p>
            <p><strong>Phone:</strong> {order.phone}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-sand">
            <h2 className="font-semibold text-charcoal mb-4">Shipping Address</h2>
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-sand overflow-hidden">
          <h2 className="font-semibold text-charcoal p-4 border-b border-sand bg-ivory">Order Items</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-sand text-sm">
                <th className="p-4">Item</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Qty</th>
                <th className="p-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx} className="border-b border-sand">
                  <td className="p-4">{item.name}</td>
                  <td className="p-4">{item.sku}</td>
                  <td className="p-4">{item.qty}</td>
                  <td className="p-4">₹{(item.lineTotal / 100).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-ivory flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-600">Subtotal: ₹{(order.totals.subtotal / 100).toLocaleString('en-IN')}</p>
              <p className="text-sm text-gray-600">Shipping: ₹{(order.totals.shipping / 100).toLocaleString('en-IN')}</p>
              <p className="font-bold text-lg mt-2 text-charcoal">Total: ₹{(order.totals.total / 100).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
