import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { getStore } from '@/lib/data';
import { ProductGallery } from './ProductGallery';
import { ProductInfo } from './ProductInfo';
import { KitContents } from './KitContents';
import { ProductAccordions } from './ProductAccordions';
import { ProductReviews } from './ProductReviews';
import { ProductCard } from '@/components/shop/ProductCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { productPricing } from '@/lib/domain/product';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore();
  const product = await store.getProductBySlug(slug);
  if (!product) return { title: 'Product not found | POOJARO' };

  const pricing = productPricing(product);
  const imageUrl = product.images[0]?.url;

  return {
    title: `${product.name} | POOJARO`,
    description: product.shortDescription || product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.shortDescription || product.description.slice(0, 160),
      images: imageUrl ? [{ url: imageUrl, width: 1024, height: 1024, alt: product.images[0]?.alt }] : [],
      type: 'website',
    },
    other: {
      'product:price:amount': String(pricing.price / 100),
      'product:price:currency': 'INR',
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const store = await getStore();
  const product = await store.getProductBySlug(slug);

  if (!product || product.status !== 'published') notFound();

  // Reviews and related products in parallel
  const [reviews, relatedResult] = await Promise.all([
    store.listReviews(product.id, 'published'),
    store.listProducts({
      isKit: product.isKit || undefined,
      status: 'published',
      limit: 4,
    }),
  ]);

  const related = relatedResult.items.filter((p) => p.id !== product.id).slice(0, 4);

  // JSON-LD structured data
  const pricing = productPricing(product);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description,
    sku: product.sku,
    image: product.images.map((img) => img.url),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: (pricing.price / 100).toFixed(2),
      availability:
        product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://poojaro.in/products/${product.slug}`,
    },
    aggregateRating:
      product.reviewCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: product.rating.toFixed(1),
            reviewCount: product.reviewCount,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main id="main" className="pt-6 pb-16">
        <div className="container-page">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-1.5 text-xs text-brown-muted">
              <li><Link href="/">Home</Link></li>
              <li><ChevronRight className="w-3 h-3" /></li>
              <li><Link href="/shop">Shop</Link></li>
              {product.isKit && (
                <>
                  <li><ChevronRight className="w-3 h-3" /></li>
                  <li><Link href="/kits">Puja Kits</Link></li>
                </>
              )}
              <li><ChevronRight className="w-3 h-3" /></li>
              <li className="text-brown font-medium">{product.name}</li>
            </ol>
          </nav>

          {/* Product hero: gallery + info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 mb-16">
            <ProductGallery product={product} />
            <ProductInfo product={product} />
          </div>

          {/* Kit contents (§18 — visual "What's Inside" list) */}
          {product.isKit && product.contents.length > 0 && (
            <div className="mb-12">
              <KitContents contents={product.contents} />
            </div>
          )}

          {/* Accordion details (§17) */}
          <div className="mb-16">
            <ProductAccordions product={product} />
          </div>

          {/* Reviews (§31) */}
          <div className="mb-16">
            <ProductReviews product={product} reviews={reviews} />
          </div>

          {/* Related products (§67) */}
          {related.length > 0 && (
            <section aria-labelledby="related-heading">
              <SectionHeading
                id="related-heading"
                eyebrow="You May Also Like"
                title="Complete Your Ritual"
                level={2}
              />
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
