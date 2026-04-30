import { MetadataRoute } from 'next';
import {
  PUBLIC_INDEXABLE_ROUTES,
  SEO_LAST_MODIFIED,
  absoluteUrl
} from '@/lib/seo';
import { SEO_GUIDES } from '@/lib/seoGuides';

export default function sitemap(): MetadataRoute.Sitemap {
  const guideRoutes = SEO_GUIDES.map((guide) => ({
    path: `/${guide.slug}`,
    title: guide.title,
    priority: guide.slug === 'california-car-accident-settlement-factors' ? 0.9 : 0.78,
    changeFrequency: 'monthly' as const
  }));

  return [...PUBLIC_INDEXABLE_ROUTES, ...guideRoutes].map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: SEO_LAST_MODIFIED,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));
}
