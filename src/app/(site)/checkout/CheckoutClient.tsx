'use client';

/**
 * CheckoutClient — multi-step checkout wizard (§26, §53, §59, §64).
 *
 * Step 1: Delivery address (with India pincode auto-detection)
 * Step 2: Review cart + apply coupon (totals fetched server-side via cart-store sync)
 * Step 3: Payment method selection (Cash on Delivery + Online Payment via Razorpay)
 *
 * Critical: prices, stock, and order totals are NEVER trusted from this component.
 * The client holds only { productId, variantId, qty, couponCode }; placeOrder
 * re-prices and re-checks stock atomically on the server (§53, §59).
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import {
  ChevronRight,
  ChevronLeft,
  MapPin,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  Lock,
  ShieldCheck,
  Smartphone,
  Check,
} from 'lucide-react';
import { useCartStore } from '@/components/cart/cart-store';
import { placeOrderAction } from './actions';
import { resolvePincode, type PincodeLocation } from '@/lib/domain/pincodes';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';

type Step = 'address' | 'review' | 'payment' | 'success';

interface AddressForm {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
}

const EMPTY_ADDRESS: AddressForm = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
};

export function CheckoutClient() {
  const {
    items,
    pricedCart,
    couponCode,
    applyCoupon,
    removeCoupon,
    clearCart,
    syncCart,
  } = useCartStore();
  const totals = pricedCart?.totals;
  const lines = pricedCart?.lines ?? [];
  const [step, setStep] = useState<Step>('address');
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm | 'email', string>>>({});
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('razorpay');
  const [isPlacing, setIsPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<{ orderNumber: string; id: string } | null>(null);
  const [confirmedPaymentMethod, setConfirmedPaymentMethod] = useState<'cod' | 'razorpay'>('razorpay');
  const [detectedLocation, setDetectedLocation] = useState<PincodeLocation | null>(null);

  // Online payment modal & sandbox states
  const [onlineIntent, setOnlineIntent] = useState<any>(null);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [payingOnline, setPayingOnline] = useState(false);
  const [selectedOnlineMethod, setSelectedOnlineMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');

  // Auto-detect location when pincode is 6 digits
  useEffect(() => {
    if (address.pincode && address.pincode.length === 6) {
      const loc = resolvePincode(address.pincode);
      if (loc) {
        setDetectedLocation(loc);
        setAddress((prev) => ({
          ...prev,
          city: prev.city || loc.city || loc.place,
          state: prev.state || loc.state,
        }));
      }
    }
  }, [address.pincode]);

  const handlePincodeChange = (value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 6);
    setAddress((prev) => ({ ...prev, pincode: clean }));

    if (clean.length === 6) {
      const loc = resolvePincode(clean);
      if (loc) {
        setDetectedLocation(loc);
        setAddress((prev) => ({
          ...prev,
          pincode: clean,
          city: loc.city || loc.place,
          state: loc.state,
        }));
        setErrors((prev) => {
          const next = { ...prev };
          delete next.pincode;
          delete next.city;
          delete next.state;
          return next;
        });
      } else {
        setDetectedLocation(null);
      }
    } else {
      setDetectedLocation(null);
    }
  };

  // Keep cart totals in sync with server pricing
  useEffect(() => {
    syncCart();
  }, [syncCart]);

  function validateAddress(): boolean {
    const next: Partial<Record<keyof AddressForm | 'email', string>> = {};

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (!address.pincode.trim() || !/^\d{6}$/.test(address.pincode.trim())) {
      next.pincode = 'Enter a valid 6-digit Indian PIN code.';
    }
    if (!address.fullName.trim()) next.fullName = 'Full name is required.';
    if (!address.phone.trim() || !/^\d{10}$/.test(address.phone.replace(/\D/g, ''))) {
      next.phone = 'Enter a valid 10-digit mobile number.';
    }
    if (!address.line1.trim()) next.line1 = 'Address line 1 is required.';
    if (!address.city.trim()) next.city = 'City is required.';
    if (!address.state.trim()) next.state = 'State is required.';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handlePlaceOrder() {
    setIsPlacing(true);
    setPlaceError(null);

    const result = await placeOrderAction({
      email: email.trim(),
      phone: address.phone.trim(),
      items,
      couponCode,
      shippingAddress: {
        id: 'checkout',
        label: 'Delivery',
        fullName: address.fullName.trim(),
        phone: address.phone.trim(),
        line1: address.line1.trim(),
        line2: address.line2.trim(),
        landmark: address.landmark.trim(),
        city: address.city.trim(),
        state: address.state,
        pincode: address.pincode.trim(),
        isDefault: false,
      },
      paymentMethod: paymentMethod === 'razorpay' ? 'card' : 'cod',
    });

    if (!result.ok) {
      setIsPlacing(false);
      setPlaceError(result.message);
      return;
    }

    // If Cash on Delivery, complete immediately
    if (paymentMethod === 'cod') {
      setIsPlacing(false);
      clearCart();
      setConfirmedPaymentMethod('cod');
      setSuccessOrder({ orderNumber: result.orderNumber, id: result.orderId });
      setStep('success');
      return;
    }

    // Online Payment via Razorpay
    try {
      const intentRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: result.orderId }),
      });
      const intent = await intentRes.json();

      if (!intentRes.ok || intent.error) {
        throw new Error(intent.error || 'Failed to initiate online payment.');
      }

      // Check if real Razorpay SDK is loaded and credentials are not mock
      if (!intent.isMock && typeof window !== 'undefined' && (window as any).Razorpay) {
        const rzp = new (window as any).Razorpay({
          key: intent.keyId,
          amount: intent.amount,
          currency: intent.currency,
          name: 'POOJARO Sacred Rituals',
          description: `Order ${result.orderNumber}`,
          order_id: intent.gatewayOrderId,
          prefill: {
            name: address.fullName,
            email: email,
            contact: address.phone,
          },
          theme: { color: '#B78332' },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: result.orderId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                clearCart();
                setConfirmedPaymentMethod('razorpay');
                setSuccessOrder({ orderNumber: result.orderNumber, id: result.orderId });
                setStep('success');
              } else {
                setPlaceError('Online payment signature verification failed.');
              }
            } catch (vErr: any) {
              setPlaceError(vErr.message || 'Payment verification failed.');
            } finally {
              setIsPlacing(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsPlacing(false);
              setPlaceError('Online payment window closed. You can retry anytime.');
            },
          },
        });
        rzp.open();
      } else {
        // Fallback to seamless Test Sandbox Payment Gateway
        setOnlineIntent({
          ...intent,
          orderId: result.orderId,
          orderNumber: result.orderNumber,
        });
        setShowOnlineModal(true);
        setIsPlacing(false);
      }
    } catch (err: any) {
      setIsPlacing(false);
      setPlaceError(err.message || 'Online payment initiation failed.');
    }
  }

  // Handle test gateway simulation
  async function handleSimulateOnlinePayment(success = true) {
    if (!onlineIntent) return;
    setPayingOnline(true);
    setPlaceError(null);

    if (!success) {
      setTimeout(() => {
        setPayingOnline(false);
        setShowOnlineModal(false);
        setPlaceError('Payment authorization was cancelled by the bank.');
      }, 500);
      return;
    }

    try {
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: onlineIntent.orderId,
          razorpayOrderId: onlineIntent.gatewayOrderId,
          razorpayPaymentId: `pay_sim_${Date.now().toString(36)}`,
          razorpaySignature: 'test_signature_success',
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        clearCart();
        setShowOnlineModal(false);
        setConfirmedPaymentMethod('razorpay');
        setSuccessOrder({ orderNumber: onlineIntent.orderNumber, id: onlineIntent.orderId });
        setStep('success');
      } else {
        setPlaceError('Payment simulation failed.');
      }
    } catch (err: any) {
      setPlaceError(err.message || 'Payment simulation failed.');
    } finally {
      setPayingOnline(false);
    }
  }

  if (step === 'success' && successOrder) {
    return (
      <div className="py-12 text-center max-w-sm mx-auto">
        <CheckCircle2 className="w-14 h-14 text-success mx-auto mb-5" aria-hidden />
        <h2 className="font-display text-display-sm text-brown mb-2">Order Confirmed!</h2>

        {confirmedPaymentMethod === 'razorpay' ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-800 text-xs font-semibold mb-3 border border-green-200">
            <ShieldCheck size={14} className="text-green-600" />
            Paid Online &bull; Instant Confirmation
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-3 border border-amber-200">
            Cash on Delivery &bull; Pay when delivered
          </div>
        )}

        <p className="text-brown-soft text-sm mb-1">
          Order Reference: <span className="font-bold text-brown font-display text-base">{successOrder.orderNumber}</span>
        </p>
        <p className="text-brown-soft text-xs mb-8">
          Detailed order confirmation receipt has been dispatched to <strong>{email}</strong>.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href={`/orders/${successOrder.orderNumber}`}
            className="rounded-lg bg-brown text-sand-soft px-5 py-2.5 text-sm font-medium hover:bg-brown/90 transition-colors text-center shadow-subtle hover:shadow-lift"
          >
            Track Order Live &rarr;
          </Link>
          <Link href="/shop" className="text-sm text-gold-deep underline underline-offset-2">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-10 max-w-4xl">
      {/* Razorpay Standard Checkout SDK */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div>
        <StepIndicator current={step} />

        {step === 'address' && (
          <div>
            <h2 className="font-display text-display-sm text-brown mb-6">Delivery details</h2>
            <div className="grid gap-5">
              <FieldRow label="Email address" required id="email" error={errors.email}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => {
                    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                      setErrors((p) => ({ ...p, email: 'Enter a valid email address.' }));
                    } else {
                      setErrors((p) => { const n = { ...p }; delete n.email; return n; });
                    }
                  }}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={inputClass(Boolean(errors.email))}
                />
              </FieldRow>

              <div className="p-4 rounded-xl border border-sand-deep/70 bg-sand-soft/20 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gold-deep" />
                  <span className="text-xs font-bold uppercase tracking-wider text-brown">Delivery Pincode First</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 items-start">
                  <FieldRow label="PIN Code (6 digits)" required id="pincode" error={errors.pincode}>
                    <input
                      id="pincode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={address.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="e.g. 110001, 400001"
                      className={inputClass(Boolean(errors.pincode))}
                    />
                  </FieldRow>

                  {detectedLocation && (
                    <div className="mt-6 p-2.5 rounded-lg bg-sand-soft/50 border border-sand-deep/40 text-xs">
                      <div className="text-brown-muted font-medium">Auto-detected Location:</div>
                      <div className="font-semibold text-brown text-sm mt-0.5">
                        {detectedLocation.place}, {detectedLocation.state}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FieldRow label="Full name" required id="fullName" error={errors.fullName}>
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    value={address.fullName}
                    onChange={(e) => setAddress((p) => ({ ...p, fullName: e.target.value }))}
                    className={inputClass(Boolean(errors.fullName))}
                  />
                </FieldRow>

                <FieldRow label="Mobile number (10 digits)" required id="phone" error={errors.phone}>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="numeric"
                    value={address.phone}
                    onChange={(e) => setAddress((p) => ({ ...p, phone: e.target.value }))}
                    className={inputClass(Boolean(errors.phone))}
                  />
                </FieldRow>
              </div>

              <FieldRow label="House / Flat / Block, Street" required id="line1" error={errors.line1}>
                <input
                  id="line1"
                  type="text"
                  autoComplete="address-line1"
                  value={address.line1}
                  onChange={(e) => setAddress((p) => ({ ...p, line1: e.target.value }))}
                  className={inputClass(Boolean(errors.line1))}
                />
              </FieldRow>

              <FieldRow label="Apartment, suite, unit (optional)" id="line2">
                <input
                  id="line2"
                  type="text"
                  autoComplete="address-line2"
                  value={address.line2}
                  onChange={(e) => setAddress((p) => ({ ...p, line2: e.target.value }))}
                  className={inputClass(false)}
                />
              </FieldRow>

              <FieldRow label="Landmark (optional)" id="landmark">
                <input
                  id="landmark"
                  type="text"
                  value={address.landmark}
                  onChange={(e) => setAddress((p) => ({ ...p, landmark: e.target.value }))}
                  placeholder="e.g. Near Shiv Mandir, opposite bank"
                  className={inputClass(false)}
                />
              </FieldRow>

              <div className="grid sm:grid-cols-2 gap-4">
                <FieldRow label="City / District" required id="city" error={errors.city}>
                  <input
                    id="city"
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress((p) => ({ ...p, city: e.target.value }))}
                    className={inputClass(Boolean(errors.city))}
                  />
                </FieldRow>

                <FieldRow label="State" required id="state" error={errors.state}>
                  <input
                    id="state"
                    type="text"
                    value={address.state}
                    onChange={(e) => setAddress((p) => ({ ...p, state: e.target.value }))}
                    className={inputClass(Boolean(errors.state))}
                  />
                </FieldRow>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (validateAddress()) setStep('review');
                  }}
                  className="flex items-center gap-2 rounded-lg bg-brown text-sand-soft px-6 py-3 text-sm font-medium hover:bg-brown/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2 shadow-subtle hover:shadow-lift"
                >
                  Review order
                  <ChevronRight className="w-4 h-4" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div>
            <h2 className="font-display text-display-sm text-brown mb-6">Review your order</h2>

            <div className="rounded-xl border border-sand-deep p-4 mb-6 bg-sand-soft/20 text-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-brown">Shipping to</span>
                <button
                  type="button"
                  onClick={() => setStep('address')}
                  className="text-xs text-gold-deep hover:underline"
                >
                  Edit
                </button>
              </div>
              <p className="text-brown-soft">
                {address.fullName} · {address.phone}
              </p>
              <p className="text-brown-soft">
                {address.line1}{address.line2 ? `, ${address.line2}` : ''}
              </p>
              {address.landmark && <p className="text-brown-soft">Near: {address.landmark}</p>}
              <p className="text-brown-soft">
                {address.city}, {address.state} — {address.pincode}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-brown mb-3">Items in your sacred kit</h3>
              <div className="space-y-3">
                {lines.length > 0 ? (
                  lines.map((item) => (
                    <div
                      key={`${item.productId}-${item.variantId ?? ''}`}
                      className="flex items-center justify-between p-3 rounded-xl border border-sand-deep/60 bg-ivory"
                    >
                      <div>
                        <p className="text-sm font-medium text-brown">{item.name}</p>
                        {item.variantLabel && (
                          <p className="text-xs text-brown-soft">{item.variantLabel}</p>
                        )}
                        <p className="text-xs text-brown-muted">Qty: {item.qty}</p>
                      </div>
                      <span className="text-sm font-medium text-brown">
                        {formatMoney(item.lineTotal)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-brown-muted">Calculating items...</p>
                )}
              </div>
            </div>

            <div className="mb-8">
              <CouponInput
                currentCode={couponCode}
                onApply={(code) => applyCoupon(code)}
                onRemove={() => removeCoupon()}
              />
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep('address')}
                className="flex items-center gap-1.5 text-sm text-brown-soft hover:text-brown transition-colors"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden />
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep('payment')}
                className="flex items-center gap-2 rounded-lg bg-brown text-sand-soft px-6 py-3 text-sm font-medium hover:bg-brown/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2 shadow-subtle hover:shadow-lift"
              >
                Continue to payment
                <ChevronRight className="w-4 h-4" aria-hidden />
              </button>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div>
            <h2 className="font-display text-display-sm text-brown mb-6">Select Payment Method</h2>
            <div className="space-y-4 mb-8">
              {/* Online Payment (Razorpay) Option */}
              <label
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  paymentMethod === 'razorpay'
                    ? 'border-gold-deep bg-gold-wash shadow-sm ring-2 ring-gold/20'
                    : 'border-sand-deep hover:border-brown/40 bg-white',
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  className="mt-1 accent-gold"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-brown text-sm flex items-center gap-1.5">
                      <CreditCard size={16} className="text-gold" /> Online Payment (Razorpay)
                    </p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-brown-soft mt-0.5">
                    Pay securely via UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards or Net Banking.
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <span className="px-2 py-0.5 bg-white border border-sand rounded text-[11px] font-medium text-brown">UPI / QR</span>
                    <span className="px-2 py-0.5 bg-white border border-sand rounded text-[11px] font-medium text-brown">GPay</span>
                    <span className="px-2 py-0.5 bg-white border border-sand rounded text-[11px] font-medium text-brown">PhonePe</span>
                    <span className="px-2 py-0.5 bg-white border border-sand rounded text-[11px] font-medium text-brown">Paytm</span>
                    <span className="px-2 py-0.5 bg-white border border-sand rounded text-[11px] font-medium text-brown">Visa / Mastercard / RuPay</span>
                  </div>
                </div>
              </label>

              {/* Cash on Delivery Option */}
              <label
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  paymentMethod === 'cod'
                    ? 'border-gold-deep bg-gold-wash shadow-sm ring-2 ring-gold/20'
                    : 'border-sand-deep hover:border-brown/40 bg-white',
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 accent-brown"
                />
                <div>
                  <p className="font-semibold text-brown text-sm">Cash on Delivery (COD)</p>
                  <p className="text-xs text-brown-soft mt-0.5">
                    Pay cash to courier when your sacred kit arrives at your doorstep.
                  </p>
                </div>
              </label>
            </div>

            {placeError && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                {placeError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('review')}
                disabled={isPlacing}
                className="flex items-center gap-1.5 text-sm text-brown-soft hover:text-brown transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden />
                Back
              </button>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isPlacing}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brown text-sand-soft px-6 py-3 text-sm font-semibold hover:bg-brown/90 transition-colors disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep shadow-subtle hover:shadow-lift"
              >
                {isPlacing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    Connecting to Payment Gateway...
                  </>
                ) : paymentMethod === 'razorpay' ? (
                  <>
                    <Lock className="w-4 h-4 text-gold" aria-hidden />
                    Proceed to Online Payment ({totals ? formatMoney(totals.total) : ''})
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" aria-hidden />
                    Place Order (Cash on Delivery)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Razorpay Online Payment Gateway Modal */}
        {showOnlineModal && onlineIntent && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-sand animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="bg-brown p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-gold/20 flex items-center justify-center border border-gold/40">
                    <CreditCard size={18} className="text-gold" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide">Razorpay Trusted Checkout</h3>
                    <p className="text-[11px] text-sand-soft/80">Secured 256-bit Encrypted Portal</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-sand-soft/80">Amount Payable</div>
                  <div className="text-lg font-bold text-gold">
                    {formatMoney(onlineIntent.amount)}
                  </div>
                </div>
              </div>

              {/* Order Reference Strip */}
              <div className="bg-sand-soft/50 px-5 py-2.5 border-b border-sand flex items-center justify-between text-xs text-charcoal/80">
                <span>Order: <strong>{onlineIntent.orderNumber}</strong></span>
                <span className="flex items-center gap-1 text-green-700 font-medium">
                  <ShieldCheck size={13} /> Official Sandbox Gateway
                </span>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                <p className="text-xs text-gray-500">
                  Select your preferred online method to complete this test transaction. No real money is deducted.
                </p>

                {/* Method selector */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOnlineMethod('upi')}
                    className={cn(
                      'p-2.5 rounded-xl border text-center transition-all text-xs flex flex-col items-center gap-1',
                      selectedOnlineMethod === 'upi'
                        ? 'border-gold bg-gold/10 font-bold text-brown shadow-sm'
                        : 'border-sand hover:border-brown/30 text-gray-600',
                    )}
                  >
                    <Smartphone size={16} className={selectedOnlineMethod === 'upi' ? 'text-gold' : 'text-gray-400'} />
                    UPI / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOnlineMethod('card')}
                    className={cn(
                      'p-2.5 rounded-xl border text-center transition-all text-xs flex flex-col items-center gap-1',
                      selectedOnlineMethod === 'card'
                        ? 'border-gold bg-gold/10 font-bold text-brown shadow-sm'
                        : 'border-sand hover:border-brown/30 text-gray-600',
                    )}
                  >
                    <CreditCard size={16} className={selectedOnlineMethod === 'card' ? 'text-gold' : 'text-gray-400'} />
                    Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOnlineMethod('netbanking')}
                    className={cn(
                      'p-2.5 rounded-xl border text-center transition-all text-xs flex flex-col items-center gap-1',
                      selectedOnlineMethod === 'netbanking'
                        ? 'border-gold bg-gold/10 font-bold text-brown shadow-sm'
                        : 'border-sand hover:border-brown/30 text-gray-600',
                    )}
                  >
                    <Package size={16} className={selectedOnlineMethod === 'netbanking' ? 'text-gold' : 'text-gray-400'} />
                    NetBanking
                  </button>
                </div>

                {/* Method Details */}
                {selectedOnlineMethod === 'upi' && (
                  <div className="p-3.5 rounded-xl bg-sand-soft/30 border border-sand text-xs space-y-2">
                    <div className="flex items-center justify-between text-charcoal font-medium">
                      <span>Supported UPI Apps</span>
                      <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">Auto-Approval</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2.5 py-1 bg-white rounded border border-sand font-medium">Google Pay</span>
                      <span className="px-2.5 py-1 bg-white rounded border border-sand font-medium">PhonePe</span>
                      <span className="px-2.5 py-1 bg-white rounded border border-sand font-medium">Paytm</span>
                    </div>
                    <p className="text-[11px] text-gray-400">UPI ID: {email.split('@')[0]}@okaxis (Simulated)</p>
                  </div>
                )}

                {selectedOnlineMethod === 'card' && (
                  <div className="p-3.5 rounded-xl bg-sand-soft/30 border border-sand text-xs space-y-2">
                    <div className="flex items-center justify-between text-charcoal font-medium">
                      <span>Razorpay Test Card</span>
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">3D Secure</span>
                    </div>
                    <div className="font-mono text-sm tracking-wider text-charcoal">
                      4111 2222 3333 4444
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>Exp: 12/28</span>
                      <span>CVV: 123</span>
                    </div>
                  </div>
                )}

                {selectedOnlineMethod === 'netbanking' && (
                  <div className="p-3.5 rounded-xl bg-sand-soft/30 border border-sand text-xs space-y-2">
                    <span className="text-charcoal font-medium block">Select Bank</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span className="p-2 bg-white rounded border border-sand font-medium text-center">State Bank of India</span>
                      <span className="p-2 bg-white rounded border border-sand font-medium text-center">HDFC Bank</span>
                      <span className="p-2 bg-white rounded border border-sand font-medium text-center">ICICI Bank</span>
                      <span className="p-2 bg-white rounded border border-sand font-medium text-center">Axis Bank</span>
                    </div>
                  </div>
                )}

                {/* Primary Action Button */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSimulateOnlinePayment(true)}
                    disabled={payingOnline}
                    className="w-full py-3 px-4 bg-gold hover:bg-gold-light disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {payingOnline ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Authorizing Payment with Bank...
                      </>
                    ) : (
                      <>
                        <Lock size={15} />
                        Pay {formatMoney(onlineIntent.amount)} & Complete Order
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulateOnlinePayment(false)}
                    disabled={payingOnline}
                    className="w-full py-2 text-xs text-gray-500 hover:text-red-600 transition-colors text-center"
                  >
                    Cancel / Simulate Failed Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order summary sidebar */}
      {step !== 'success' && (
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-2xl border border-sand-deep bg-sand-soft/20 p-5">
            <p className="text-xs eyebrow text-gold-deep mb-4">Order summary</p>
            {totals ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-brown-soft">
                  <span>Subtotal</span>
                  <span>{formatMoney(totals.subtotal)}</span>
                </div>
                {totals.productDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Product discount</span>
                    <span>−{formatMoney(totals.productDiscount)}</span>
                  </div>
                )}
                {totals.couponDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Coupon{totals.couponCode ? ` (${totals.couponCode})` : ''}</span>
                    <span>−{formatMoney(totals.couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-brown-soft">
                  <span>Shipping</span>
                  <span>{totals.shipping === 0 ? 'Free' : formatMoney(totals.shipping)}</span>
                </div>
                <div className="border-t border-sand-deep/60 pt-2 flex justify-between font-medium text-brown">
                  <span>Total</span>
                  <span>{formatMoney(totals.total)}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 rounded bg-sand-deep/40 animate-pulse" style={{ width: `${60 + i * 10}%` }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'address', label: 'Delivery' },
    { key: 'review', label: 'Review' },
    { key: 'payment', label: 'Payment' },
  ];

  const order = ['address', 'review', 'payment', 'success'];
  const currentIndex = order.indexOf(current);

  return (
    <nav aria-label="Checkout progress" className="mb-8">
      <ol className="flex items-center gap-2 text-xs">
        {steps.map((s, index) => {
          const stepIndex = order.indexOf(s.key);
          const isDone = currentIndex > stepIndex;
          const isCurrent = current === s.key;

          return (
            <li key={s.key} className="flex items-center gap-2">
              {index > 0 && <span className="text-sand-deep" aria-hidden>/</span>}
              <span
                className={cn(
                  'font-medium transition-colors',
                  isCurrent && 'text-brown font-semibold',
                  isDone && 'text-gold-deep',
                  !isCurrent && !isDone && 'text-brown-muted',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Form helpers
// ---------------------------------------------------------------------------

function FieldRow({
  label,
  required,
  id,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-brown mb-1.5">
        {label}
        {required && <span className="text-gold-deep ml-0.5" aria-hidden>*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function inputClass(hasError: boolean): string {
  return cn(
    'w-full px-3.5 py-2.5 rounded-lg border text-sm text-brown bg-ivory placeholder:text-brown-muted/60 transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-gold-deep focus:border-transparent',
    hasError ? 'border-red-400 bg-red-50/20' : 'border-sand-deep hover:border-brown/40',
  );
}

// ---------------------------------------------------------------------------
// Coupon input
// ---------------------------------------------------------------------------

function CouponInput({
  currentCode,
  onApply,
  onRemove,
}: {
  currentCode: string | null;
  onApply: (code: string) => void;
  onRemove: () => void;
}) {
  const [code, setCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  if (currentCode) {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl border border-success/30 bg-success/5 text-sm">
        <div className="flex items-center gap-2 text-success font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Coupon <strong>{currentCode}</strong> applied</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-brown-muted hover:text-brown transition-colors"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!code.trim()) return;
        setIsApplying(true);
        onApply(code.trim().toUpperCase());
        setIsApplying(false);
        setCode('');
      }}
      className="flex gap-2"
    >
      <input
        type="text"
        placeholder="Coupon code (e.g. WELCOME10)"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        className={cn(inputClass(false), 'uppercase text-xs')}
        aria-label="Coupon code"
      />
      <button
        type="submit"
        disabled={!code.trim() || isApplying}
        className="shrink-0 px-4 py-2.5 rounded-lg bg-sand-deep text-brown text-xs font-medium hover:bg-sand-deep/80 transition-colors disabled:opacity-40"
      >
        Apply
      </button>
    </form>
  );
}
