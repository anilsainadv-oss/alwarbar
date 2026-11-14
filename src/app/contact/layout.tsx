import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Contact Alwar Bar Association & Technical Cell',
  description: 'Reach District & Sessions Bar Association Alwar office, bar council representatives, legal aid committees, or technical support.',
  alternates: {
    canonical: 'https://alwaradvocates.org/contact',
  },
  openGraph: {
    title: 'Contact Alwar Bar Association',
    description: 'Direct contact coordinates, office hours, and assistance for Alwar legal fraternity and citizens.',
    url: 'https://alwaradvocates.org/contact',
    siteName: 'Alwar Advocates Portal',
    locale: 'hi_IN',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
