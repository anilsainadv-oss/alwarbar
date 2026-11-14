import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Official Court Notices & Circulars | District Court Alwar',
  description: 'Official notifications from District & Sessions Judge Alwar, Bar Association circulars, holiday schedules, and Continuing Legal Education (CLE) programs.',
  alternates: {
    canonical: 'https://alwaradvocates.org/notices',
  },
  openGraph: {
    title: 'Official Court Notices & Circulars | District Court Alwar',
    description: 'Judicial roster changes, bar circulars, and official administrative announcements.',
    url: 'https://alwaradvocates.org/notices',
    siteName: 'Alwar Advocates Portal',
    locale: 'hi_IN',
  },
};

export default function NoticesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
