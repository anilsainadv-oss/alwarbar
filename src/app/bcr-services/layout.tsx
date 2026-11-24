import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Bar Council of Rajasthan (BCR) Services & Direct Links | Alwar Portal',
  description: 'Verified quick links and procedures for Bar Council of Rajasthan (BCR) enrollment, ID cards, COP renewal, welfare stamps and disciplinary notices.',
  alternates: {
    canonical: 'https://alwaradvocates.org/bcr-services',
  },
  openGraph: {
    title: 'Bar Council of Rajasthan (BCR) Services Portal',
    description: 'Direct procedural guides and verification for advocate services offered by BCR High Court Building, Jodhpur.',
    url: 'https://alwaradvocates.org/bcr-services',
    siteName: 'Alwar Advocates Portal',
    locale: 'hi_IN',
  },
};

export default function BcrServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
