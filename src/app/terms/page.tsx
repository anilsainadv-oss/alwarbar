'use client';

import React from 'react';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
      <div className="border-b pb-6 border-slate-200">
        <h1 className="font-serif font-bold text-3xl text-slate-900">
          Terms of Service & Advocate Code
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-4 text-xs text-slate-700 leading-relaxed">
        <h2 className="font-serif font-bold text-sm text-slate-900">1. Eligibility</h2>
        <p>Access to the My Case Legal Office is restricted to enrolled advocates, registered law clerks, and verified legal practitioners.</p>
        <h2 className="font-serif font-bold text-sm text-slate-900">2. Professional Responsibility</h2>
        <p>Users must comply with Bar Council of India standards of professional conduct and etiquette. Generating court pleadings via AI assistive modules does not relieve counsel of verifying all factual and legal submissions.</p>
        <h2 className="font-serif font-bold text-sm text-slate-900">3. Community Forum Decorum</h2>
        <p>Posts in the Advocates Forum must maintain collegial and ethical professional standards. Defamation, spam, commercial solicitations, and breach of judicial sub-judice principles will result in immediate suspension.</p>
      </div>
    </div>
  );
}
