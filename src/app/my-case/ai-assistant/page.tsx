'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Scale, Sparkles, Folder, Calendar, CheckSquare, 
  AlertTriangle, FileText, CheckCircle2, Clock 
} from 'lucide-react';
import type { CaseRecord } from '@/types/mycase';
import type { AIAnalysisResult } from '@/lib/ai/provider';

export default function CaseFileAnalyzerPage() {
  const { t, locale } = useLanguage();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [factsInput, setFactsInput] = useState('');
  const [docsInput, setDocsInput] = useState('');
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/my-case/cases')
      .then(r => r.json())
      .then(data => {
        if (data.cases && data.cases.length > 0) {
          setCases(data.cases);
          setSelectedCaseId(data.cases[0].id);
          setFactsInput(data.cases[0].private_notes || 'Undivided ancestral agricultural land dispute before SDO Alwar.');
        }
      })
      .catch(console.error);
  }, []);

  const handleCaseChange = (caseId: string) => {
    setSelectedCaseId(caseId);
    const found = cases.find(c => c.id === caseId);
    if (found && found.private_notes) {
      setFactsInput(found.private_notes);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const currentCase = cases.find(c => c.id === selectedCaseId);

    try {
      const res = await fetch('/api/my-case/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseTitle: currentCase?.case_title || 'Litigation Dossier',
          caseType: currentCase?.case_type || 'Civil / Criminal Trial',
          court: currentCase?.court_name || 'District Court, Alwar',
          facts: factsInput,
          documentsText: docsInput || 'Certified revenue jamabandi and FIR documents attached in vault.'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      setAnalysis(data.analysis);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error analyzing dossier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div className="border-b pb-5 border-slate-200">
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
          <Scale className="w-4 h-4" />
          <span>Case Dossier Diagnostic</span>
        </div>
        <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
          {locale === 'hi' ? 'एआई केस फाइल विश्लेषक' : 'AI Case File Analyzer & Trial Strategy'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Automated event chronology, missing evidence checklist, evidentiary contradiction detection, and trial preparation notes.
        </p>
      </div>

      {/* Input Configuration Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Case Dossier</label>
              <select
                value={selectedCaseId}
                onChange={e => handleCaseChange(e.target.value)}
                className="w-full p-2.5 border rounded-lg bg-white"
              >
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.case_title} ({c.court_name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Evidentiary Text / Exhibits</label>
              <input
                type="text"
                value={docsInput}
                onChange={e => setDocsInput(e.target.value)}
                className="w-full p-2.5 border rounded-lg"
                placeholder="Certified Jamabandi Nakal / FIR Excerpts / Bank Return Memo"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Case Narrative & Contentions</label>
            <textarea
              rows={3}
              value={factsInput}
              onChange={e => setFactsInput(e.target.value)}
              className="w-full p-2.5 border rounded-lg"
              placeholder="State key factual narrative, allegations, defence grounds..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg font-semibold shadow-sm transition flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loading ? 'Synthesizing Case Dossier...' : 'Run Case File Diagnostic'}</span>
          </button>
        </form>
      </div>

      {/* Analysis Output */}
      {analysis && (
        <div className="space-y-6">
          {/* Chronology Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-700" />
              <span>Chronological Event Timeline</span>
            </h3>

            <div className="space-y-3">
              {analysis.chronology.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-xs border-l-2 border-amber-600 pl-4 py-1">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900">{item.date}</span>
                    <p className="text-slate-600">{item.event}</p>
                    <span className="text-[10px] text-slate-400 font-mono">Source: {item.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Evidence Checklist & Contradictions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-amber-50/60 p-6 rounded-2xl border border-amber-200 space-y-3 text-xs">
              <h4 className="font-bold text-amber-900 flex items-center space-x-1.5">
                <CheckSquare className="w-4 h-4 text-amber-700" />
                <span>Missing Evidence & Document Checklist:</span>
              </h4>
              <ul className="space-y-2 text-amber-800">
                {analysis.missingEvidenceChecklist.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-purple-50/60 p-6 rounded-2xl border border-purple-200 space-y-3 text-xs">
              <h4 className="font-bold text-purple-900 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-purple-700" />
                <span>Potential Inconsistencies & Contradictions:</span>
              </h4>
              <ul className="space-y-2 text-purple-800">
                {analysis.contradictions.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Core Legal Issues */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <h4 className="font-serif font-bold text-sm text-slate-900 uppercase tracking-wider">
              Framed Legal Issues for Judicial Determination:
            </h4>
            <div className="space-y-2">
              {analysis.legalIssues.map((issue, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-medium text-slate-800">
                  {idx + 1}. {issue}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
