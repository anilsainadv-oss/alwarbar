import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'New Criminal Laws & State Acts (BNS, BNSS, BSA) | Alwar Bar Portal',
  description: 'Comprehensive statutory repository: Bharatiya Nyaya Sanhita (BNS), Bharatiya Nagarik Suraksha Sanhita (BNSS), Bharatiya Sakshya Adhiniyam (BSA), Rajasthan Tenancy Act & Land Revenue laws.',
  alternates: {
    canonical: 'https://alwaradvocates.org/laws',
  },
  openGraph: {
    title: 'New Criminal Laws & State Acts (BNS, BNSS, BSA) | Alwar Bar Portal',
    description: 'Updated Indian Criminal Laws and Rajasthan Land and Revenue statutory texts with cross-reference indices.',
    url: 'https://alwaradvocates.org/laws',
    siteName: 'Alwar Advocates Portal',
    locale: 'hi_IN',
  },
  twitter: {
    card: 'summary',
    title: 'New Criminal Laws (BNS, BNSS, BSA) | Alwar Bar Portal',
    description: 'Complete text and analysis of new criminal codes and Rajasthan statutes.',
  },
};

export default function LawsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
