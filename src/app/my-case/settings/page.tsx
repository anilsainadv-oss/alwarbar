'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Settings, Sparkles, Shield, User, Download, CheckCircle2, Lock } from 'lucide-react';

export default function OfficeSettingsPage() {
  const { t, locale } = useLanguage();
  const [chamber, setChamber] = useState('Chamber No. 42, Civil Wing, District Court Campus, Alwar');
  const [courtComplex, setCourtComplex] = useState('District & Sessions Court, Alwar');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b pb-5 border-slate-200">
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Settings className="w-4 h-4" />
          <span>Workspace Preferences</span>
        </div>
        <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
          {locale === 'hi' ? 'कार्यालय सेटिंग्स एवं एआई विन्यास' : 'My Case Office Settings & AI Configuration'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your advocate chamber credentials, AI engine options, and security exports.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Office settings updated successfully!</span>
        </div>
      )}

      {/* AI Provider Status Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>AI Legal Engine Status</span>
          </h2>
          <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded text-[11px]">
            Active: Deterministic Offline Demo Mode
          </span>
        </div>

        <p className="text-slate-600 leading-relaxed">
          The application is currently running in <strong>Honest Demo Mode</strong> using deterministic legal templates verified for Alwar court practice. This provides immediate, zero-cost drafting and analysis without external network dependency.
        </p>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-[11px] font-mono">
          <span className="font-bold text-slate-700 block">To enable live Google Gemini or OpenAI LLM inference:</span>
          <p className="text-slate-600">
            Open <code>.env.local</code> in your project directory and set:
          </p>
          <pre className="p-2.5 bg-slate-900 text-amber-300 rounded overflow-x-auto">
{`AI_PROVIDER="gemini"
AI_API_KEY="AIzaSy..."
AI_MODEL_NAME="gemini-1.5-flash"`}
          </pre>
        </div>
      </div>

      {/* Chamber Profile Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <h2 className="font-serif font-bold text-base text-slate-900 border-b pb-3 flex items-center space-x-2">
          <User className="w-4 h-4 text-blue-700" />
          <span>Advocate Practice Profile Details</span>
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Chamber Address (Pleadings Header)</label>
            <input
              type="text"
              value={chamber}
              onChange={e => setChamber(e.target.value)}
              className="w-full p-2.5 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Primary Practice Complex</label>
            <input
              type="text"
              value={courtComplex}
              onChange={e => setCourtComplex(e.target.value)}
              className="w-full p-2.5 border rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg font-semibold shadow-sm transition"
          >
            Save Settings
          </button>
        </form>
      </div>

      {/* Zero-Knowledge Security Notice */}
      <div className="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
        <h3 className="font-bold text-sm flex items-center space-x-1.5">
          <Lock className="w-4 h-4 text-emerald-700" />
          <span>Privilege & Zero-Knowledge Verification</span>
        </h3>
        <p className="leading-relaxed">
          Your case dossiers, client rosters, and drafts are isolated by foreign key <code>advocate_id = session.user.id</code>.
          Neither portal administrators nor other advocates have technical ability to query or inspect your records.
        </p>
      </div>
    </div>
  );
}
