import type { Metadata } from 'next';
import React from 'react';
import { MyCaseSidebar } from '@/components/mycase/Sidebar';

export const metadata: Metadata = {
  title: 'My Case AI Legal Office',
  description: 'Privileged Advocate Practice Management & AI Legal Assistant',
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

export default function MyCaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-100 min-h-[calc(100vh-80px)]">
      <MyCaseSidebar />
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        {children}
      </div>
    </div>
  );
}
