import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Terms of Service | Alwar Advocates Portal',
  description: 'Terms and conditions governing the use of the Alwar Advocates Digital Platform and My Case Legal Office.',
  alternates: {
    canonical: 'https://alwaradvocates.org/terms',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
