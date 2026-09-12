import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { getStore } from '@/lib/data';
import { ProductCard } from '@/components/shop/ProductCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ShopSort } from '@/app/(site)/shop/ShopSort';
import { Pagination } from '@/app/(site)/shop/Pagination';

const ALLOWED_SORTS = ['relevance', 'price-asc', 'price-desc', 'rating', 'newest', 'discount'] as const;
type AllowedSort = (typeof ALLOWED_SORTS)[number];

function isAllowedSort(s: string | undefined): s is AllowedSort {
  return (ALLOWED_SORTS as readonly (string | undefined)[]).includes(s);
}

const PAGE_SIZE = 12;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore();
  const occasion = await store.getOccasionBySlug(slug);
  if (!occasion) return { title: 'Occasion not found | POOJARO' };
  return {
    title: `${occasion.name} Puja Essentials | POOJARO`,
    description: occasion.description || occasion.tagline,
  };
}

export default async function OccasionPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const qParams = await searchParams;

  const store = await getStore();
  const occasion = await store.getOccasionBySlug(slug);
  if (!occasion || !occasion.isActive) notFound();

  const rawSort = Array.isArray(qParams['sort']) ? qParams['sort'][0] : (qParams['sort'] ?? 'relevance');
  const sort = isAllowedSort(rawSort) ? rawSort : 'relevance';
  const page = Math.max(1, Number(qParams['page']) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const result = await store.listProducts({
    occasionId: occasion.id,
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
            <li><Link href="/shop">Shop</Link></li>
            <li><ChevronRight className="w-3 h-3" /></li>
            <li className="text-brown font-medium">{occasion.name}</li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <SectionHeading
            eyebrow="Occasion"
            title={occasion.name}
            copy={occasion.description || occasion.tagline}
          />
          <ShopSort current={sort} />
        </div>

        {/* Grid */}
        {result.items.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-brown-soft text-sm">
              We&apos;re adding more items for this occasion. Check back soon.
            </p>
            <Link href="/shop" className="mt-4 inline-block text-sm text-gold-deep underline underline-offset-2">
              Browse all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
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
