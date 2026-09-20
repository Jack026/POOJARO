import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { getCustomerSession } from '@/lib/auth/guards';
import { newId, nowIso } from '@/lib/data/shared';
import type { Review } from '@/lib/data/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getCustomerSession().catch(() => null);
    const body = await req.json();
    const { productId, authorName, city = '', rating, title = '', body: reviewBody } = body;

    if (!productId || !authorName || !rating || !reviewBody) {
      return NextResponse.json(
        { error: 'Product ID, author name, rating, and review text are required.' },
        { status: 400 }
      );
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5 stars.' },
        { status: 400 }
      );
    }

    const store = await getStore();
    const product = await store.getProductById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const cleanAuthor = String(authorName).trim();
    const cleanBody = String(reviewBody).trim();
    const cleanTitle = String(title).trim();
    const cleanCity = String(city).trim();

    const review: Review = {
      id: newId('rev'),
      productId,
      userId: session?.userId || null,
      authorName: cleanAuthor,
      city: cleanCity,
      rating: Math.round(numRating),
      title: cleanTitle,
      body: cleanBody,
      photos: [],
      verifiedPurchase: Boolean(session?.userId),
      isDemo: false,
      status: 'pending', // Moderation required
      helpfulCount: 0,
      createdAt: nowIso(),
    };

    await store.createReview(review);

    // 1. Notify Admin Portal
    await store.createNotification({
      id: newId('notif'),
      userId: null,
      topic: 'promotion',
      title: `New Review for ${product.name}`,
      body: `${cleanAuthor} rated this ${Math.round(numRating)}/5 stars: "${cleanTitle || cleanBody.slice(0, 50)}"`,
      href: '/admin/reviews',
      isRead: false,
      createdAt: nowIso(),
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your devotional feedback! Your review has been submitted for moderation.',
      review,
    });
  } catch (error) {
    console.error('[POST /api/reviews error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
