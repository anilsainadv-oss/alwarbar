import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Landmark Judgments & Legal Precedents | Alwar Court & Rajasthan HC',
  description: 'Search certified Rajasthan High Court and Supreme Court precedents, e-SCR citations, bail jurisprudence, and Alwar district court orders.',
  alternates: {
    canonical: 'https://alwaradvocates.org/judgments',
  },
  openGraph: {
    title: 'Landmark Judgments & Legal Precedents | Alwar Bar Portal',
    description: 'Certified case law search for Rajasthan High Court and Alwar District Court rulings.',
    url: 'https://alwaradvocates.org/judgments',
    siteName: 'Alwar Advocates Portal',
    locale: 'hi_IN',
  },
  twitter: {
    card: 'summary',
    title: 'Landmark Judgments & Precedents | Alwar Bar Portal',
    description: 'Search Rajasthan High Court and Alwar court rulings and citations.',
  },
};

export default function JudgmentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
