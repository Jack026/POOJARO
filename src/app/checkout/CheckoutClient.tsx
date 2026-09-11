'use client';

/**
 * CheckoutClient — multi-step checkout wizard (§26, §53, §59, §64).
 *
 * Step 1: Delivery address
 * Step 2: Review cart + apply coupon (totals fetched server-side via cart-store sync)
 * Step 3: Payment method selection
 *
 * Critical: prices, stock, and order totals are NEVER trusted from this component.
 * The client holds only { productId, variantId, qty, couponCode }; placeOrder
 * re-prices and re-checks stock atomically on the server (§53, §59).
 *
 * Payment: we show a Razorpay integration point. If RAZORPAY_KEY_ID is not
 * configured, we fall back to a COD-only flow and label it clearly (§64).
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
} from 'lucide-react';
import { useCartStore } from '@/components/cart/cart-store';
import { placeOrderAction } from './actions';
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

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

function StepIndicator({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'address', label: 'Address' },
    { id: 'review', label: 'Review' },
    { id: 'payment', label: 'Payment' },
  ];
  const order: Step[] = ['address', 'review', 'payment', 'success'];
  const currentIdx = order.indexOf(current);

  return (
    <div className="flex items-center gap-2 mb-10">
      {steps.map((step, i) => {
        const done = i < currentIdx;
        const active = step.id === current;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                  done && 'bg-gold-deep text-sand-soft',
                  active && 'bg-brown text-sand-soft',
                  !done && !active && 'bg-sand-deep text-brown-muted',
                )}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn('text-sm hidden sm:block', active ? 'text-brown font-medium' : 'text-brown-muted')}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('h-px w-8 transition-colors', done ? 'bg-gold-deep' : 'bg-sand-deep')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldRow({
  label,
  required,
  children,
  error,
  id,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
  id: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-brown">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-sand-deep bg-white px-3 py-2.5 text-sm text-brown placeholder:text-brown-muted focus:outline-none focus:ring-2 focus:ring-gold-deep focus:border-transparent disabled:opacity-50';

export function CheckoutClient() {
  const { items, pricedCart, couponCode, hasHydrated, clearCart } = useCartStore();
  const [step, setStep] = useState<Step>('address');
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm | 'email', string>>>({});
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [isPlacing, setIsPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<{ orderNumber: string; id: string } | null>(null);

  const totals = pricedCart?.totals;

  // Redirect to empty state if cart is empty
  if (hasHydrated && items.length === 0 && step !== 'success') {
    return (
      <div className="py-16 text-center max-w-sm mx-auto">
        <ShoppingBag className="w-10 h-10 text-sand-deep mx-auto mb-4" aria-hidden />
        <p className="text-brown font-medium mb-2">Your cart is empty</p>
        <p className="text-brown-soft text-sm mb-6">Add something to your cart before checking out.</p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-lg bg-brown text-sand-soft px-5 py-2.5 text-sm font-medium hover:bg-brown/90 transition-colors"
        >
          Browse products
        </Link>
      </div>
    );
  }

  function validateAddress(): boolean {
    const next: typeof errors = {};
    if (!address.fullName.trim()) next.fullName = 'Full name is required.';
    if (!address.phone.trim() || !/^\d{10}$/.test(address.phone.trim())) next.phone = 'Enter a valid 10-digit mobile number.';
    if (!address.line1.trim()) next.line1 = 'Address line 1 is required.';
    if (!address.city.trim()) next.city = 'City is required.';
    if (!address.state) next.state = 'State is required.';
    if (!address.pincode.trim() || !/^\d{6}$/.test(address.pincode.trim())) next.pincode = 'Enter a valid 6-digit pincode.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email address.';
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

    setIsPlacing(false);

    if (!result.ok) {
      setPlaceError(result.message);
      return;
    }

    clearCart();
    setSuccessOrder({ orderNumber: result.orderNumber, id: result.orderId });
    setStep('success');
  }

  if (step === 'success' && successOrder) {
    return (
      <div className="py-12 text-center max-w-sm mx-auto">
        <CheckCircle2 className="w-14 h-14 text-success mx-auto mb-5" aria-hidden />
        <h2 className="font-display text-display-sm text-brown mb-2">Order placed!</h2>
        <p className="text-brown-soft text-sm mb-1">
          Order <span className="font-medium text-brown">{successOrder.orderNumber}</span>
        </p>
        <p className="text-brown-soft text-sm mb-8">
          Confirmation sent to your email. We will update you when it ships.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href={`/orders/${successOrder.id}`}
            className="rounded-lg bg-brown text-sand-soft px-5 py-2.5 text-sm font-medium hover:bg-brown/90 transition-colors text-center"
          >
            Track order
          </Link>
          <Link href="/shop" className="text-sm text-gold-deep underline underline-offset-2">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-10 max-w-4xl">
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
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </FieldRow>
              <FieldRow label="Full name" required id="fullName" error={errors.fullName}>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  value={address.fullName}
                  onChange={(e) => setAddress((a) => ({ ...a, fullName: e.target.value }))}
                  onBlur={() => {
                    if (!address.fullName.trim()) setErrors((p) => ({ ...p, fullName: 'Full name is required.' }));
                    else setErrors((p) => { const n = { ...p }; delete n.fullName; return n; });
                  }}
                  aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                  className={inputClass}
                  placeholder="As on the address"
                />
              </FieldRow>
              <FieldRow label="Mobile number" required id="phone" error={errors.phone}>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 rounded-lg border border-sand-deep bg-sand-soft/40 text-sm text-brown-muted select-none shrink-0">
                    +91
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel-national"
                    value={address.phone}
                    onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    onBlur={() => {
                      if (!/^\d{10}$/.test(address.phone)) setErrors((p) => ({ ...p, phone: 'Enter a valid 10-digit mobile number.' }));
                      else setErrors((p) => { const n = { ...p }; delete n.phone; return n; });
                    }}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                    className={cn(inputClass, 'flex-1')}
                    placeholder="10-digit mobile"
                    inputMode="numeric"
                  />
                </div>
              </FieldRow>
              <FieldRow label="Address line 1" required id="line1" error={errors.line1}>
                <input
                  id="line1"
                  type="text"
                  autoComplete="address-line1"
                  value={address.line1}
                  onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                  onBlur={() => {
                    if (!address.line1.trim()) setErrors((p) => ({ ...p, line1: 'Address line 1 is required.' }));
                    else setErrors((p) => { const n = { ...p }; delete n.line1; return n; });
                  }}
                  aria-describedby={errors.line1 ? 'line1-error' : undefined}
                  className={inputClass}
                  placeholder="Flat / house / building number"
                />
              </FieldRow>
              <FieldRow label="Address line 2" id="line2">
                <input
                  id="line2"
                  type="text"
                  autoComplete="address-line2"
                  value={address.line2}
                  onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
                  className={inputClass}
                  placeholder="Street / area (optional)"
                />
              </FieldRow>
              <FieldRow label="Landmark" id="landmark">
                <input
                  id="landmark"
                  type="text"
                  value={address.landmark}
                  onChange={(e) => setAddress((a) => ({ ...a, landmark: e.target.value }))}
                  className={inputClass}
                  placeholder="Near… (optional)"
                />
              </FieldRow>
              <div className="grid sm:grid-cols-3 gap-5">
                <div className="sm:col-span-1">
                  <FieldRow label="City" required id="city" error={errors.city}>
                    <input
                      id="city"
                      type="text"
                      autoComplete="address-level2"
                      value={address.city}
                      onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                      onBlur={() => {
                        if (!address.city.trim()) setErrors((p) => ({ ...p, city: 'City is required.' }));
                        else setErrors((p) => { const n = { ...p }; delete n.city; return n; });
                      }}
                      aria-describedby={errors.city ? 'city-error' : undefined}
                      className={inputClass}
                      placeholder="City"
                    />
                  </FieldRow>
                </div>
                <div className="sm:col-span-1">
                  <FieldRow label="State" required id="state" error={errors.state}>
                    <select
                      id="state"
                      autoComplete="address-level1"
                      value={address.state}
                      onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                      onBlur={() => {
                        if (!address.state) setErrors((p) => ({ ...p, state: 'State is required.' }));
                        else setErrors((p) => { const n = { ...p }; delete n.state; return n; });
                      }}
                      aria-describedby={errors.state ? 'state-error' : undefined}
                      className={inputClass}
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </FieldRow>
                </div>
                <div className="sm:col-span-1">
                  <FieldRow label="Pincode" required id="pincode" error={errors.pincode}>
                    <input
                      id="pincode"
                      type="text"
                      autoComplete="postal-code"
                      value={address.pincode}
                      onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      onBlur={() => {
                        if (!/^\d{6}$/.test(address.pincode)) setErrors((p) => ({ ...p, pincode: 'Enter a valid 6-digit pincode.' }));
                        else setErrors((p) => { const n = { ...p }; delete n.pincode; return n; });
                      }}
                      aria-describedby={errors.pincode ? 'pincode-error' : undefined}
                      className={inputClass}
                      placeholder="6 digits"
                      inputMode="numeric"
                    />
                  </FieldRow>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { if (validateAddress()) setStep('review'); }}
              className="mt-8 flex items-center gap-2 rounded-lg bg-brown text-sand-soft px-6 py-3 text-sm font-medium hover:bg-brown/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2"
            >
              Continue to review
              <ChevronRight className="w-4 h-4" aria-hidden />
            </button>
          </div>
        )}

        {step === 'review' && pricedCart && (
          <div>
            <h2 className="font-display text-display-sm text-brown mb-6">Review your order</h2>
            <div className="space-y-3 mb-6">
              {pricedCart.lines.map((line) => (
                <div key={`${line.productId}-${line.variantId ?? ''}`} className="flex gap-3 p-3 rounded-xl border border-sand-deep">
                  {line.image && (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-sand-soft/50 shrink-0">
                      <Image src={line.image.url} alt={line.image.alt} fill className="object-cover" sizes="56px" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brown truncate">{line.name}</p>
                    {line.variantLabel && <p className="text-xs text-brown-muted">{line.variantLabel}</p>}
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-brown-muted">Qty: {line.qty}</p>
                      <p className="text-sm font-medium text-brown">{formatMoney(line.lineTotal)}</p>
                    </div>
                    {!line.inStock && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" aria-hidden />
                        Out of stock — remove to continue
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {pricedCart.notices.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                {pricedCart.notices.map((note, i) => (
                  <p key={i}>{note}</p>
                ))}
              </div>
            )}
            <div className="rounded-xl border border-sand-deep p-4 mb-6">
              <p className="text-xs eyebrow text-gold-deep mb-2">Delivery address</p>
              <p className="text-sm text-brown">{address.fullName}</p>
              <p className="text-sm text-brown-soft">{[address.line1, address.line2, address.city, address.state, address.pincode].filter(Boolean).join(', ')}</p>
              <button
                type="button"
                onClick={() => setStep('address')}
                className="mt-2 text-xs text-gold-deep underline underline-offset-2 hover:text-brown transition-colors"
              >
                Edit
              </button>
            </div>
            <div className="flex gap-3">
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
                className="flex items-center gap-2 rounded-lg bg-brown text-sand-soft px-6 py-3 text-sm font-medium hover:bg-brown/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2"
              >
                Continue to payment
                <ChevronRight className="w-4 h-4" aria-hidden />
              </button>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div>
            <h2 className="font-display text-display-sm text-brown mb-6">Payment</h2>
            <div className="space-y-3 mb-8">
              <label className={cn(
                'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors',
                paymentMethod === 'cod' ? 'border-gold-deep bg-gold-wash' : 'border-sand-deep hover:border-brown/40',
              )}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-0.5 accent-brown"
                />
                <div>
                  <p className="font-medium text-brown text-sm">Cash on Delivery</p>
                  <p className="text-xs text-brown-soft mt-0.5">Pay when your order arrives. Available on all orders.</p>
                </div>
              </label>

              <div className="flex items-start gap-3 p-4 rounded-xl border-2 border-sand-deep/60 bg-sand-soft/20 opacity-60" aria-disabled="true">
                <Package className="w-4 h-4 mt-0.5 text-brown-muted shrink-0" aria-hidden />
                <div>
                  <p className="font-medium text-brown-muted text-sm">Online Payment (Razorpay)</p>
                  <p className="text-xs text-brown-muted mt-0.5">
                    UPI, cards, and net banking — available once payment gateway is configured (§64).
                  </p>
                </div>
              </div>
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
                className="flex items-center gap-2 rounded-lg bg-brown text-sand-soft px-6 py-3 text-sm font-medium hover:bg-brown/90 transition-colors disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2"
              >
                {isPlacing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    Placing order…
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" aria-hidden />
                    Place order
                  </>
                )}
              </button>
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
