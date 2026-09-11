import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getStore } from '@/lib/data';
import type { ProductQuery } from '@/lib/data/store';
import { ProductCard } from '@/components/shop/ProductCard';
import { ShopFilters } from './ShopFilters';
import { ShopSort } from './ShopSort';
import { Pagination } from './Pagination';

export const metadata: Metadata = {
  title: 'Shop Puja Samagri | POOJARO',
  description:
    'Browse authentic puja samagri and ritual kits — curated for every occasion, delivered across India.',
};

// Validate that a sort value is in our allowed list.
const ALLOWED_SORTS = [
  'relevance', 'price-asc', 'price-desc', 'rating', 'newest', 'discount',
] as const;
type AllowedSort = (typeof ALLOWED_SORTS)[number];
function isAllowedSort(s: string | undefined): s is AllowedSort {
  return ALLOWED_SORTS.includes(s as AllowedSort);
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ShopPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawSort = first(params['sort']);
  const sort = isAllowedSort(rawSort) ? rawSort : 'relevance';
  const search = first(params['q']) ?? '';
  const isKitOnly = first(params['kits']) === '1';
  const page = Math.max(1, parseInt(first(params['page']) ?? '1', 10));
  const limit = 24;

  const store = await getStore();
  const query: ProductQuery = {
    status: 'published',
    sort: sort === 'relevance' ? undefined : sort,
    search: search || undefined,
    isKit: isKitOnly || undefined,
    limit,
    offset: (page - 1) * limit,
  };

  const [result, occasions, categories] = await Promise.all([
    store.listProducts(query),
    store.listOccasions(),
    store.listCategories(),
  ]);

  const totalPages = Math.ceil(result.total / limit);

  return (
    <main id="main" className="pt-6 pb-16">
      <div className="container-page">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-1.5 text-xs text-brown-muted">
            <li><Link href="/">Home</Link></li>
            <li><ChevronRight className="w-3 h-3" /></li>
            <li className="text-brown font-medium">Shop</li>
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="lg:w-56 shrink-0">
            <ShopFilters occasions={occasions} categories={categories} />
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4 mb-6">
              <p className="text-sm text-brown-muted">
                {result.total === 0
                  ? 'No products found'
                  : `${result.total} product${result.total === 1 ? '' : 's'}`}
                {search && <span className="ml-1">for &ldquo;{search}&rdquo;</span>}
              </p>
              <ShopSort current={sort} />
            </div>

            {result.items.length === 0 ? (
              <div className="py-24 text-center">
                <p className="font-display text-display-md text-brown mb-3">
                  We couldn&apos;t find that ritual essential.
                </p>
                <p className="text-sm text-brown-muted mb-6">
                  Try a different search or browse all our kits.
                </p>
                <Link
                  href="/shop"
                  className="text-sm font-medium text-gold-deep underline underline-offset-2"
                >
                  Clear filters
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                  {result.items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination current={page} total={totalPages} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
