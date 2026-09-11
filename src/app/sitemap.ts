import { MetadataRoute } from 'next';
import { getStore } from '@/lib/data';
import { publicEnv } from '@/lib/env';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const store = await getStore();
  
  const baseUrl = publicEnv.siteUrl;
  
  const products = await store.listProducts({ limit: 1000 });
  const categories = await store.listCategories();
  const occasions = await store.listOccasions();
  const festivals = await store.listFestivals();

  const productUrls: MetadataRoute.Sitemap = products.items.map((product) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/shop/${category.slug}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const occasionUrls: MetadataRoute.Sitemap = occasions.map((occasion) => ({
    url: `${baseUrl}/occasions/${occasion.slug}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const festivalUrls: MetadataRoute.Sitemap = festivals.map((festival) => ({
    url: `${baseUrl}/festivals/${festival.slug}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  return [...staticUrls, ...productUrls, ...categoryUrls, ...occasionUrls, ...festivalUrls];
}
