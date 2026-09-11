import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { evaluateCoupon, priceCart } from '@/lib/domain/pricing';
import type { CartItem } from '@/lib/data/types';
import type { CouponEvaluation } from '@/lib/data/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: CartItem[] = body.items || [];
    const couponCode: string | null = body.couponCode || null;

    const store = await getStore();
    const settings = await store.getSettings();

    const productIds = Array.from(new Set(items.map((item) => item.productId)));
    const products = productIds.length > 0 ? await store.getProductsByIds(productIds) : [];

    let coupon = null;
    let couponEvaluation: CouponEvaluation | null = null;

    if (couponCode && couponCode.trim().length > 0) {
      const code = couponCode.trim().toUpperCase();
      coupon = await store.getCouponByCode(code);
    }

    const pricedCart = priceCart({
      items,
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

    return NextResponse.json({
      pricedCart,
      couponEvaluation,
    });
  } catch (error) {
    console.error('Error in /api/cart/sync:', error);
    return NextResponse.json({ error: 'Failed to sync cart' }, { status: 500 });
  }
}
