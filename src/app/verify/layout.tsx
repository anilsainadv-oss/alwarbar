import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Advocate Verification & Bar Council Credential Check | Alwar Bar',
  description: 'Instant verification of advocate enrollment with Bar Council of Rajasthan, active status, chamber location, and public credentials in Alwar.',
  alternates: {
    canonical: 'https://alwaradvocates.org/verify',
  },
  openGraph: {
    title: 'Advocate Verification & Bar Council Credential Check',
    description: 'Verify practicing advocate enrollment numbers and credentials for District & Sessions Court Alwar.',
    url: 'https://alwaradvocates.org/verify',
    siteName: 'Alwar Advocates Portal',
    locale: 'hi_IN',
  },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
