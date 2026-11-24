import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'District & Sessions Bar Association Alwar | History, Executive & Committees',
  description: 'Official portal of District & Sessions Bar Association Alwar, Rajasthan. Executive body, historical legacy, advocate amenities, and legal aid committee.',
  alternates: {
    canonical: 'https://alwaradvocates.org/bar-association',
  },
  openGraph: {
    title: 'District & Sessions Bar Association Alwar',
    description: 'Serving the legal fraternity of Alwar District since inception. Official executive listing and bar committee initiatives.',
    url: 'https://alwaradvocates.org/bar-association',
    siteName: 'Alwar Advocates Portal',
    locale: 'hi_IN',
  },
};

export default function BarAssociationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
