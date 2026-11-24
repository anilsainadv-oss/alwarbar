import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Advocate Authentication & Secure Portal Access',
  description: 'Bar Council enrollment verification and portal sign-in',
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

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      {children}
    </div>
  );
}
