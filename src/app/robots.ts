import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alwaradvocates.org';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/advocates',
          '/bar-association',
          '/bcr-services',
          '/court-resources',
          '/forms',
          '/forum',
          '/judgments',
          '/laws',
          '/news',
          '/notices',
          '/verify',
          '/welfare',
          '/contact',
          '/terms',
          '/privacy',
          '/disclaimer'
        ],
        disallow: [
          '/my-case/',
          '/my-case/*',
          '/case-admin/',
          '/case-admin/*',
          '/public-admin/',
          '/public-admin/*',
          '/auth/',
          '/auth/*',
          '/api/',
          '/api/*'
        ]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
