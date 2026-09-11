'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';
import { Order, OrderStatus } from '@/lib/data/types';
import {
  ORDER_STATUS_LABEL,
  ORDER_TRANSITIONS,
  ORDER_STATUS_DETAIL,
  canTransition,
} from '@/lib/domain/orders';
import { formatMoney } from '@/lib/format';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  CreditCard,
  User as UserIcon,
  MapPin,
  Calendar,
  AlertCircle,
  ExternalLink,
  Send,
  RefreshCw,
  XCircle,
  ShieldCheck,
  FileText,
  Mail,
  Phone,
  MessageSquare,
} from 'lucide-react';

const PROGRESS_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'pending', label: 'Placed' },
  { status: 'payment_confirmed', label: 'Confirmed' },
  { status: 'processing', label: 'Processing' },
  { status: 'packed', label: 'Packed' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'out_for_delivery', label: 'Out for Delivery' },
  { status: 'delivered', label: 'Delivered' },
];

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Form states
  const [selectedNextStatus, setSelectedNextStatus] = useState<OrderStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [courier, setCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [staffNote, setStaffNote] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [refundNote, setRefundNote] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      const data = await res.json();
      if (!data.error) {
        setOrder(data);
        setCourier(data.courier || 'Delhivery Express');
        setTrackingNumber(data.trackingNumber || '');
      }
    } catch (e) {
      console.error('Failed to load order', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const executeOrderAction = async (payload: any) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      if (res.ok && !updated.error) {
        setOrder(updated);
        setFeedback({ type: 'success', message: 'Order updated successfully. Notifications dispatched.' });
        setSelectedNextStatus('');
        setStatusNote('');
        setStaffNote('');
        setShowCancelModal(false);
        setShowRefundModal(false);
      } else {
        setFeedback({ type: 'error', message: updated.error || 'Failed to update order.' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Network error occurred.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = () => {
    if (!selectedNextStatus) return;
    executeOrderAction({
      action: 'status',
      status: selectedNextStatus,
      note: statusNote || `Status changed to ${ORDER_STATUS_LABEL[selectedNextStatus]}`,
    });
  };

  const handleSaveTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    executeOrderAction({
      action: 'tracking',
      tracking: {
        courier: courier || 'Delhivery Express',
        trackingNumber: trackingNumber.trim(),
      },
    });
  };

  const handleMarkPaid = () => {
    if (!confirm('Mark payment as PAID? This will update the ledger and trigger payment confirmation.')) return;
    executeOrderAction({
      action: 'payment',
      payment: { paymentStatus: 'paid' },
    });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffNote.trim()) return;
    executeOrderAction({
      action: 'note',
      note: staffNote.trim(),
    });
  };

  const handleCancelOrder = () => {
    if (!cancelReason.trim()) return;
    executeOrderAction({
      action: 'cancel',
      reason: cancelReason.trim(),
    });
  };

  const handleRefundOrder = () => {
    executeOrderAction({
      action: 'refund',
      note: refundNote.trim() || 'Refund processed by store manager',
    });
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="p-8 text-center text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold mb-3"></div>
          <p>Loading order details...</p>
        </div>
      </AdminShell>
    );
  }

  if (!order || (order as any).error || !order.id) {
    return (
      <AdminShell>
        <div className="p-8 max-w-lg mx-auto text-center space-y-4">
          <AlertCircle className="mx-auto text-red-500" size={48} />
          <h1 className="text-xl font-bold text-charcoal">Order Not Found</h1>
          <p className="text-sm text-gray-500">The requested order ID does not exist or has been deleted.</p>
          <Link
            href="/admin/orders"
            className="inline-block px-4 py-2 rounded-lg bg-gold text-white font-medium text-sm"
          >
            Back to Orders
          </Link>
        </div>
      </AdminShell>
    );
  }

  const allowedTransitions = ORDER_TRANSITIONS[order.status] || [];
  const currentStepIndex = PROGRESS_STEPS.findIndex((s) => s.status === order.status);
  const isTerminal = order.status === 'cancelled' || order.status === 'refunded';

  return (
    <AdminShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Top Breadcrumb & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="p-2 rounded-lg hover:bg-sand-soft text-gray-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-charcoal font-display">
                  Order {order.orderNumber}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    order.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : order.status === 'refunded'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {ORDER_STATUS_LABEL[order.status] || order.status}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-medium uppercase ${
                    order.paymentStatus === 'paid'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {order.paymentMethod.toUpperCase()} · {order.paymentStatus}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Placed on {new Date(order.createdAt).toLocaleString('en-IN')} · Internal ID: {order.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrder}
              disabled={actionLoading}
              className="px-3 py-2 rounded-lg border border-sand bg-white hover:bg-sand-soft/50 text-xs font-medium text-gray-600 flex items-center gap-1.5 transition-colors"
              title="Refresh order data"
            >
              <RefreshCw size={14} className={actionLoading ? 'animate-spin' : ''} />
              Sync
            </button>
            <Link
              href={`/orders/${order.orderNumber}`}
              target="_blank"
              className="px-3 py-2 rounded-lg border border-sand bg-white hover:bg-sand-soft/50 text-xs font-medium text-gold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink size={14} /> Customer View
            </Link>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-gray-400 hover:text-gray-600 font-bold ml-4"
            >
              &times;
            </button>
          </div>
        )}

        {/* Visual Progress Bar (Amazon-Style Timeline) */}
        {!isTerminal && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-sand">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-5">
              Fulfillment Journey &amp; Auto-Progression
            </h2>
            <div className="relative flex items-center justify-between">
              {/* Connector line */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-sand -z-0"></div>
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gold transition-all duration-500 -z-0"
                style={{
                  width: `${(Math.max(0, currentStepIndex) / (PROGRESS_STEPS.length - 1)) * 100}%`,
                }}
              ></div>

              {PROGRESS_STEPS.map((step, idx) => {
                const isCompleted = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.status} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                        isCompleted
                          ? 'bg-gold text-white ring-4 ring-gold/20'
                          : 'bg-white border-2 border-sand text-gray-400'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                    </div>
                    <span
                      className={`mt-2 text-[11px] font-medium whitespace-nowrap text-center ${
                        isCurrent
                          ? 'text-gold font-bold'
                          : isCompleted
                          ? 'text-charcoal'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Management Toolbar */}
        <div className="bg-sand-soft/40 p-5 rounded-xl border border-sand grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Changer */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw size={14} className="text-gold" /> Advance Order Status
            </label>
            <div className="flex gap-2">
              <select
                value={selectedNextStatus}
                onChange={(e) => setSelectedNextStatus(e.target.value as OrderStatus)}
                disabled={actionLoading || allowedTransitions.length === 0}
                className="flex-1 text-sm bg-white border border-sand rounded-lg px-3 py-2 text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="">
                  {allowedTransitions.length === 0
                    ? 'No further transitions allowed'
                    : 'Select Next Milestone...'}
                </option>
                {allowedTransitions.map((st) => (
                  <option key={st} value={st}>
                    &rarr; {ORDER_STATUS_LABEL[st] || st}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStatusChange}
                disabled={!selectedNextStatus || actionLoading}
                className="px-4 py-2 bg-gold hover:bg-gold-light disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Update Status
              </button>
            </div>
            {selectedNextStatus && (
              <input
                type="text"
                placeholder="Optional customer note for this status change..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="w-full text-xs bg-white border border-sand rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold/40"
              />
            )}
          </div>

          {/* Emergency & Financial Actions */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-gold" /> Payment &amp; Order Governance
            </label>
            <div className="flex flex-wrap gap-2">
              {order.paymentStatus !== 'paid' && order.status !== 'cancelled' && (
                <button
                  onClick={handleMarkPaid}
                  disabled={actionLoading}
                  className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <CreditCard size={14} /> Mark Paid (Cash/Bank)
                </button>
              )}

              {canTransition(order.status, 'cancelled') && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={actionLoading}
                  className="px-3.5 py-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <XCircle size={14} /> Cancel Order
                </button>
              )}

              {canTransition(order.status, 'refunded') && order.paymentStatus !== 'refunded' && (
                <button
                  onClick={() => setShowRefundModal(true)}
                  disabled={actionLoading}
                  className="px-3.5 py-2 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <CreditCard size={14} /> Issue Refund
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-500">
              Transactions are written to the audit log and trigger customer email receipts.
            </p>
          </div>
        </div>

        {/* 2-Column Core Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Items & Logistics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items Table */}
            <div className="bg-white rounded-xl shadow-sm border border-sand overflow-hidden">
              <div className="p-4 bg-sand-soft/50 border-b border-sand flex items-center justify-between">
                <h2 className="font-bold text-sm text-charcoal flex items-center gap-2">
                  <Package size={16} className="text-gold" /> Sacred Items Ordered ({order.items.length})
                </h2>
                <span className="text-xs font-medium text-gray-500">
                  Estimated Delivery:{' '}
                  {order.estimatedDelivery
                    ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : '3-5 Business Days'}
                </span>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-sand text-xs uppercase text-gray-400 bg-sand-soft/20">
                    <th className="p-4">Item &amp; SKU</th>
                    <th className="p-4 text-center">Unit Price</th>
                    <th className="p-4 text-center">Qty</th>
                    <th className="p-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand text-sm">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-sand-soft/10">
                      <td className="p-4">
                        <div className="font-semibold text-charcoal">{item.name}</div>
                        {item.variantLabel && (
                          <div className="text-xs text-gold font-medium">{item.variantLabel}</div>
                        )}
                        <div className="text-xs text-gray-400 font-mono">SKU: {item.sku}</div>
                      </td>
                      <td className="p-4 text-center text-gray-600">{formatMoney(item.unitPrice)}</td>
                      <td className="p-4 text-center font-bold text-charcoal">{item.qty}</td>
                      <td className="p-4 text-right font-bold text-brown">
                        {formatMoney(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="p-5 bg-sand-soft/30 border-t border-sand flex justify-end">
                <div className="w-full max-w-xs space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>{formatMoney(order.totals.subtotal)}</span>
                  </div>
                  {order.totals.couponDiscount > 0 && (
                    <div className="flex justify-between text-green-700 font-medium">
                      <span>Coupon ({order.totals.couponCode || 'Promo'}):</span>
                      <span>-{formatMoney(order.totals.couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee:</span>
                    <span>
                      {order.totals.shipping === 0 ? (
                        <strong className="text-green-700">FREE</strong>
                      ) : (
                        formatMoney(order.totals.shipping)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-charcoal pt-2 border-t border-sand">
                    <span>Total Amount:</span>
                    <span className="text-brown">{formatMoney(order.totals.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Courier & Tracking Assignment Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-sand space-y-4">
              <h2 className="font-bold text-sm text-charcoal flex items-center gap-2">
                <Truck size={16} className="text-gold" /> Logistics &amp; Courier Tracking
              </h2>
              <form onSubmit={handleSaveTracking} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">
                    Courier Partner
                  </label>
                  <select
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    className="w-full text-sm border border-sand rounded-lg p-2 bg-white"
                  >
                    <option value="Delhivery Express">Delhivery Express</option>
                    <option value="BlueDart">BlueDart</option>
                    <option value="DTDC Express">DTDC Express</option>
                    <option value="India Post Speed Post">India Post Speed Post</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">
                    Tracking Number (AWB)
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. DEL-IN-98214"
                    className="w-full text-sm border border-sand rounded-lg p-2 font-mono"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={actionLoading || !trackingNumber.trim()}
                    className="w-full py-2 px-4 bg-sand-deep hover:bg-brown text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Save Tracking
                  </button>
                </div>
              </form>
              {order.trackingNumber && (
                <div className="p-3 bg-sand-soft/40 rounded-lg text-xs flex items-center justify-between text-gray-600">
                  <span>
                    Current AWB: <strong className="font-mono text-charcoal">{order.trackingNumber}</strong> (
                    {order.courier || 'Delhivery'})
                  </span>
                  <a
                    href={`https://www.delhivery.com/track/package/${order.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:underline flex items-center gap-1 font-medium"
                  >
                    Delhivery Portal <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            {/* Complete Timeline Log */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-sand space-y-4">
              <h2 className="font-bold text-sm text-charcoal flex items-center gap-2">
                <Clock size={16} className="text-gold" /> Order Event Timeline
              </h2>
              <div className="space-y-4 pl-2 border-l-2 border-sand ml-2">
                {(order.timeline || []).map((event, i) => (
                  <div key={i} className="relative pl-5 text-sm space-y-0.5">
                    <div className="absolute -left-[9px] top-1.5 w-3.5 h-3.5 rounded-full bg-gold border-2 border-white"></div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-charcoal capitalize">
                        {ORDER_STATUS_LABEL[event.status] || event.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(event.at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {event.note && <p className="text-xs text-gray-600">{event.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Customer Details, Payments, Notes */}
          <div className="space-y-6">
            {/* Customer & Address Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-sand space-y-4">
              <h2 className="font-bold text-sm text-charcoal flex items-center gap-2">
                <UserIcon size={16} className="text-gold" /> Customer &amp; Recipient
              </h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block">Devotee Name</span>
                  <strong className="text-charcoal">{order.shippingAddress.fullName}</strong>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Email Address</span>
                  <a
                    href={`mailto:${order.email}`}
                    className="text-gold hover:underline flex items-center gap-1.5"
                  >
                    <Mail size={13} /> {order.email}
                  </a>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Phone Contact</span>
                  <div className="flex items-center gap-3 mt-0.5">
                    <a
                      href={`tel:${order.phone}`}
                      className="text-charcoal hover:text-gold flex items-center gap-1 text-xs"
                    >
                      <Phone size={13} className="text-gold" /> {order.phone}
                    </a>
                    <a
                      href={`https://wa.me/${order.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-700 hover:text-green-800 flex items-center gap-1 text-xs font-medium"
                    >
                      <MessageSquare size={13} /> WhatsApp
                    </a>
                  </div>
                </div>

                <div className="pt-2 border-t border-sand">
                  <span className="text-xs text-gray-400 block mb-1">Destination Address</span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {order.shippingAddress.line1}
                    {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}
                    <br />
                    {order.shippingAddress.landmark && (
                      <span>Landmark: {order.shippingAddress.landmark}<br /></span>
                    )}
                    <strong>
                      {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                      {order.shippingAddress.pincode}
                    </strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Audit Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-sand space-y-3">
              <h2 className="font-bold text-sm text-charcoal flex items-center gap-2">
                <CreditCard size={16} className="text-gold" /> Payment Record
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-sand">
                  <span className="text-gray-500">Method</span>
                  <span className="font-semibold text-charcoal uppercase">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-sand">
                  <span className="text-gray-500">Status</span>
                  <span
                    className={`font-bold uppercase ${
                      order.paymentStatus === 'paid'
                        ? 'text-green-700'
                        : order.paymentStatus === 'refunded'
                        ? 'text-purple-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
                {order.razorpayOrderId && (
                  <div className="flex justify-between py-1 border-b border-sand">
                    <span className="text-gray-500">Razorpay Order</span>
                    <span className="font-mono text-gray-700">{order.razorpayOrderId}</span>
                  </div>
                )}
                {order.razorpayPaymentId && (
                  <div className="flex justify-between py-1 border-b border-sand">
                    <span className="text-gray-500">Payment ID</span>
                    <span className="font-mono text-gray-700">{order.razorpayPaymentId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Internal Staff Notes */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-sand space-y-4">
              <h2 className="font-bold text-sm text-charcoal flex items-center gap-2">
                <FileText size={16} className="text-gold" /> Staff Internal Notes (
                {(order.internalNotes || []).length})
              </h2>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(order.internalNotes || []).length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No notes recorded yet.</p>
                ) : (
                  order.internalNotes.map((note, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-sand-soft/30 text-xs text-gray-700 border border-sand">
                      {note}
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  placeholder="Add confidential note (e.g. Customer requested extra tulsi leaves)..."
                  className="w-full p-2.5 text-xs border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/30 bg-white"
                  rows={2}
                />
                <button
                  type="submit"
                  disabled={actionLoading || !staffNote.trim()}
                  className="w-full py-1.5 bg-sand-deep hover:bg-brown text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send size={12} /> Post Note
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Cancellation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-sand space-y-4">
              <h3 className="text-lg font-bold text-charcoal">Cancel Order {order.orderNumber}?</h3>
              <p className="text-xs text-gray-600">
                Cancelling will restore inventory stock to products and kit components, update the timeline, and
                dispatch a cancellation notification email to the customer.
              </p>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">
                  Reason for Cancellation
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer changed mind, incorrect address provided..."
                  className="w-full p-2 text-sm border border-sand rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-sand-soft rounded-lg"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={actionLoading || !cancelReason.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Refund Modal */}
        {showRefundModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-sand space-y-4">
              <h3 className="text-lg font-bold text-charcoal">Process Refund for {order.orderNumber}?</h3>
              <p className="text-xs text-gray-600">
                Total refundable amount: <strong>{formatMoney(order.totals.total)}</strong>. This will record the
                refund in the financial audit log and notify the customer.
              </p>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Refund Note / Reference</label>
                <input
                  type="text"
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  placeholder="e.g. Returned unopened items, refund via UPI"
                  className="w-full p-2 text-sm border border-sand rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-sand-soft rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefundOrder}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Issue {formatMoney(order.totals.total)} Refund
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
