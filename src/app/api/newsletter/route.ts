import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { newId, nowIso } from '@/lib/data/shared';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const store = await getStore();

    // Dispatch Admin Notification for new subscriber
    await store.createNotification({
      id: newId('notif'),
      userId: null,
      topic: 'promotion',
      title: 'New Newsletter Devotee',
      body: `Subscriber: ${cleanEmail} subscribed to receive sacred offers and festival wisdom.`,
      href: '/admin/customers',
      isRead: false,
      createdAt: nowIso(),
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you! Sacred offerings and festival updates will arrive in your inbox.',
    });
  } catch (error) {
    console.error('[POST /api/newsletter error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
