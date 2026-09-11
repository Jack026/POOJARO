import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getStore } from '@/lib/data';
import { ProductCard } from '@/components/shop/ProductCard';
import { ShopSort } from '@/app/(site)/shop/ShopSort';
import { Pagination } from '@/app/(site)/shop/Pagination';

const ALLOWED_SORTS = ['relevance', 'price-asc', 'price-desc', 'rating', 'newest', 'discount'] as const;
type AllowedSort = (typeof ALLOWED_SORTS)[number];

function isAllowedSort(s: string | undefined): s is AllowedSort {
  return (ALLOWED_SORTS as readonly (string | undefined)[]).includes(s);
}

const PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = String(params['q'] ?? '').trim();
  return {
    title: q ? `"${q}" — Search | POOJARO` : 'Search | POOJARO',
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = String(params['q'] ?? '').trim();
  const rawSort = Array.isArray(params['sort']) ? params['sort'][0] : (params['sort'] ?? 'relevance');
  const sort = isAllowedSort(rawSort) ? rawSort : 'relevance';
  const page = Math.max(1, Number(params['page']) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const store = await getStore();
  const result = q
    ? await store.listProducts({
        search: q,
        status: 'published',
        sort: sort === 'relevance' ? undefined : sort,
        limit: PAGE_SIZE,
        offset,
      })
    : { items: [], total: 0 };

  const totalPages = Math.ceil(result.total / PAGE_SIZE);

  return (
    <main id="main" className="pt-6 pb-16">
      <div className="container-page">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-1.5 text-xs text-brown-muted">
            <li><Link href="/">Home</Link></li>
            <li><ChevronRight className="w-3 h-3" /></li>
            <li className="text-brown font-medium">Search</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            {q ? (
              <>
                <p className="text-xs eyebrow text-gold-deep mb-2">Search results</p>
                <h1 className="font-display text-display-md text-brown">
                  &ldquo;{q}&rdquo;
                </h1>
                <p className="text-sm text-brown-muted mt-1">
                  {result.total} result{result.total === 1 ? '' : 's'} found
                </p>
              </>
            ) : (
              <h1 className="font-display text-display-md text-brown">Search</h1>
            )}
          </div>
          {q && result.total > 0 && <ShopSort current={sort} />}
        </div>

        {/* No query */}
        {!q && (
          <div className="py-24 text-center">
            <p className="text-brown-soft text-sm">
              Enter a keyword above to find puja essentials.
            </p>
          </div>
        )}

        {/* No results */}
        {q && result.items.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-brown text-sm font-medium mb-2">
              We couldn&apos;t find anything for &ldquo;{q}&rdquo;.
            </p>
            <p className="text-brown-muted text-sm mb-6">
              Try a different word, check the spelling, or browse by category.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/shop" className="text-sm text-gold-deep underline underline-offset-2">Browse all products</Link>
              <Link href="/kits" className="text-sm text-gold-deep underline underline-offset-2">Puja kits</Link>
              <Link href="/ritual-finder" className="text-sm text-gold-deep underline underline-offset-2">Ritual Finder</Link>
            </div>
          </div>
        )}

        {/* Results grid */}
        {result.items.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {result.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <Pagination current={page} total={totalPages} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
