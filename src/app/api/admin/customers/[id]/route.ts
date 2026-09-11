import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin('customers.read');
    const store = await getStore();
    const { id } = await params;

    let user = await store.getUserById(id);

    // Fetch orders to either find customer or match orders
    const allOrdersPage = await store.listOrders({ limit: 500 });
    const allOrders = allOrdersPage?.items || [];

    if (!user) {
      // Check if this is an order-based customer
      const matchingOrder = allOrders.find(
        (o) => `cust_${Buffer.from(o.email.toLowerCase().trim()).toString('hex').slice(0, 16)}` === id,
      );

      if (matchingOrder) {
        user = {
          id,
          name: matchingOrder.shippingAddress?.fullName || matchingOrder.email.split('@')[0] || 'Customer',
          email: matchingOrder.email,
          phone: matchingOrder.phone || matchingOrder.shippingAddress?.phone || '',
          addresses: matchingOrder.shippingAddress ? [matchingOrder.shippingAddress] : [],
          wishlist: [],
          recentlyViewed: [],
          marketingOptIn: false,
          createdAt: matchingOrder.createdAt,
        };
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Customer's orders
    const customerOrders = allOrders.filter(
      (order) => order.userId === user!.id || order.email.toLowerCase() === user!.email.toLowerCase(),
    );

    // Calculate spend statistics
    const totalSpend = customerOrders.reduce((sum, o) => {
      return o.paymentStatus === 'paid' || o.paymentStatus === 'pending' ? sum + (o.totals?.total || 0) : sum;
    }, 0);

    const paidSpend = customerOrders.reduce((sum, o) => {
      return o.paymentStatus === 'paid' ? sum + (o.totals?.total || 0) : sum;
    }, 0);

    const aov = customerOrders.length > 0 ? Math.round(totalSpend / customerOrders.length) : 0;

    return NextResponse.json({
      customer: user,
      orders: customerOrders,
      stats: {
        totalOrders: customerOrders.length,
        totalSpend,
        paidSpend,
        averageOrderValue: aov,
        lastOrderAt: customerOrders[0]?.createdAt || null,
      },
    });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
