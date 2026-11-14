import type { Metadata } from 'next';
import React from 'react';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Forum Discussion: ${slug} | Alwar Advocates Forum`,
    description: `Read legal discussion and peer viewpoints on ${slug} at the Alwar Advocates Legal Community Forum.`,
    alternates: {
      canonical: `https://alwaradvocates.org/forum/${slug}`,
    },
    openGraph: {
      title: `Forum Discussion | Alwar Advocates Forum`,
      description: `Peer discussion among advocates of Alwar Bar.`,
      url: `https://alwaradvocates.org/forum/${slug}`,
    },
  };
}

export default function ForumDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
