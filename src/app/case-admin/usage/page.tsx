'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, HardDrive, Sparkles, ShieldCheck } from 'lucide-react';

export default function CaseAdminUsagePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <Link
        href="/case-admin/dashboard"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Service Admin</span>
      </Link>

      <div className="border-b pb-4 border-slate-200">
        <h1 className="font-serif font-bold text-2xl text-slate-900">
          Resource Consumption & AI Quotas
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Monitor aggregate disk usage, document bucket health, and AI usage limits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-blue-700" />
            <span>Document Storage Thresholds</span>
          </h2>

          <div className="space-y-2">
            <div className="flex justify-between font-semibold">
              <span>Supabase Storage Free Tier:</span>
              <span>1,000 MB</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div className="bg-blue-600 h-3 rounded-full" style={{ width: '2.5%' }}></div>
            </div>
            <span className="text-slate-400 block text-[11px]">
              Currently using ~25 MB across case files (2.5% of free tier).
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1 text-slate-600">
            <div>• Per-file upload ceiling: <strong>25 MB</strong></div>
            <div>• Permitted extensions: <code>.pdf, .docx, .png, .jpg</code></div>
            <div>• Retention policy: Indefinite during active tenant subscription</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>AI Provider Quota Management</span>
          </h2>

          <div className="space-y-2">
            <div className="flex justify-between font-semibold">
              <span>Free-First Tier Policy:</span>
              <span className="text-emerald-700">Honest Offline Mode Active</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              When live Gemini is configured via environment variables, requests are rate-limited to 15 Requests Per Minute (RPM) to maintain 100% compliance with Google AI Studio free tier limits.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1 text-slate-600">
            <div>• Active Model: <code>gemini-1.5-flash / Deterministic Offline</code></div>
            <div>• Max Tokens Per Query: <strong>4,000 tokens</strong></div>
            <div>• Commercial Billing: <strong>₹0.00 (Zero Cost)</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
