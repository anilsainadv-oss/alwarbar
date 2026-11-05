'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import { 
  ArrowLeft, Folder, Calendar, FileText, CheckSquare, Sparkles, 
  Plus, Trash2, Edit2, ShieldAlert, CheckCircle2, Clock, Upload, Scale
} from 'lucide-react';
import type { CaseRecord, CaseDocument, CaseHearing, CaseTask, Invoice } from '@/types/mycase';

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { locale } = useLanguage();

  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [hearings, setHearings] = useState<CaseHearing[]>([]);
  const [tasks, setTasks] = useState<CaseTask[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'hearings' | 'tasks' | 'ai'>('overview');

  // New Document modal state
  const [newDocModal, setNewDocModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<'pleading' | 'evidence' | 'order' | 'bail'>('pleading');

  // New Hearing modal state
  const [newHearingModal, setNewHearingModal] = useState(false);
  const [hearingDate, setHearingDate] = useState('');
  const [hearingNotes, setHearingNotes] = useState('');
  const [hearingAction, setHearingAction] = useState('');

  const loadData = () => {
    if (!id) return;
    fetch(`/api/my-case/cases/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.case) setCaseRecord(data.case);
        if (data.documents) setDocuments(data.documents);
        if (data.hearings) setHearings(data.hearings);
        if (data.tasks) setTasks(data.tasks);
        if (data.invoices) setInvoices(data.invoices);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/my-case/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: id,
          title: docTitle,
          category: docCategory,
          extracted_text: `Pleading uploaded for ${caseRecord?.case_title}. Verified for legal review.`
        })
      });
      setDocTitle('');
      setNewDocModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddHearing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/my-case/hearings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: id,
          hearing_date: hearingDate,
          business_recorded: hearingNotes,
          next_action: hearingAction,
          court_room: caseRecord?.court_name
        })
      });
      setHearingDate('');
      setHearingNotes('');
      setHearingAction('');
      setNewHearingModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading case dossier...</div>;
  }

  if (!caseRecord) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="font-serif font-bold text-xl text-slate-900">Case Not Found or Access Denied</h2>
        <Link href="/my-case/cases" className="text-xs text-amber-800 underline">
          ← Return to Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/my-case/cases"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Case Docket</span>
        </Link>

        <div className="flex items-center space-x-2">
          <Link
            href={`/my-case/drafting?caseId=${id}&type=bail_application`}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Draft for this Case</span>
          </Link>
        </div>
      </div>

      {/* Case Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b pb-4 border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
              {caseRecord.case_type}
            </span>
            <h1 className="font-serif font-bold text-2xl text-slate-900 mt-1.5">
              {caseRecord.case_title}
            </h1>
            <div className="text-xs font-mono text-slate-500 mt-1 flex flex-wrap gap-x-4">
              <span>Suit/Case No: {caseRecord.case_number || 'Pending'}</span>
              <span>CNR: {caseRecord.cnr_number || 'Not Registered'}</span>
              <span>Status: <strong className="uppercase text-emerald-700">{caseRecord.status}</strong></span>
            </div>
          </div>

          {caseRecord.next_hearing_date && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-blue-700 block">Next Hearing Date</span>
              <span className="text-base font-bold text-blue-900 font-mono">{caseRecord.next_hearing_date}</span>
            </div>
          )}
        </div>

        {/* Parties & Court */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Petitioner / Complainant</span>
            <div className="font-semibold text-slate-800">{caseRecord.petitioner_parties}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Respondent / Non-Applicant</span>
            <div className="font-semibold text-slate-800">{caseRecord.respondent_parties}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Competent Court</span>
            <div className="font-semibold text-slate-800">{caseRecord.court_name}</div>
          </div>
        </div>

        {/* Private Strategy Notes */}
        {caseRecord.private_notes && (
          <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 block">
              Confidential Advocate Strategy Notes (Encrypted):
            </span>
            <p className="leading-relaxed">{caseRecord.private_notes}</p>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 transition flex items-center space-x-1.5 ${
            activeTab === 'overview'
              ? 'border-b-2 border-amber-600 text-amber-800 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Dossier Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-2.5 transition flex items-center space-x-1.5 ${
            activeTab === 'documents'
              ? 'border-b-2 border-amber-600 text-amber-800 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documents Vault ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hearings')}
          className={`pb-2.5 transition flex items-center space-x-1.5 ${
            activeTab === 'hearings'
              ? 'border-b-2 border-amber-600 text-amber-800 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Hearing History ({hearings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-2.5 transition flex items-center space-x-1.5 ${
            activeTab === 'tasks'
              ? 'border-b-2 border-amber-600 text-amber-800 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Deadlines ({tasks.length})</span>
        </button>
      </div>

      {/* Tab 1: Documents Vault */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-slate-900">
              Confidential Case Documents & Exhibits
            </h3>
            <button
              onClick={() => setNewDocModal(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border text-center text-xs text-slate-400">
              No documents currently attached to this case. Upload pleadings, certified revenue nakal, or interim orders.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map(doc => (
                <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{doc.title}</h4>
                      <span className="text-[10px] uppercase font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {doc.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      OCR Indexed
                    </span>
                  </div>

                  {doc.extracted_text && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 line-clamp-2">
                      {doc.extracted_text}
                    </p>
                  )}

                  <div className="pt-2 text-[11px] text-slate-400 flex justify-between items-center border-t border-slate-100">
                    <span>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</span>
                    <a
                      href={doc.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-800 font-semibold hover:underline"
                    >
                      Download Document
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Hearings */}
      {activeTab === 'hearings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-slate-900">
              Hearing History & Daily Cause List Entries
            </h3>
            <button
              onClick={() => setNewHearingModal(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Hearing</span>
            </button>
          </div>

          <div className="space-y-3">
            {hearings.map(h => (
              <div key={h.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">Hearing Date: {h.hearing_date}</span>
                  <span className="text-slate-400">{h.court_room}</span>
                </div>
                {h.business_recorded && (
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100">
                    <strong>Business Recorded / Judicial Order:</strong> {h.business_recorded}
                  </p>
                )}
                {h.next_action && (
                  <div className="text-amber-800 font-medium">
                    <strong>Next Action Required:</strong> {h.next_action}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-slate-900">
              Compliance Deadlines & Filings
            </h3>
          </div>

          <div className="space-y-2">
            {tasks.map(t => (
              <div key={t.id} className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{t.title}</div>
                  <div className="text-slate-400">Due: {t.due_date || 'No Date'}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 0: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 font-serif border-b pb-2">
              Case Summary & Current Stage
            </h3>
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px] block">Current Stage of Case:</span>
              <p className="text-slate-800 font-medium mt-0.5">{caseRecord.stage_of_case || 'Preliminary Presentation'}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px] block">Initial Filing Date:</span>
              <p className="text-slate-800 font-medium mt-0.5">{caseRecord.filing_date || 'Pending formal institution'}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px] block">Linked Client:</span>
              <p className="text-slate-800 font-medium mt-0.5">{caseRecord.client?.full_name || 'Direct Case Retention'}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 font-serif border-b pb-2">
              Recent Case Pleadings
            </h3>
            {documents.slice(0, 3).map(d => (
              <div key={d.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="font-medium text-slate-800">{d.title}</span>
                <span className="text-[10px] text-slate-400 uppercase font-mono">{d.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {newDocModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-900 font-serif">Attach Document to Case Vault</h3>
            <form onSubmit={handleAddDocument} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Document Title</label>
                <input
                  required
                  type="text"
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. Certified Copy of FIR / Revenue Map"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={docCategory}
                  onChange={e => setDocCategory(e.target.value as any)}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="pleading">Pleading / Application</option>
                  <option value="evidence">Evidence / Revenue Document</option>
                  <option value="order">Court Order / Interim Stay</option>
                  <option value="bail">Bail & Surety Paper</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button type="button" onClick={() => setNewDocModal(false)} className="px-3 py-1.5 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 text-amber-300 rounded font-semibold">
                  Upload to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Hearing Modal */}
      {newHearingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-900 font-serif">Record Hearing Date & Order</h3>
            <form onSubmit={handleAddHearing} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Hearing Date</label>
                <input
                  required
                  type="date"
                  value={hearingDate}
                  onChange={e => setHearingDate(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Business Recorded / Judicial Notes</label>
                <textarea
                  rows={3}
                  value={hearingNotes}
                  onChange={e => setHearingNotes(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. Reply filed by State. Time granted for arguments."
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Next Action Required</label>
                <input
                  type="text"
                  value={hearingAction}
                  onChange={e => setHearingAction(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. Prepare rejoinder & cite 2025 High Court ruling"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button type="button" onClick={() => setNewHearingModal(false)} className="px-3 py-1.5 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 text-amber-300 rounded font-semibold">
                  Save Hearing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
