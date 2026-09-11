import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('customers.read');
    const store = await getStore();
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const customersPage = await store.listUsers(query);
    const allOrdersPage = await store.listOrders({ limit: 500 });
    const allOrders = allOrdersPage?.items || [];

    const existingUsers = customersPage?.items || [];
    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

    // Enrich existing registered users
    const enrichedItems = existingUsers.map((user) => {
      const userOrders = allOrders.filter(
        (o) => o.userId === user.id || o.email.toLowerCase() === user.email.toLowerCase(),
      );
      const totalSpend = userOrders.reduce((sum, o) => sum + (o.totals?.total || 0), 0);
      return {
        ...user,
        ordersCount: userOrders.length,
        totalSpend,
        lastOrderAt: userOrders[0]?.createdAt || null,
      };
    });

    // Also include customer profiles from orders if they haven't registered an account yet
    const guestCustomerMap = new Map<string, any>();
    for (const order of allOrders) {
      const email = (order.email || '').toLowerCase().trim();
      if (!email || existingEmails.has(email) || guestCustomerMap.has(email)) continue;

      const customerOrders = allOrders.filter((o) => o.email.toLowerCase().trim() === email);
      const totalSpend = customerOrders.reduce((sum, o) => sum + (o.totals?.total || 0), 0);

      guestCustomerMap.set(email, {
        id: `cust_${Buffer.from(email).toString('hex').slice(0, 16)}`,
        name: order.shippingAddress?.fullName || email.split('@')[0],
        email: order.email,
        phone: order.phone || order.shippingAddress?.phone || '',
        addresses: order.shippingAddress ? [order.shippingAddress] : [],
        wishlist: [],
        recentlyViewed: [],
        marketingOptIn: false,
        createdAt: order.createdAt,
        ordersCount: customerOrders.length,
        totalSpend,
        lastOrderAt: customerOrders[0]?.createdAt || order.createdAt,
      });
    }

    const combinedList = [...enrichedItems, ...Array.from(guestCustomerMap.values())];

    return NextResponse.json({
      items: combinedList,
      total: combinedList.length,
    });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}