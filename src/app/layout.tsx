import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n/context';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://alwaradvocates.org'),
  title: {
    default: 'Alwar Advocates Portal & My Case AI Legal Office | बार एसोसिएशन अलवर',
    template: '%s | Alwar Advocates Portal'
  },
  description: 'Official digital practice platform for advocates in Alwar, Rajasthan. e-Courts cause list auto-matching, BNSS/BNS statutory research, Rajasthan advocate welfare fund verification, and private AI legal office.',
  keywords: [
    'Alwar Advocates',
    'District Court Alwar',
    'Rajasthan Bar Council',
    'Advocate Welfare Fund Alwar',
    'eCourts Cause List Alwar',
    'BNSS 2023',
    'BNS 2023',
    'Bharatiya Sakshya Adhiniyam',
    'Legal Practice Management India',
    'Alwar Bar Association',
    'वकील अलवर',
    'अलवर जिला न्यायालय'
  ],
  authors: [{ name: 'District & Sessions Bar Association Alwar', url: 'https://alwaradvocates.org' }],
  creator: 'District & Sessions Bar Association Alwar',
  publisher: 'Alwar Advocates Portal Legal IT Initiative',
  alternates: {
    canonical: 'https://alwaradvocates.org'
  },
  openGraph: {
    type: 'website',
    locale: 'hi_IN',
    alternateLocale: ['en_IN'],
    url: 'https://alwaradvocates.org',
    siteName: 'Alwar Advocates Legal Portal',
    title: 'Alwar Advocates Portal & My Case AI Legal Office',
    description: 'Bilingual legal practice management, e-Courts cause list matching, statutory precedents, and welfare verification for advocates in Alwar, Rajasthan.'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alwar Advocates Portal & My Case AI Legal Office',
    description: 'Bilingual legal practice management, e-Courts cause list matching, statutory precedents, and welfare verification for advocates in Alwar, Rajasthan.'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LegalService',
        '@id': 'https://alwaradvocates.org/#organization',
        name: 'District & Sessions Bar Association Alwar',
        alternateName: 'बार एसोसिएशन अलवर',
        url: 'https://alwaradvocates.org',
        description: 'Official digital practice platform for advocates in Alwar, Rajasthan. e-Courts cause list auto-matching, BNSS statutory research, and advocate welfare.',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'District & Sessions Court Complex, Court Campus',
          addressLocality: 'Alwar',
          addressRegion: 'Rajasthan',
          postalCode: '301001',
          addressCountry: 'IN'
        },
        areaServed: [
          'Alwar',
          'Rajgarh',
          'Kishangarh Bas',
          'Behror',
          'Thanagazi',
          'Tijara'
        ],
        knowsAbout: [
          'Bharatiya Nyaya Sanhita (BNS)',
          'Bharatiya Nagarik Suraksha Sanhita (BNSS)',
          'Bharatiya Sakshya Adhiniyam (BSA)',
          'Rajasthan Tenancy Act',
          'Criminal Defense',
          'Bail Matters'
        ]
      },
      {
        '@type': 'WebSite',
        '@id': 'https://alwaradvocates.org/#website',
        url: 'https://alwaradvocates.org',
        name: 'Alwar Advocates Portal',
        publisher: { '@id': 'https://alwaradvocates.org/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://alwaradvocates.org/advocates?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      }
    ]
  };

  return (
    <html lang="hi" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased font-sans flex flex-col min-h-screen bg-slate-50 text-slate-900">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
