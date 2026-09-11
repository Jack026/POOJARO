import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') ?? '5', 10)));

  if (!q.trim() || q.trim().length < 2) {
    return NextResponse.json([]);
  }

  const store = await getStore();
  const page = await store.listProducts({
    search: q,
    limit,
    status: 'published',
  });

  const suggestions = page.items.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    mrp: product.mrp,
    imageUrl: product.images[0]?.url ?? null,
    isKit: product.isKit,
  }));

  return NextResponse.json(suggestions);
}
