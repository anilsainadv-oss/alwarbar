import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Advocates Forum & Legal Discussion | Alwar Bar Association',
  description: 'Professional legal community forum for practicing advocates in Alwar. Exchange perspectives on procedural law, bail jurisprudence, statutory interpretations and trial advocacy.',
  alternates: {
    canonical: 'https://alwaradvocates.org/forum',
  },
  openGraph: {
    title: 'Advocates Forum & Legal Discussion | Alwar Bar Association',
    description: 'Peer forum for advocates in Alwar to discuss judicial rulings, court administrative updates, and statutory points of law.',
    url: 'https://alwaradvocates.org/forum',
    siteName: 'Alwar Advocates Portal',
    locale: 'hi_IN',
  },
};

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
