import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Statutory Legal Disclaimer | Bar Council of India Compliance',
  description: 'Compliance disclosure under Bar Council of India rules prohibiting legal solicitation and advertising.',
  alternates: {
    canonical: 'https://alwaradvocates.org/disclaimer',
  },
};

export default function DisclaimerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
