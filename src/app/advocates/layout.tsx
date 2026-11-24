import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Advocate Directory & Bar Verification | Alwar Bar Association',
  description: 'Official directory of verified advocates enrolled with the Bar Council of Rajasthan practicing in District & Sessions Court Alwar and subordinate taluka courts.',
  alternates: {
    canonical: 'https://alwaradvocates.org/advocates',
  },
  openGraph: {
    title: 'Alwar Bar Advocate Directory & Verification',
    description: 'Find verified practicing advocates in Alwar District courts. Verify Bar Council enrollment numbers, chambers, and areas of specialization.',
    url: 'https://alwaradvocates.org/advocates',
    siteName: 'Alwar Advocates Portal',
    locale: 'hi_IN',
  },
  twitter: {
    card: 'summary',
    title: 'Alwar Bar Advocate Directory & Verification',
    description: 'Find verified practicing advocates in Alwar District courts.',
  },
};

export default function AdvocatesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
