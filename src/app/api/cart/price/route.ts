import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { priceCart } from '@/lib/domain/pricing';

export async function POST(req: NextRequest) {
  try {
    const { items = [], couponCode } = await req.json();
    const store = await getStore();
    
    const productsList = await store.listProducts({ limit: 1000 });
    const settings = await store.getSettings();
    let coupon = null;
    
    if (couponCode) {
      coupon = await store.getCouponByCode(couponCode);
    }
    
    const priced = priceCart({
      items,
      products: productsList.items,
      settings,
      coupon,
    });
    
    return NextResponse.json(priced);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
