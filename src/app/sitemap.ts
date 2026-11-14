import type { MetadataRoute } from 'next';
import { localDb } from '@/lib/db';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alwaradvocates.org';
  const now = new Date();

  // Core public static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/advocates`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/judgments`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/laws`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/court-resources`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/forms`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/forum`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/news`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/notices`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/welfare`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/bcr-services`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/bar-association`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/verify`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/disclaimer`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Dynamic verified public advocates & forum categories
  const dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const s = (localDb as any).ensureLoaded();
    const verifiedAdvocates = (s.advocate_profiles || []).filter(
      (p: any) => p.is_publicly_listed && p.bar_council_enrollment_no
    );

    for (const adv of verifiedAdvocates) {
      const sanitizedEnrollment = encodeURIComponent(adv.bar_council_enrollment_no);
      dynamicRoutes.push({
        url: `${baseUrl}/advocates/${sanitizedEnrollment}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7
      });
    }

    const categories = s.forum_categories || [];
    for (const cat of categories) {
      if (cat.slug) {
        dynamicRoutes.push({
          url: `${baseUrl}/forum/${cat.slug}`,
          lastModified: now,
          changeFrequency: 'daily',
          priority: 0.7
        });
      }
    }
  } catch {
    // Continue with static routes if DB load fails
  }

  return [...staticRoutes, ...dynamicRoutes];
}
