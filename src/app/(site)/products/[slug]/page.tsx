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
import { publicEnv } from '@/lib/env';
import { productSchema, breadcrumbSchema, jsonLd } from '@/lib/seo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore();
  const [product, settings] = await Promise.all([
    store.getProductBySlug(slug),
    store.getSettings(),
  ]);

  if (!product) return { title: 'Product not found | POOJARO' };

  const pricing = productPricing(product);
  const imageUrl = product.images[0]?.url;
  const canonicalUrl = `${publicEnv.siteUrl.replace(/\/+$/, '')}/products/${product.slug}`;
  const resolvedImageUrl = imageUrl
    ? imageUrl.startsWith('http')
      ? imageUrl
      : `${publicEnv.siteUrl.replace(/\/+$/, '')}${imageUrl}`
    : undefined;

  return {
    title: `${product.name} — ${settings.storeName}`,
    description: product.shortDescription || product.description.slice(0, 160),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: product.name,
      description: product.shortDescription || product.description.slice(0, 160),
      url: canonicalUrl,
      siteName: settings.storeName,
      images: resolvedImageUrl
        ? [
            {
              url: resolvedImageUrl,
              width: 1024,
              height: 1024,
              alt: product.images[0]?.alt || product.name,
            },
          ]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.shortDescription || product.description.slice(0, 160),
      images: resolvedImageUrl ? [resolvedImageUrl] : [],
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

  // Reviews, related products, and store settings in parallel
  const [reviews, relatedResult, settings] = await Promise.all([
    store.listReviews(product.id, 'published'),
    store.listProducts({
      isKit: product.isKit || undefined,
      status: 'published',
      limit: 4,
    }),
    store.getSettings(),
  ]);

  const related = relatedResult.items.filter((p) => p.id !== product.id).slice(0, 4);

  // Validated Schema.org structured data
  const pSchema = productSchema(product, settings);
  const bSchema = breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    ...(product.isKit ? [{ name: 'Puja Kits', path: '/kits' }] : []),
    { name: product.name, path: `/products/${product.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(pSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(bSchema) }}
      />

      <main id="main" className="pt-6 pb-16">
        <div className="container-page">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-1.5 text-xs text-brown-muted flex-wrap">
              <li>
                <Link href="/" className="hover:text-gold-deep transition-colors">
                  Home
                </Link>
              </li>
              <li><ChevronRight className="w-3 h-3 text-sand-deep" /></li>
              <li>
                <Link href="/shop" className="hover:text-gold-deep transition-colors">
                  Shop
                </Link>
              </li>
              {product.isKit && (
                <>
                  <li><ChevronRight className="w-3 h-3 text-sand-deep" /></li>
                  <li>
                    <Link href="/kits" className="hover:text-gold-deep transition-colors">
                      Puja Kits
                    </Link>
                  </li>
                </>
              )}
              <li><ChevronRight className="w-3 h-3 text-sand-deep" /></li>
              <li className="text-brown font-medium truncate max-w-[200px] sm:max-w-none">
                {product.name}
              </li>
            </ol>
          </nav>

          {/* Product hero: gallery + info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 mb-16">
            <ProductGallery product={product} />
            <ProductInfo product={product} />
          </div>

          {/* Kit contents (Visual "What's Inside" list) */}
          {product.isKit && product.contents.length > 0 && (
            <div className="mb-12">
              <KitContents contents={product.contents} />
            </div>
          )}

          {/* Accordion details */}
          <div className="mb-16">
            <ProductAccordions product={product} />
          </div>

          {/* Reviews */}
          <div className="mb-16">
            <ProductReviews product={product} reviews={reviews} />
          </div>

          {/* Related products */}
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
