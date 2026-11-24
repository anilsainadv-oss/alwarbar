import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Bar Association Public Administration',
  description: 'Administrative back-office for Alwar Bar Association',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function PublicAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-100">
      {children}
    </div>
  );
}
