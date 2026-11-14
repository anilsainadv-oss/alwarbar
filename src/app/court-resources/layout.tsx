import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Court Resources & Judicial Complex Directory | District Court Alwar',
  description: 'District & Sessions Court complex guide, court room locations, judicial officer roster, e-filing guidelines, helpline numbers and bar room facilities.',
  alternates: {
    canonical: 'https://alwaradvocates.org/court-resources',
  },
  openGraph: {
    title: 'Court Resources & Judicial Complex Directory | District Court Alwar',
    description: 'Comprehensive directory of courts, judges, administrative benches, and legal services in Alwar.',
    url: 'https://alwaradvocates.org/court-resources',
    siteName: 'Alwar Advocates Portal',
    locale: 'hi_IN',
  },
};

export default function CourtResourcesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
