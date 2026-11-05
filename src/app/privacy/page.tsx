'use client';

import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
      <div className="border-b pb-6 border-slate-200">
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
          <Lock className="w-4 h-4" />
          <span>Professional Privilege & Data Protection</span>
        </div>
        <h1 className="font-serif font-bold text-3xl text-slate-900">
          Privacy Policy & Confidentiality Charter
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6 text-xs text-slate-700 leading-relaxed">
        <p className="text-sm font-semibold text-slate-900">
          We recognize that communications between advocates and clients represent sacred professional privilege under Section 132 of the Bharatiya Sakshya Adhiniyam, 2023 (formerly Section 126 of the Indian Evidence Act, 1872).
        </p>

        <h2 className="font-serif font-bold text-base text-slate-900">
          1. Multi-Tenant Case File Isolation
        </h2>
        <p>
          Every case record, uploaded pleading, judicial order, client contact detail, and draft created within <strong>My Case</strong> is tied to the advocate’s cryptographic user ID. No cross-tenant access is possible through direct API requests or identifier manipulation.
        </p>

        <h2 className="font-serif font-bold text-base text-slate-900">
          2. Zero-Knowledge Administrative Wall
        </h2>
        <p>
          System administrators overseeing technical health and server maintenance (**Case Admin**) operate under a zero-knowledge architectural barrier: they are barred from reading confidential case names, client identities, draft contents, or uploaded exhibits.
        </p>

        <h2 className="font-serif font-bold text-base text-slate-900">
          3. Community Forum Privacy Warning
        </h2>
        <p>
          Users of the Advocates Forum must strictly refrain from posting confidential client records, unredacted identities, or privileged communications in public discussion threads.
        </p>
      </div>
    </div>
  );
}
