import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getStore } from '@/lib/data';
import { ProductCard } from '@/components/shop/ProductCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ShopSort } from '@/app/shop/ShopSort';
import { Pagination } from '@/app/shop/Pagination';

export const metadata: Metadata = {
  title: 'Puja Kits — POOJARO',
  description: 'Complete ritual kits for every ceremony — everything you need, in one box.',
};

const ALLOWED_SORTS = ['relevance', 'price-asc', 'price-desc', 'rating', 'newest', 'discount'] as const;
type AllowedSort = (typeof ALLOWED_SORTS)[number];

function isAllowedSort(s: string | undefined): s is AllowedSort {
  return (ALLOWED_SORTS as readonly (string | undefined)[]).includes(s);
}

const PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function KitsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawSort = Array.isArray(params['sort']) ? params['sort'][0] : (params['sort'] ?? 'relevance');
  const sort = isAllowedSort(rawSort) ? rawSort : 'relevance';
  const page = Math.max(1, Number(params['page']) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const store = await getStore();
  const result = await store.listProducts({
    isKit: true,
    status: 'published',
    sort: sort === 'relevance' ? undefined : sort,
    limit: PAGE_SIZE,
    offset,
  });

  const totalPages = Math.ceil(result.total / PAGE_SIZE);

  return (
    <main id="main" className="pt-6 pb-16">
      <div className="container-page">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-1.5 text-xs text-brown-muted">
            <li><Link href="/">Home</Link></li>
            <li><ChevronRight className="w-3 h-3" /></li>
            <li className="text-brown font-medium">Puja Kits</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <SectionHeading
            eyebrow="Ritual Kits"
            title="Everything in One Box"
            copy="Complete, curated kits — every item you need for the ceremony, nothing missing."
          />
          <ShopSort current={sort} />
        </div>

        {/* Grid */}
        {result.items.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-brown-soft text-sm">No kits available right now. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {result.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex justify-center">
            <Pagination current={page} total={totalPages} />
          </div>
        )}
      </div>
    </main>
  );
}
