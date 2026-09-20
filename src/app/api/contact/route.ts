import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { newId, nowIso } from '@/lib/data/shared';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, type = 'general', message, quantity, organization } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const store = await getStore();
    const typeLabel =
      type === 'bulk'
        ? 'Bulk Order Enquiry'
        : type === 'corporate'
        ? 'Corporate & Festive Gifting'
        : 'General Customer Enquiry';

    // 1. Dispatch Admin Notification
    await store.createNotification({
      id: newId('notif'),
      userId: null, // admin / system notification
      topic: 'promotion',
      title: `${typeLabel}: ${String(name).trim()}`,
      body: `From: ${email} ${phone ? `| Phone: ${phone}` : ''} ${
        organization ? `| Org: ${organization}` : ''
      } ${quantity ? `| Qty: ${quantity}` : ''}\n\nMessage: ${message}`,
      href: '/admin',
      isRead: false,
      createdAt: nowIso(),
    });

    return NextResponse.json({
      success: true,
      message:
        'Thank you for reaching out to POOJARO. Our devotional support team will respond within one business day.',
    });
  } catch (error) {
    console.error('[POST /api/contact error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
