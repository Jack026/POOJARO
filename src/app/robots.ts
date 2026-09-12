import { MetadataRoute } from 'next';
import { publicEnv } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = publicEnv.siteUrl.replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/admin',
          '/account/',
          '/account',
          '/checkout/',
          '/checkout',
          '/orders/',
          '/cart/',
          '/cart',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
