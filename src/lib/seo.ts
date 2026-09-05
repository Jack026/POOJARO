/**
 * Metadata and structured data (§47).
 *
 * Every page builds its <head> through `buildMetadata` so titles, canonicals and
 * social cards cannot drift apart page to page, and the JSON-LD builders below
 * emit the four schema types the brief asks for: Product, BreadcrumbList,
 * Organization and FAQPage.
 *
 * Store name and tagline come from the Settings record, not from constants here,
 * so renaming the shop in the admin panel renames it in search results too (§52,
 * §57). `FALLBACK_STORE` is only used when metadata is generated before the
 * datastore is reachable — never as the everyday source of truth.
 */
import type { Metadata } from 'next';
import { publicEnv } from './env';
import { photo } from './photos';
import type { Product, Settings } from './data/types';
import { formatAmount } from './format';
import { availableStock, isPurchasable, productPricing } from './domain/product';

export const FALLBACK_STORE = {
  name: 'POOJARO',
  tagline: 'Every Ritual. Everything You Need.',
  description:
    'Authentic Puja Samagri and thoughtfully prepared ritual kits, brought together for the moments that matter. Delivered across India.',
} as const;

/** Absolute URL for a site-relative path. Structured data may not use relatives. */
export function absoluteUrl(path = '/'): string {
  const base = publicEnv.siteUrl.replace(/\/+$/, '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}

export interface MetadataInput {
  title?: string;
  description?: string;
  /** Site-relative path — becomes the canonical URL. */
  path?: string;
  /** Key into the photo manifest, or an absolute/relative image URL. */
  image?: string;
  /** Order confirmations, account pages and the admin panel must stay out of search. */
  noIndex?: boolean;
  type?: 'website' | 'article';
}

function resolveImage(image?: string): { url: string; width: number; height: number; alt: string } {
  const asset = photo(image ?? 'og-default') ?? photo('og-default');
  if (asset) {
    return {
      url: absoluteUrl(asset.src),
      width: asset.width,
      height: asset.height,
      alt: asset.alt,
    };
  }
  // Only reachable if the image manifest has not been generated.
  return { url: absoluteUrl('/images/og-default-1024.webp'), width: 1024, height: 536, alt: FALLBACK_STORE.name };
}

export function buildMetadata(input: MetadataInput = {}, settings?: Settings): Metadata {
  const storeName = settings?.storeName ?? FALLBACK_STORE.name;
  const tagline = settings?.tagline ?? FALLBACK_STORE.tagline;

  // The home page reads "POOJARO — Every Ritual. Everything You Need."; every
  // other page appends the store name so a stray tab is still identifiable.
  const title = input.title ? `${input.title} · ${storeName}` : `${storeName} — ${tagline}`;
  const description = input.description ?? FALLBACK_STORE.description;
  const path = input.path ?? '/';
  const url = absoluteUrl(path);
  const image = resolveImage(input.image);

  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: input.type ?? 'website',
      siteName: storeName,
      title,
      description,
      url,
      locale: 'en_IN',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
    robots: input.noIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  };
}

// ---------------------------------------------------------------------------
// Structured data
//
// Each builder returns a plain object. Render it with
// <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(x) }} />
// — the only sanctioned use of that prop in this codebase, and the input is
// always our own serialised object, never user text spliced into a string.
// ---------------------------------------------------------------------------

export function jsonLd(data: object): string {
  // `<` is escaped so a product description containing "</script>" cannot break
  // out of the tag. JSON.stringify alone does not do this.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function organizationSchema(settings: Settings) {
  const sameAs = [settings.social.instagram, settings.social.facebook, settings.social.youtube].filter(
    (link) => link.length > 0,
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.storeName,
    url: absoluteUrl('/'),
    description: settings.tagline,
    logo: absoluteUrl('/icon.svg'),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: settings.supportEmail,
        ...(settings.supportPhone ? { telephone: settings.supportPhone } : {}),
        areaServed: 'IN',
        availableLanguage: ['en', 'hi'],
      },
    ],
  };
}

export function websiteSchema(settings: Settings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: settings.storeName,
    url: absoluteUrl('/'),
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${absoluteUrl('/search')}?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbSchema(trail: ReadonlyArray<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/**
 * Product schema.
 *
 * Availability and price are read through the same helpers the page uses, so a
 * rich result can never advertise a price or a stock state the site itself does
 * not show. `aggregateRating` is omitted entirely when there are no reviews —
 * inventing one would be a fake claim (§23) and Google penalises it.
 */
export function productSchema(product: Product, settings: Settings) {
  const pricing = productPricing(product);
  const inStock = isPurchasable(product);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description,
    sku: product.sku,
    image: product.images.map((img) => absoluteUrl(img.url)),
    brand: { '@type': 'Brand', name: settings.storeName },
    category: product.categoryName,
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: 'INR',
      price: formatAmount(pricing.price),
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: settings.storeName },
      ...(inStock ? { inventoryLevel: { '@type': 'QuantitativeValue', value: availableStock(product) } } : {}),
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating.toFixed(1),
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

export function faqSchema(entries: ReadonlyArray<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  };
}
