import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Privacy Policy & Zero-Knowledge Client Privilege | Alwar Portal',
  description: 'Our uncompromising commitment to advocate-client privilege, zero-knowledge encryption, and data protection under Indian Law.',
  alternates: {
    canonical: 'https://alwaradvocates.org/privacy',
  },
  openGraph: {
    title: 'Privacy Policy & Advocate-Client Privilege Protections',
    description: 'Learn how confidential case files, client rosters, and legal notes are cryptographically shielded.',
    url: 'https://alwaradvocates.org/privacy',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
