'use client';

import React from 'react';
import { ShieldAlert, Scale, CheckCircle2 } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
      <div className="border-b pb-6 border-slate-200">
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
          <ShieldAlert className="w-4 h-4" />
          <span>Statutory Disclosure</span>
        </div>
        <h1 className="font-serif font-bold text-3xl text-slate-900">
          Disclaimer & Independence Notice
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6 text-sm text-slate-700 leading-relaxed">
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
          <strong>Mandatory Notice:</strong> The Alwar Advocates Portal is an independent technological platform developed to facilitate research, professional discussion, and case management for advocates. It is not an official branch of the Bar Council of Rajasthan, Bar Council of India, or the District Bar Association Alwar unless specifically designated by official notification.
        </div>

        <h2 className="font-serif font-bold text-lg text-slate-900">
          1. Legal Information is Not Legal Advice
        </h2>
        <p className="text-xs">
          The statutes, judgments, circulars, summaries, and practice templates contained on this portal are published for informational and educational purposes only. Nothing on this website constitutes formal legal advice or creates an advocate-client relationship. Litigants must consult an enrolled advocate in person.
        </p>

        <h2 className="font-serif font-bold text-lg text-slate-900">
          2. No Scraped Court Data or Automatic Synchronization
        </h2>
        <p className="text-xs">
          This portal does not bypass security access controls or scrape private eCourts data. Links to cause lists and case status direct users to the official eCourts and Rajasthan High Court services.
        </p>

        <h2 className="font-serif font-bold text-lg text-slate-900">
          3. Artificial Intelligence Disclaimer
        </h2>
        <p className="text-xs">
          AI-generated case summaries, legal research results, and drafting templates are assistive tools for enrolled advocates. They do not substitute for the advocate's personal examination of law, facts, and judicial precedents. The advocate maintains exclusive professional accountability for documents filed in court.
        </p>
      </div>
    </div>
  );
}
