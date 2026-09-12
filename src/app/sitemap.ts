import { MetadataRoute } from 'next';
import { getStore } from '@/lib/data';
import { publicEnv } from '@/lib/env';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const store = await getStore();
  const baseUrl = publicEnv.siteUrl.replace(/\/+$/, '');

  const [productsResult, categories, occasions, festivals] = await Promise.all([
    store.listProducts({ status: 'published', limit: 1000 }),
    store.listCategories(),
    store.listOccasions(),
    store.listFestivals(),
  ]);

  // Product detail pages
  const productUrls: MetadataRoute.Sitemap = productsResult.items.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(product.updatedAt || product.createdAt || Date.now()),
    changeFrequency: 'daily',
    priority: 0.85,
  }));

  // Occasion landing pages
  const occasionUrls: MetadataRoute.Sitemap = occasions
    .filter((o) => o.isActive)
    .map((occasion) => ({
      url: `${baseUrl}/occasions/${occasion.slug}`,
      changeFrequency: 'weekly',
      priority: 0.75,
    }));

  // Festival landing pages
  const festivalUrls: MetadataRoute.Sitemap = festivals
    .filter((f) => f.isActive)
    .map((festival) => ({
      url: `${baseUrl}/festivals/${festival.slug}`,
      changeFrequency: 'weekly',
      priority: 0.75,
    }));

  // Category filter URLs under shop
  const categoryUrls: MetadataRoute.Sitemap = categories
    .filter((c) => c.isActive)
    .map((category) => ({
      url: `${baseUrl}/shop?category=${category.slug}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  // Core discovery and institutional pages
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kits`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ritual-finder`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/occasions`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/festivals`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];

  return [...staticUrls, ...productUrls, ...occasionUrls, ...festivalUrls, ...categoryUrls];
}
