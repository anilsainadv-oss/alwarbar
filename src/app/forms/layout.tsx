import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Legal Forms, Pleadings & Vakalatnama Templates | Alwar Bar',
  description: 'Download official High Court and District Court prescribed legal templates: Vakalatnama, Bail applications, Affidavits, Petitions, and Stamp duty schedules.',
  alternates: {
    canonical: 'https://alwaradvocates.org/forms',
  },
  openGraph: {
    title: 'Legal Forms, Pleadings & Vakalatnama Templates | Alwar Bar',
    description: 'Bilingual legal pleading templates compliant with District Court Alwar rules and Rajasthan High Court practice directives.',
    url: 'https://alwaradvocates.org/forms',
    siteName: 'Alwar Advocates Portal',
    locale: 'hi_IN',
  },
};

export default function FormsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
