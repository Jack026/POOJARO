import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('catalogue.read');
    const store = await getStore();
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    query.status = query.status || 'any';
    const products = await store.listProducts(query);
    return NextResponse.json(products);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin('catalogue.write');
    const store = await getStore();
    const body = await req.json();
    const product = await store.upsertProduct(body, actorFor(admin));
    return NextResponse.json(product);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}