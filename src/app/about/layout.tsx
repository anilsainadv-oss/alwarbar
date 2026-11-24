import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'About Alwar Advocates Portal & Legal Tech Initiative',
  description: 'The purpose, vision and zero-knowledge privacy architecture powering the Alwar Advocates Digital Legal Portal.',
  alternates: {
    canonical: 'https://alwaradvocates.org/about',
  },
  openGraph: {
    title: 'About Alwar Advocates Portal & Legal Tech Initiative',
    description: 'Bilingual digital platform dedicated to empowering legal professionals in Alwar, Rajasthan.',
    url: 'https://alwaradvocates.org/about',
    siteName: 'Alwar Advocates Portal',
    locale: 'hi_IN',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
