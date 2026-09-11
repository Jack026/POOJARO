import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');
    const store = await getStore();

    if (idsParam) {
      const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
      const products = await Promise.all(ids.map((id) => store.getProductById(id)));
      return NextResponse.json(products.filter(Boolean));
    }

    const categoryId = searchParams.get('categoryId') || undefined;
    const occasionId = searchParams.get('occasionId') || undefined;
    const festivalId = searchParams.get('festivalId') || undefined;
    const isKit = searchParams.get('isKit') ? searchParams.get('isKit') === 'true' : undefined;
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

    const result = await store.listProducts({
      categoryId,
      occasionId,
      festivalId,
      isKit,
      status: 'published',
      limit,
    });

    return NextResponse.json(result.items);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
