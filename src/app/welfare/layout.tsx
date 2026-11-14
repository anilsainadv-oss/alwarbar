import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Advocate Welfare Fund & 18 Bars Verification | Alwar Bar Association',
  description: 'Check membership status and welfare benefits across the 18 Bar Associations of Alwar District. Rajasthan Advocates Welfare Fund (RAWF) verification.',
  alternates: {
    canonical: 'https://alwaradvocates.org/welfare',
  },
  openGraph: {
    title: 'Advocate Welfare Fund & 18 Bars Verification | Alwar Bar Association',
    description: 'Statutory welfare benefits, insurance dues verification, and Bar Association membership validation across 18 talukas of Alwar.',
    url: 'https://alwaradvocates.org/welfare',
    siteName: 'Alwar Advocates Portal',
    locale: 'hi_IN',
  },
};

export default function WelfareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
