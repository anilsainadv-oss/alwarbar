'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Scale, Shield, Users, Lock, CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  const { t, locale } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-10">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-legal-navy text-amber-400 flex items-center justify-center mx-auto shadow">
          <Scale className="w-6 h-6" />
        </div>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-slate-900">
          About Alwar Advocates Portal & My Case Legal Office
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
          An independent legal technology initiative dedicated to modernizing legal practice, knowledge sharing, and client-case management for advocates in Alwar, Rajasthan.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6 text-sm text-slate-700 leading-relaxed">
        <h2 className="font-serif font-bold text-xl text-legal-navy">
          Our Vision & Architectural Purpose
        </h2>
        <p>
          Practicing law in district courts requires navigating dense procedural rules, ever-evolving statutory amendments (such as the Bharatiya Nyaya Sanhita, BNSS, and BSA), tight limitation deadlines, and confidential client document management.
        </p>
        <p>
          The <strong>Alwar Advocates Portal</strong> bridges the technological gap for solo practitioners and small law offices. It delivers a unified, bilingual experience combining open public resources with a high-security, encrypted personal workspace (**My Case**).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-amber-700" />
              <span>Advocate Welfare Integration</span>
            </h3>
            <p className="text-xs text-slate-600">
              Direct access to Rajasthan Advocates Welfare Fund procedures, death benefits, medical insurance, and young advocate stipends.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Lock className="w-4 h-4 text-emerald-700" />
              <span>Privileged Data Confidentiality</span>
            </h3>
            <p className="text-xs text-slate-600">
              Strict multi-tenant Row-Level Security ensuring private case notes, documents, and client records are completely inaccessible to third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
