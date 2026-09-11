'use server';

import { getStore } from '@/lib/data';
import { evaluateCoupon, priceCart } from '@/lib/domain/pricing';
import type { CartItem, PricedCart } from '@/lib/data/types';
import type { CouponEvaluation } from '@/lib/data/store';

export interface CartSyncResult {
  pricedCart: PricedCart;
  couponEvaluation: CouponEvaluation | null;
}

export async function syncCartAction(input: {
  items: CartItem[];
  couponCode?: string | null;
}): Promise<CartSyncResult> {
  const store = await getStore();
  const settings = await store.getSettings();

  const productIds = Array.from(new Set(input.items.map((item) => item.productId)));
  const products = productIds.length > 0 ? await store.getProductsByIds(productIds) : [];

  let coupon = null;
  let couponEvaluation: CouponEvaluation | null = null;

  if (input.couponCode && input.couponCode.trim().length > 0) {
    const code = input.couponCode.trim().toUpperCase();
    coupon = await store.getCouponByCode(code);
  }

  const pricedCart = priceCart({
    items: input.items,
    products,
    settings,
    coupon,
  });

  if (coupon) {
    couponEvaluation = evaluateCoupon({
      coupon,
      lines: pricedCart.lines,
      products,
      subtotal: pricedCart.totals.subtotal,
      isFirstOrder: true,
      couponRedemptionsByUser: 0,
      now: new Date(),
    });
  }

  return {
    pricedCart,
    couponEvaluation,
  };
}
