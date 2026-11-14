import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Notices, Circulars & Bar News | Alwar Bar Association',
  description: 'Official notifications, roster changes, holiday lists, administrative circulars, and bar council notices for Alwar District & Sessions Court.',
  alternates: {
    canonical: 'https://alwaradvocates.org/news',
  },
  openGraph: {
    title: 'Notices, Circulars & Bar News | Alwar Bar Association',
    description: 'Timely court circulars, bar association announcements, and district legal service authority notifications.',
    url: 'https://alwaradvocates.org/news',
    siteName: 'Alwar Advocates Portal',
    locale: 'hi_IN',
  },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
