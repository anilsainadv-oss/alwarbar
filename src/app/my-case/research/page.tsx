'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Search, BookOpen, CheckCircle, ShieldAlert, Bookmark, 
  ExternalLink, Sparkles, Scale, AlertCircle, CheckCircle2 
} from 'lucide-react';
import type { AIResearchResult } from '@/lib/ai/provider';

export default function AILegalResearchPage() {
  const { t, locale } = useLanguage();
  const [query, setQuery] = useState('Grounds for regular bail under Section 480 BNSS 2023 for non-bailable offences in Rajasthan');
  const [researchLang, setResearchLang] = useState<'hi' | 'en'>(locale);
  const [researchResult, setResearchResult] = useState<AIResearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/my-case/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, language: researchLang })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Research failed');

      setResearchResult(data.research);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Research query error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToLibrary = async (title: string, citation: string, notes: string) => {
    try {
      await fetch('/api/my-case/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category: 'Verified Precedent',
          citation,
          notes
        })
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div className="border-b pb-5 border-slate-200">
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
          <BookOpen className="w-4 h-4" />
          <span>Retrieval-Augmented Legal Intelligence</span>
        </div>
        <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
          {locale === 'hi' ? 'एआई विधिक शोध एवं न्यायिक दृष्टांत' : 'AI Legal Research & Precedent Search'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Natural-language legal queries grounded in verified Indian statutes (BNS, BNSS, BSA, CPC) and authoritative Supreme Court & Rajasthan High Court citations.
        </p>
      </div>

      {/* Query Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-700">Enter Legal Question or Proposition:</label>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-400">Response Language:</span>
              <button
                type="button"
                onClick={() => setResearchLang('en')}
                className={`px-2 py-0.5 rounded font-semibold ${researchLang === 'en' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setResearchLang('hi')}
                className={`px-2 py-0.5 rounded font-semibold ${researchLang === 'hi' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                हिंदी
              </button>
            </div>
          </div>

          <div className="flex items-center bg-slate-50 border rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500">
            <Search className="w-4 h-4 text-slate-400 ml-2.5 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-transparent focus:outline-none"
              placeholder="e.g. Injunction against co-sharer in Rajasthan Tenancy Act / Section 480 BNSS bail grounds..."
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold shrink-0 shadow-sm transition flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loading ? 'Researching...' : 'Conduct Research'}</span>
            </button>
          </div>
        </form>

        <div className="text-[11px] text-slate-500 flex flex-wrap gap-2 pt-1">
          <span className="font-bold text-slate-700">Try Practice Prompts:</span>
          <button
            onClick={() => setQuery('Section 480 BNSS bail conditions non bailable offence')}
            className="text-blue-700 hover:underline"
          >
            BNSS Section 480 Bail
          </button>
          <span>•</span>
          <button
            onClick={() => setQuery('Temporary injunction co-sharer undivided land Rajasthan Tenancy Act')}
            className="text-blue-700 hover:underline"
          >
            Co-sharer Injunction (RTA Sec 212)
          </button>
          <span>•</span>
          <button
            onClick={() => setQuery('Mandatory certificate for electronic evidence under Section 63 BSA 2023')}
            className="text-blue-700 hover:underline"
          >
            Digital Evidence Certificate (Sec 63 BSA)
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Citation saved to your Personal Legal Library!</span>
        </div>
      )}

      {/* Results View */}
      {researchResult && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs border-b pb-3 border-slate-100">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                Grounded Legal Synthesis
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                {researchResult.provider}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              {researchResult.summary}
            </p>
          </div>

          {/* Statutory Provisions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
              <Scale className="w-4 h-4 text-blue-700" />
              <span>Governing Statutory Enactments & Sections</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {researchResult.statutoryProvisions.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1 text-xs">
                  <div className="font-bold text-blue-900">{item.section} — {item.act}</div>
                  <p className="text-slate-600 leading-relaxed">{item.relevance}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Verified Case Citations */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-amber-700" />
              <span>Verified Supreme Court & High Court Precedents</span>
            </h3>

            <div className="space-y-3">
              {researchResult.verifiedCitations.map((cite, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 space-y-2 text-xs hover:border-amber-400 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="font-bold text-slate-900 text-sm font-serif">{cite.citation}</h4>
                    <span className="text-[11px] font-mono text-slate-400">{cite.court} ({cite.bench})</span>
                  </div>
                  <p className="text-slate-700 bg-amber-50/50 p-3 rounded-lg border border-amber-200/60 leading-relaxed font-medium">
                    <strong>Held / Proposition:</strong> {cite.proposition}
                  </p>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleSaveToLibrary(cite.citation, cite.citation, cite.proposition)}
                      className="text-amber-800 hover:text-amber-900 font-semibold flex items-center space-x-1"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Save Precedent to Personal Library</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supporting vs Counter Arguments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-200 space-y-3 text-xs">
              <h4 className="font-bold text-emerald-900 uppercase tracking-wider">
                Arguments Supporting Your Position:
              </h4>
              <ul className="space-y-2 text-emerald-800">
                {researchResult.supportingArguments.map((arg, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span>{arg}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-red-50/60 p-6 rounded-2xl border border-red-200 space-y-3 text-xs">
              <h4 className="font-bold text-red-900 uppercase tracking-wider">
                Anticipated Opposing Arguments to Rebut:
              </h4>
              <ul className="space-y-2 text-red-800">
                {researchResult.counterArguments.map((arg, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 shrink-0" />
                    <span>{arg}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
