'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Sparkles, Download, Save, RefreshCw, CheckCircle2, 
  AlertCircle, ShieldCheck, FileText, Globe, CheckSquare 
} from 'lucide-react';
import type { AIDraftResult } from '@/lib/ai/provider';
import type { CaseRecord } from '@/types/mycase';

export const dynamic = 'force-dynamic';

function DraftingStudioContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'bail_application';
  const initialCaseId = searchParams.get('caseId') || '';
  const { t, locale } = useLanguage();

  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId);
  const [draftType, setDraftType] = useState(initialType);
  const [draftLanguage, setDraftLanguage] = useState<'hi' | 'en'>(locale);
  const [petitioner, setPetitioner] = useState('');
  const [respondent, setRespondent] = useState('');
  const [courtName, setCourtName] = useState('District & Sessions Court, Alwar');
  const [caseTitle, setCaseTitle] = useState('');
  const [facts, setFacts] = useState('');

  // Result state
  const [draftResult, setDraftResult] = useState<AIDraftResult | null>(null);
  const [editableText, setEditableText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/my-case/cases')
      .then(r => r.json())
      .then(data => {
        if (data.cases) {
          setCases(data.cases);
          if (initialCaseId) {
            const found = data.cases.find((c: CaseRecord) => c.id === initialCaseId);
            if (found) {
              setCaseTitle(found.case_title);
              setCourtName(found.court_name);
              setPetitioner(found.petitioner_parties);
              setRespondent(found.respondent_parties);
            }
          }
        }
      })
      .catch(console.error);
  }, [initialCaseId]);

  const handleCaseSelect = (caseId: string) => {
    setSelectedCaseId(caseId);
    const found = cases.find(c => c.id === caseId);
    if (found) {
      setCaseTitle(found.case_title);
      setCourtName(found.court_name);
      setPetitioner(found.petitioner_parties);
      setRespondent(found.respondent_parties);
      if (found.private_notes) setFacts(found.private_notes);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/my-case/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftType,
          caseTitle,
          courtName,
          parties: { petitioner, respondent },
          facts,
          language: draftLanguage
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate draft');

      setDraftResult(data.draft);
      setEditableText(data.draft.draftText);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Draft generation error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToLedger = async () => {
    if (!editableText.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/my-case/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: selectedCaseId || undefined,
          draft_type: draftType,
          title: `${draftType.toUpperCase()} — ${caseTitle || 'Custom Draft'}`,
          content_text: editableText,
          language: draftLanguage
        })
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportDocx = () => {
    const blob = new Blob([editableText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${draftType}_${new Date().toISOString().split('T')[0]}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Title */}
      <div className="border-b pb-5 border-slate-200">
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
          <Sparkles className="w-4 h-4" />
          <span>Bilingual Court Practice Drafting Engine</span>
        </div>
        <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
          {locale === 'hi' ? 'एआई विधिक ड्राफ्टिंग स्टूडियो' : 'AI Legal Drafting Studio'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
          Automated pleading formulation for Alwar District & Subordinate courts with verified statutory grounds under BNSS, BNS, and CPC.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Config Panel */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <h2 className="font-serif font-bold text-base text-slate-900 border-b pb-3">
            Draft Instructions & Case Context
          </h2>

          <form onSubmit={handleGenerate} className="space-y-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Attach Existing Case (Optional)
              </label>
              <select
                value={selectedCaseId}
                onChange={e => handleCaseSelect(e.target.value)}
                className="w-full p-2 border rounded-lg bg-white"
              >
                <option value="">-- Standalone Draft / Direct Client --</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.case_title} ({c.court_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pleading Template Type</label>
              <select
                value={draftType}
                onChange={e => setDraftType(e.target.value)}
                className="w-full p-2 border rounded-lg bg-white font-medium text-slate-800"
              >
                <option value="bail_application">Regular Bail Application (Sec 480 BNSS, 2023)</option>
                <option value="anticipatory_bail">Anticipatory Bail Application (Sec 482 BNSS, 2023)</option>
                <option value="legal_notice">Statutory Legal Demand Notice</option>
                <option value="written_statement">Written Statement & Preliminary Objections (CPC)</option>
                <option value="affidavit">Sworn Court Affidavit with Verification</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pleading Language</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDraftLanguage('hi')}
                  className={`py-2 rounded-lg border text-center font-semibold transition ${
                    draftLanguage === 'hi' ? 'bg-amber-600 text-white' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  हिंदी (Court Hindi)
                </button>
                <button
                  type="button"
                  onClick={() => setDraftLanguage('en')}
                  className={`py-2 rounded-lg border text-center font-semibold transition ${
                    draftLanguage === 'en' ? 'bg-amber-600 text-white' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  English (Court English)
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Competent Court</label>
              <input
                type="text"
                value={courtName}
                onChange={e => setCourtName(e.target.value)}
                className="w-full p-2 border rounded-lg"
                placeholder="District & Sessions Court, Alwar"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Petitioner / Accused</label>
                <input
                  type="text"
                  value={petitioner}
                  onChange={e => setPetitioner(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Applicant Name"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Respondent / State</label>
                <input
                  type="text"
                  value={respondent}
                  onChange={e => setRespondent(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="State of Rajasthan / SHO"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Factual Narrative & Grounds
              </label>
              <textarea
                rows={4}
                value={facts}
                onChange={e => setFacts(e.target.value)}
                className="w-full p-2 border rounded-lg"
                placeholder="Key facts, FIR sections, custody date, grounds of non-involvement or civil balance of convenience..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-lg shadow-sm transition flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Drafting Pleading...' : 'Generate Legal Pleading'}</span>
            </button>
          </form>

          {/* Honest AI Notice Box */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 block">Advocate Review Guard:</span>
            <p>
              AI does not invent factual claims. Bracketed placeholders like <code>[Insert Date]</code> highlight items requiring advocate affirmation before court filing.
            </p>
          </div>
        </div>

        {/* Right Canvas Editor */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Editable Court Pleading Canvas
                </h3>
                <span className="text-[10px] text-slate-400">
                  {editableText ? `${editableText.length} characters` : 'Awaiting generation'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSaveToLedger}
                  disabled={!editableText || saving}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saveSuccess ? 'Saved!' : 'Save Draft'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportDocx}
                  disabled={!editableText}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export (.docx)</span>
                </button>
              </div>
            </div>

            <textarea
              rows={18}
              value={editableText}
              onChange={e => setEditableText(e.target.value)}
              className="w-full p-4 font-mono text-xs text-slate-800 border rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 leading-relaxed"
              placeholder="Your generated court pleading draft will appear here ready for advocate editing, translation, and export..."
            />

            {draftResult && draftResult.preExportReviewChecklist && (
              <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl text-xs space-y-2">
                <h4 className="font-bold text-emerald-900 flex items-center space-x-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-700" />
                  <span>Pre-Export Advocate Compliance Checklist:</span>
                </h4>
                <ul className="space-y-1 text-emerald-800">
                  {draftResult.preExportReviewChecklist.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIDraftingStudioPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Drafting Studio...</div>}>
      <DraftingStudioContent />
    </Suspense>
  );
}
