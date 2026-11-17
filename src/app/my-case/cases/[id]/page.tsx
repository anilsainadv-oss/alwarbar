'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import { 
  ArrowLeft, Folder, Calendar, FileText, CheckSquare, Sparkles, 
  Plus, Trash2, Edit2, ShieldAlert, CheckCircle2, Clock, Upload, Scale, Download,
  ExternalLink, Copy, Check, BookOpen
} from 'lucide-react';
import type { CaseRecord, CaseDocument, CaseHearing, CaseTask, Invoice, CaseStatus } from '@/types/mycase';
import type { SavedResearch } from '@/types/legal-research';

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
  const [savedResearch, setSavedResearch] = useState<SavedResearch[]>([]);
  const [copiedCitation, setCopiedCitation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'hearings' | 'tasks' | 'research'>('overview');

  // Edit Case Modal state
  const [editCaseModal, setEditCaseModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCourt, setEditCourt] = useState('');
  const [editType, setEditType] = useState('');
  const [editPetitioner, setEditPetitioner] = useState('');
  const [editRespondent, setEditRespondent] = useState('');
  const [editCaseNumber, setEditCaseNumber] = useState('');
  const [editCnr, setEditCnr] = useState('');
  const [editFilingDate, setEditFilingDate] = useState('');
  const [editNextDate, setEditNextDate] = useState('');
  const [editStage, setEditStage] = useState('');
  const [editStatus, setEditStatus] = useState<CaseStatus>('active');
  const [editNotes, setEditNotes] = useState('');

  // Delete Case state
  const [deleteCaseModal, setDeleteCaseModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // New Document modal state
  const [newDocModal, setNewDocModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<'pleading' | 'evidence' | 'order' | 'bail' | 'vakalatnama' | 'other'>('pleading');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState('');

  // Hearing modal states
  const [newHearingModal, setNewHearingModal] = useState(false);
  const [editHearingModal, setEditHearingModal] = useState(false);
  const [editingHearing, setEditingHearing] = useState<CaseHearing | null>(null);
  const [hearingDate, setHearingDate] = useState('');
  const [courtRoom, setCourtRoom] = useState('');
  const [judgeName, setJudgeName] = useState('');
  const [hearingNotes, setHearingNotes] = useState('');
  const [hearingAction, setHearingAction] = useState('');
  const [nextHearingDate, setNextHearingDate] = useState('');
  const [attended, setAttended] = useState(false);

  const loadData = () => {
    if (!id) return;
    fetch(`/api/my-case/cases/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.case) {
          setCaseRecord(data.case);
          setEditTitle(data.case.case_title);
          setEditCourt(data.case.court_name);
          setEditType(data.case.case_type);
          setEditPetitioner(data.case.petitioner_parties || '');
          setEditRespondent(data.case.respondent_parties || '');
          setEditCaseNumber(data.case.case_number || '');
          setEditCnr(data.case.cnr_number || '');
          setEditFilingDate(data.case.filing_date || '');
          setEditNextDate(data.case.next_hearing_date || '');
          setEditStage(data.case.stage_of_case || 'Hearing');
          setEditStatus(data.case.status);
          setEditNotes(data.case.private_notes || '');
        }
        if (data.documents) setDocuments(data.documents);
        if (data.hearings) setHearings(data.hearings);
        if (data.tasks) setTasks(data.tasks);
        if (data.invoices) setInvoices(data.invoices);
        if (data.savedResearch) setSavedResearch(data.savedResearch);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleDeleteSavedResearch = async (researchId: string) => {
    if (!confirm('Are you sure you want to unlink this precedent from the case docket?')) return;
    try {
      const res = await fetch(`/api/my-case/research/saved?id=${researchId}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedResearch(prev => prev.filter(r => r.id !== researchId));
      } else {
        alert('Failed to remove precedent');
      }
    } catch (err) {
      console.error(err);
      alert('Network error unlinking precedent');
    }
  };

  const handleCopyCitation = (citation: string, id: string) => {
    navigator.clipboard.writeText(citation);
    setCopiedCitation(id);
    setTimeout(() => setCopiedCitation(null), 2000);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/my-case/cases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_title: editTitle,
          court_name: editCourt,
          case_type: editType,
          petitioner_parties: editPetitioner,
          respondent_parties: editRespondent,
          case_number: editCaseNumber,
          cnr_number: editCnr,
          filing_date: editFilingDate,
          next_hearing_date: editNextDate,
          stage_of_case: editStage,
          status: editStatus,
          notes: editNotes
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update case');
      }

      setEditCaseModal(false);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating case');
    }
  };

  const handleQuickStatusChange = async (newStatus: CaseStatus) => {
    try {
      const res = await fetch(`/api/my-case/cases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCase = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/my-case/cases/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete case');
      router.push('/my-case/cases');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting case');
      setDeleting(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocError('');
    setUploadingDoc(true);

    try {
      const formData = new FormData();
      formData.append('case_id', id);
      formData.append('title', docTitle);
      formData.append('category', docCategory);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await fetch('/api/my-case/documents', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setDocTitle('');
      setSelectedFile(null);
      setNewDocModal(false);
      loadData();
    } catch (err: unknown) {
      setDocError(err instanceof Error ? err.message : 'Upload error');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleAddHearing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/my-case/hearings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: id,
          hearing_date: hearingDate,
          court_room: courtRoom || caseRecord?.court_name,
          judge_name: judgeName,
          business_recorded: hearingNotes,
          next_action: hearingAction,
          next_hearing_date: nextHearingDate
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to record hearing');
      }

      setHearingDate('');
      setCourtRoom('');
      setJudgeName('');
      setHearingNotes('');
      setHearingAction('');
      setNextHearingDate('');
      setNewHearingModal(false);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error recording hearing');
    }
  };

  const openEditHearing = (h: CaseHearing) => {
    setEditingHearing(h);
    setHearingDate(h.hearing_date);
    setCourtRoom(h.court_room || '');
    setJudgeName(h.judge_name || '');
    setHearingNotes(h.business_recorded || '');
    setHearingAction(h.next_action || '');
    setNextHearingDate(h.next_hearing_date || '');
    setAttended(h.attended || false);
    setEditHearingModal(true);
  };

  const handleUpdateHearing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHearing) return;

    try {
      const res = await fetch(`/api/my-case/hearings/${editingHearing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hearing_date: hearingDate,
          court_room: courtRoom,
          judge_name: judgeName,
          business_recorded: hearingNotes,
          next_action: hearingAction,
          next_hearing_date: nextHearingDate,
          attended
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update hearing');
      }

      setEditHearingModal(false);
      setEditingHearing(null);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating hearing');
    }
  };

  const handleCancelHearing = async (hearingId: string) => {
    if (!confirm('Are you sure you want to cancel and remove this hearing record?')) return;
    try {
      const res = await fetch(`/api/my-case/hearings/${hearingId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to cancel hearing');
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error cancelling hearing');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/my-case/cases"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Case Docket</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setEditCaseModal(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Edit Case Details</span>
          </button>
          <button
            onClick={() => setDeleteCaseModal(true)}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            <span>Delete Case</span>
          </button>
          <Link
            href={`/my-case/research?case_id=${id}&query=${encodeURIComponent(`${caseRecord.case_title} ${caseRecord.case_type || ''}`.trim())}`}
            className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
            title="Research binding citations & precedents for this case docket"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Research Precedents</span>
          </Link>
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
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b pb-4 border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                {caseRecord.case_type}
              </span>
              {/* Quick Status Selector */}
              <select
                value={caseRecord.status}
                onChange={e => handleQuickStatusChange(e.target.value as CaseStatus)}
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-slate-50 text-slate-800 border-slate-200 focus:outline-none"
              >
                <option value="active">● Active (विचाराधीन)</option>
                <option value="stayed">⏸ Stayed (स्थगित)</option>
                <option value="reserved_for_order">⚖ Reserved (सुरक्षित)</option>
                <option value="disposed">✓ Disposed (निस्तारित)</option>
                <option value="archived">📁 Archived (अभिलेखागार)</option>
              </select>
            </div>
            <h1 className="font-serif font-bold text-2xl text-slate-900 mt-2">
              {caseRecord.case_title}
            </h1>
            <div className="text-xs font-mono text-slate-500 mt-1 flex flex-wrap gap-x-4">
              <span>Suit/Case No: <strong>{caseRecord.case_number || 'Pending'}</strong></span>
              <span>CNR: <strong>{caseRecord.cnr_number || 'Not Registered'}</strong></span>
              <span>Stage: <strong>{caseRecord.stage_of_case || 'Hearing'}</strong></span>
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
            <div className="font-semibold text-slate-800">{caseRecord.petitioner_parties || 'Not specified'}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Respondent / Non-Applicant</span>
            <div className="font-semibold text-slate-800">{caseRecord.respondent_parties || 'Not specified'}</div>
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
              Confidential Advocate Strategy Notes:
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

        <button
          onClick={() => setActiveTab('research')}
          className={`pb-2.5 transition flex items-center space-x-1.5 ${
            activeTab === 'research'
              ? 'border-b-2 border-amber-600 text-amber-800 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Legal Precedents ({savedResearch.length})</span>
        </button>
      </div>

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
            <h3 className="font-bold text-sm text-slate-900 font-serif border-b pb-2 flex items-center justify-between">
              <span>Recent Case Pleadings</span>
              <Link href="/my-case/documents" className="text-amber-800 hover:underline text-[11px] font-normal">
                All Documents →
              </Link>
            </h3>
            {documents.length === 0 ? (
              <p className="text-slate-400">No documents attached yet.</p>
            ) : (
              documents.slice(0, 3).map(d => (
                <div key={d.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between">
                  <span className="font-medium text-slate-800">{d.title}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">{d.category}</span>
                </div>
              ))
            )}
          </div>

          {/* Linked Precedents Card in Overview */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 text-xs md:col-span-2">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 font-serif">
                  Case Precedents & Legal Authorities ({savedResearch.length})
                </h3>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveTab('research')}
                  className="text-indigo-700 hover:underline text-[11px] font-semibold"
                >
                  View All Precedents →
                </button>
                <Link
                  href={`/my-case/research?case_id=${id}&query=${encodeURIComponent(`${caseRecord.case_title} ${caseRecord.case_type || ''}`.trim())}`}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold transition"
                >
                  + Research Precedents
                </Link>
              </div>
            </div>
            {savedResearch.length === 0 ? (
              <div className="text-center py-4 text-slate-400">
                <span>No legal precedents linked yet. </span>
                <Link
                  href={`/my-case/research?case_id=${id}&query=${encodeURIComponent(`${caseRecord.case_title} ${caseRecord.case_type || ''}`.trim())}`}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Launch AI Precedent Search for this case →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {savedResearch.slice(0, 4).map(sr => (
                  <div key={sr.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {sr.document?.citation || 'Precedent'}
                      </span>
                      <span className="text-[10px] text-slate-400">{sr.document?.court_level || 'Court'}</span>
                    </div>
                    <div className="font-semibold text-slate-900 text-xs line-clamp-1">
                      {sr.document?.title || 'Court Judgment'}
                    </div>
                    {sr.notes && (
                      <p className="text-[11px] text-slate-600 line-clamp-1 italic bg-white/70 p-1 rounded border border-slate-100">
                        &quot;{sr.notes}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
              No documents currently attached to this case. Upload pleadings, revenue nakal, or interim orders.
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
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      OCR {doc.ocr_status || 'Pending'}
                    </span>
                  </div>

                  <div className="pt-2 text-[11px] text-slate-400 flex justify-between items-center border-t border-slate-100">
                    <span>Size: {(doc.file_size_bytes / 1024).toFixed(1)} KB</span>
                    <a
                      href={`/api/my-case/documents/download?docId=${doc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-800 font-semibold hover:underline flex items-center space-x-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
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
            {hearings.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border text-center text-xs text-slate-400">
                No hearings recorded yet for this case.
              </div>
            ) : (
              hearings.map(h => (
                <div key={h.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 font-mono">Date: {h.hearing_date}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500">{h.court_room}</span>
                      <button
                        onClick={() => openEditHearing(h)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] flex items-center space-x-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleCancelHearing(h.id)}
                        className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[11px] flex items-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                  {h.business_recorded && (
                    <p className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100">
                      <strong>Proceedings & Order:</strong> {h.business_recorded}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between text-slate-600 pt-1">
                    {h.next_action && (
                      <span className="text-amber-800 font-medium">
                        <strong>Next Action:</strong> {h.next_action}
                      </span>
                    )}
                    {h.next_hearing_date && (
                      <span className="text-blue-700 font-mono font-bold">
                        Next Date: {h.next_hearing_date}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-base text-slate-900">
            Compliance Deadlines & Filings
          </h3>
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border text-center text-xs text-slate-400">
                No active deadlines attached to this case.
              </div>
            ) : (
              tasks.map(t => (
                <div key={t.id} className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">{t.title}</div>
                    <div className="text-slate-400">Due: {t.due_date || 'No Date'}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {t.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Legal Precedents & Authorities */}
      {activeTab === 'research' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
                <Scale className="w-5 h-5 text-indigo-700" />
                <span>Linked Precedents & Legal Authorities ({savedResearch.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Authoritative judicial precedents linked to this case docket for application in written statements, rejoinders, and final arguments.
              </p>
            </div>

            <Link
              href={`/my-case/research?case_id=${id}&query=${encodeURIComponent(`${caseRecord.case_title} ${caseRecord.case_type || ''}`.trim())}`}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-700 to-indigo-800 hover:from-indigo-800 hover:to-indigo-900 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-2 shrink-0 self-start sm:self-auto"
            >
              <Scale className="w-4 h-4" />
              <span>Search More Precedents for Case</span>
            </Link>
          </div>

          {savedResearch.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Scale className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-serif font-bold text-base text-slate-900">
                  No Legal Precedents Attached Yet
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enhance your case strategy by retrieving landmark Supreme Court and High Court judgments relevant to &quot;{caseRecord.case_type || caseRecord.case_title}&quot;.
                </p>
              </div>
              <Link
                href={`/my-case/research?case_id=${id}&query=${encodeURIComponent(`${caseRecord.case_title} ${caseRecord.case_type || ''}`.trim())}`}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-semibold shadow transition"
              >
                <Scale className="w-4 h-4" />
                <span>Launch Case Precedent Search</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {savedResearch.map(item => {
                const doc = item.document;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b pb-3 border-slate-100">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded border border-indigo-200">
                            {doc?.citation || 'Precedent Record'}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {doc?.court_level || 'Court'}
                          </span>
                          {doc?.judgment_date && (
                            <span className="text-[10px] font-mono text-slate-500">
                              Decided: {doc.judgment_date}
                            </span>
                          )}
                        </div>
                        <h4 className="font-serif font-bold text-base text-slate-900 leading-snug">
                          {doc?.title || 'Court Judgment'}
                        </h4>
                        <div className="text-xs text-slate-600 mt-1">
                          <span className="font-semibold text-slate-800">{doc?.court_name}</span>
                          {doc?.judge_names && <span> • Bench: {doc.judge_names}</span>}
                        </div>
                      </div>

                      {/* Precedent Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCopyCitation(doc?.citation || '', item.id)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                          title="Copy citation"
                        >
                          {copiedCitation === item.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Citation</span>
                            </>
                          )}
                        </button>

                        <a
                          href={`/api/public/judgments/download?citation=${encodeURIComponent(doc?.citation || '')}&format=pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                          title="Download Certified PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-700" />
                          <span>PDF Copy</span>
                        </a>

                        <button
                          onClick={() => handleDeleteSavedResearch(item.id)}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                          title="Unlink from this case docket"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Unlink</span>
                        </button>
                      </div>
                    </div>

                    {/* Legal Proposition / Summary */}
                    {doc && (doc.summary || doc.full_text) && (
                      <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                        <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                          Core Judicial Holding / Proposition:
                        </span>
                        <p>{doc.summary || doc.full_text.slice(0, 300) + '...'}</p>
                      </div>
                    )}

                    {/* Advocate's Custom Case Strategy Notes */}
                    {item.notes && (
                      <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 text-xs text-amber-950 space-y-1">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800 block">
                          Advocate Docket Strategy Note:
                        </span>
                        <p className="leading-relaxed italic">&quot;{item.notes}&quot;</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                      <div>
                        {doc?.statutes && (
                          <span>
                            <strong className="text-slate-700">Applicable Statutes:</strong> {doc.statutes}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Linked on: {new Date(item.created_at).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Case Modal */}
      {editCaseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-900 border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 text-xs">
            <h3 className="font-serif font-bold text-xl text-slate-900 border-b pb-3">
              Edit Case Details
            </h3>

            <form onSubmit={handleUpdateCase} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Case Title</label>
                <input
                  required
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Court Name</label>
                  <input
                    required
                    type="text"
                    value={editCourt}
                    onChange={e => setEditCourt(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Case Type</label>
                  <input
                    required
                    type="text"
                    value={editType}
                    onChange={e => setEditType(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Petitioner</label>
                  <input
                    type="text"
                    value={editPetitioner}
                    onChange={e => setEditPetitioner(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Respondent</label>
                  <input
                    type="text"
                    value={editRespondent}
                    onChange={e => setEditRespondent(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Suit / Case No.</label>
                  <input
                    type="text"
                    value={editCaseNumber}
                    onChange={e => setEditCaseNumber(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">CNR Number</label>
                  <input
                    type="text"
                    value={editCnr}
                    onChange={e => setEditCnr(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as CaseStatus)}
                    className="w-full p-2.5 border rounded-lg bg-white"
                  >
                    <option value="active">Active (विचाराधीन)</option>
                    <option value="stayed">Stayed (स्थगित)</option>
                    <option value="reserved_for_order">Reserved (सुरक्षित)</option>
                    <option value="disposed">Disposed (निस्तारित)</option>
                    <option value="archived">Archived (अभिलेखागार)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Filing Date</label>
                  <input
                    type="date"
                    value={editFilingDate}
                    onChange={e => setEditFilingDate(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Next Hearing Date</label>
                  <input
                    type="date"
                    value={editNextDate}
                    onChange={e => setEditNextDate(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Current Stage</label>
                  <input
                    type="text"
                    value={editStage}
                    onChange={e => setEditStage(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Confidential Strategy Notes</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditCaseModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Case Confirmation Modal */}
      {deleteCaseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">Delete Case File?</h3>
              <p className="text-slate-500">
                Are you sure you want to permanently remove <strong>"{caseRecord.case_title}"</strong> from your docket? This will delete all attached hearings and metadata.
              </p>
            </div>
            <div className="pt-3 flex justify-end space-x-2 border-t">
              <button
                type="button"
                onClick={() => setDeleteCaseModal(false)}
                className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCase}
                disabled={deleting}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Case'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {newDocModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-900 font-serif">Attach Document to Case Vault</h3>
            {docError && <p className="text-red-600 bg-red-50 p-2 rounded">{docError}</p>}
            <form onSubmit={handleUploadDocument} className="space-y-3">
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
                  <option value="vakalatnama">Vakalatnama</option>
                  <option value="other">Other Document</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Select File (PDF, DOCX, PNG, JPG &lt; 25MB)</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full p-1.5 border rounded text-xs"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button type="button" onClick={() => setNewDocModal(false)} className="px-3 py-1.5 border rounded">
                  Cancel
                </button>
                <button type="submit" disabled={uploadingDoc} className="px-4 py-1.5 bg-slate-900 text-amber-300 rounded font-semibold">
                  {uploadingDoc ? 'Uploading...' : 'Upload to Vault'}
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Court Room</label>
                  <input
                    type="text"
                    value={courtRoom}
                    onChange={e => setCourtRoom(e.target.value)}
                    placeholder="Court No. 1"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Presiding Judge</label>
                  <input
                    type="text"
                    value={judgeName}
                    onChange={e => setJudgeName(e.target.value)}
                    placeholder="Judge Name"
                    className="w-full p-2 border rounded"
                  />
                </div>
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Next Action Required</label>
                  <input
                    type="text"
                    value={hearingAction}
                    onChange={e => setHearingAction(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="e.g. Prepare rejoinder"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Next Hearing Date</label>
                  <input
                    type="date"
                    value={nextHearingDate}
                    onChange={e => setNextHearingDate(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
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

      {/* Edit Hearing Modal */}
      {editHearingModal && editingHearing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-900 font-serif">Edit Hearing Order</h3>
            <form onSubmit={handleUpdateHearing} className="space-y-3">
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Court Room</label>
                  <input
                    type="text"
                    value={courtRoom}
                    onChange={e => setCourtRoom(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Presiding Judge</label>
                  <input
                    type="text"
                    value={judgeName}
                    onChange={e => setJudgeName(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Business Recorded / Judicial Notes</label>
                <textarea
                  rows={3}
                  value={hearingNotes}
                  onChange={e => setHearingNotes(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Next Action</label>
                  <input
                    type="text"
                    value={hearingAction}
                    onChange={e => setHearingAction(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Next Date</label>
                  <input
                    type="date"
                    value={nextHearingDate}
                    onChange={e => setNextHearingDate(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="attendedHearing"
                  checked={attended}
                  onChange={e => setAttended(e.target.checked)}
                />
                <label htmlFor="attendedHearing" className="font-semibold text-slate-700">Attended by Advocate</label>
              </div>
              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button type="button" onClick={() => setEditHearingModal(false)} className="px-3 py-1.5 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white rounded font-semibold">
                  Update Hearing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
