'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Scale, Plus, CheckCircle2, AlertTriangle, ShieldCheck, 
  Search, Filter, Trash2, Edit2, Download, FileText, Upload, RefreshCw, 
  ExternalLink, Layers, Check, X, Eye, Loader2, Sparkles, BookOpen
} from 'lucide-react';
import type { LegalDocument, CourtLevel, VerificationStatus } from '@/types/legal-research';

interface DocumentWithMeta extends LegalDocument {
  chunks_count?: number;
}

interface Metrics {
  totalDocuments: number;
  verifiedCount: number;
  pendingCount: number;
  rejectedCount: number;
  totalChunks: number;
  vectorStorageStatus: string;
}

export default function AdminLegalLibraryPage() {
  const [documents, setDocuments] = useState<DocumentWithMeta[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalDocuments: 0,
    verifiedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    totalChunks: 0,
    vectorStorageStatus: 'active'
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [courtFilter, setCourtFilter] = useState<string>('ALL');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [syncingCourts, setSyncingCourts] = useState(false);
  const [verifyingAll, setVerifyingAll] = useState(false);
  const [selectedCourtSync, setSelectedCourtSync] = useState<'all' | 'high_court' | 'supreme_court'>('all');
  const [autoVerifySync, setAutoVerifySync] = useState(false);
  const [lastSyncTelemetry, setLastSyncTelemetry] = useState<{
    time?: string;
    newlyIngested?: number;
    skipped?: number;
    captchaMethod?: string;
  } | null>(null);

  // Edit Modal State
  const [editModalDoc, setEditModalDoc] = useState<DocumentWithMeta | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCitation, setEditCitation] = useState('');
  const [editCourtName, setEditCourtName] = useState('');
  const [editCourtLevel, setEditCourtLevel] = useState<CourtLevel>('Supreme Court');
  const [editBench, setEditBench] = useState<string>('NONE');
  const [editDecisionType, setEditDecisionType] = useState<string>('Judgment');
  const [editJudgmentDate, setEditJudgmentDate] = useState('');
  const [editJudgeNames, setEditJudgeNames] = useState('');
  const [editLegalSubject, setEditLegalSubject] = useState('');
  const [editStatutes, setEditStatutes] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editStatus, setEditStatus] = useState<VerificationStatus>('verified');
  const [editPublicationStatus, setEditPublicationStatus] = useState<'draft' | 'published' | 'archived'>('published');
  const [savingEdit, setSavingEdit] = useState(false);

  // Ingest Modal State
  const [ingestModalOpen, setIngestModalOpen] = useState(false);
  const [ingestFile, setIngestFile] = useState<File | null>(null);
  const [ingestRawText, setIngestRawText] = useState('');
  const [ingestTitle, setIngestTitle] = useState('');
  const [ingestCitation, setIngestCitation] = useState('');
  const [ingestCourtLevel, setIngestCourtLevel] = useState<CourtLevel>('High Court');
  const [ingestCourtName, setIngestCourtName] = useState('High Court of Judicature for Rajasthan (Jaipur Bench)');
  const [ingesting, setIngesting] = useState(false);
  const [ingestSuccessMsg, setIngestSuccessMsg] = useState('');
  const [ingestError, setIngestError] = useState('');

  // Full Transcript View State
  const [viewTranscriptDoc, setViewTranscriptDoc] = useState<DocumentWithMeta | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (courtFilter !== 'ALL') params.set('court_level', courtFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/public/legal-library?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load legal documents library');
      const data = await res.json();
      if (data.documents) setDocuments(data.documents);
      if (data.metrics) setMetrics(data.metrics);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, courtFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Automated Court Synchronization (hcraj.nic.in & Supreme Court e-SCR)
  const handleSyncCourtFeeds = async () => {
    setSyncingCourts(true);
    setMessage('');
    try {
      const res = await fetch(`/api/cron/court-ingestion?court=${selectedCourtSync}&auto_verify=${autoVerifySync}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync court feeds');
      setMessage(data.message || 'Court synchronization completed successfully.');
      setLastSyncTelemetry({
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        newlyIngested: data.newlyIngestedCount,
        skipped: data.skippedCount,
        captchaMethod: data.captchaStatus?.method || 'ai_vision_ocr'
      });
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error syncing court feeds');
    } finally {
      setSyncingCourts(false);
    }
  };

  // 1-Click Bulk Verification Gate
  const handleVerifyAllPending = async () => {
    if (!confirm(`Are you sure you want to approve and publish all ${metrics.pendingCount} pending court judgments?`)) {
      return;
    }
    setVerifyingAll(true);
    try {
      const res = await fetch('/api/admin/public/legal-library', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_all' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify pending documents');
      setMessage(data.message || `${metrics.pendingCount} judgments verified & published!`);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error verifying documents');
    } finally {
      setVerifyingAll(false);
    }
  };

  // 1-Click Verification / Status change
  const handleQuickStatusChange = async (docId: string, newStatus: VerificationStatus) => {
    try {
      const res = await fetch('/api/admin/public/legal-library', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId, verification_status: newStatus })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to update verification status');
      }
      setMessage(`Status updated to ${newStatus}`);
      setTimeout(() => setMessage(''), 2500);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error changing status');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (doc: DocumentWithMeta) => {
    setEditModalDoc(doc);
    setEditTitle(doc.title);
    setEditCitation(doc.citation);
    setEditCourtName(doc.court_name);
    setEditCourtLevel(doc.court_level || 'High Court');
    setEditBench(doc.bench || 'NONE');
    setEditDecisionType(doc.decision_type || 'Judgment');
    setEditJudgmentDate(doc.judgment_date || '');
    setEditJudgeNames(Array.isArray(doc.judge_names) ? doc.judge_names.join(', ') : (doc.judge_names || ''));
    setEditLegalSubject(doc.legal_subject || (Array.isArray(doc.legal_subjects) ? doc.legal_subjects.join(', ') : ''));
    setEditStatutes(Array.isArray(doc.statutes) ? doc.statutes.join(', ') : (doc.statutes || ''));
    setEditSummary(doc.summary || '');
    setEditStatus(doc.verification_status);
    setEditPublicationStatus(doc.publication_status || (doc.verification_status === 'verified' ? 'published' : 'draft'));
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalDoc) return;
    setSavingEdit(true);
    try {
      const res = await fetch('/api/admin/public/legal-library', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editModalDoc.id,
          title: editTitle.trim(),
          citation: editCitation.trim(),
          court_name: editCourtName.trim(),
          court_level: editCourtLevel,
          bench: editBench === 'NONE' ? null : editBench,
          decision_type: editDecisionType,
          judgment_date: editJudgmentDate.trim() || undefined,
          judge_names: editJudgeNames.trim() || undefined,
          legal_subject: editLegalSubject.trim() || undefined,
          statutes: editStatutes.trim() || undefined,
          summary: editSummary.trim() || undefined,
          verification_status: editStatus,
          publication_status: editPublicationStatus
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to update metadata');
      }

      setEditModalDoc(null);
      setMessage('Precedent metadata successfully updated');
      setTimeout(() => setMessage(''), 3000);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating precedent');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Document
  const handleDelete = async (docId: string, citation: string) => {
    if (!confirm(`Are you sure you want to permanently delete judgment ${citation} and all related pgvector chunks?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/public/legal-library?id=${docId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to delete document');
      }
      setMessage(`Judgment ${citation} deleted`);
      setTimeout(() => setMessage(''), 2500);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting document');
    }
  };

  // Ingest Document
  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngesting(true);
    setIngestError('');
    setIngestSuccessMsg('');

    try {
      let res: Response;
      if (ingestFile) {
        const fd = new FormData();
        fd.append('file', ingestFile);
        if (ingestTitle) fd.append('title', ingestTitle);
        if (ingestCitation) fd.append('citation', ingestCitation);
        fd.append('court_level', ingestCourtLevel);
        fd.append('court_name', ingestCourtName);

        res = await fetch('/api/admin/public/legal-library/upload', {
          method: 'POST',
          body: fd
        });
      } else {
        if (!ingestRawText.trim() || ingestRawText.trim().length < 20) {
          throw new Error('Please provide at least 20 characters of legal judgment text');
        }

        res = await fetch('/api/admin/public/legal-library/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            raw_text: ingestRawText.trim(),
            title: ingestTitle || undefined,
            citation: ingestCitation || undefined,
            court_level: ingestCourtLevel,
            court_name: ingestCourtName
          })
        });
      }

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Document ingestion failed');

      setIngestSuccessMsg(
        `Precedent successfully indexed into pgvector! Created ${d.chunksIndexed} chunks (${d.totalTokens} tokens) in ${d.processingTimeMs}ms.`
      );
      setIngestFile(null);
      setIngestRawText('');
      setIngestTitle('');
      setIngestCitation('');
      loadData();
      setTimeout(() => {
        setIngestModalOpen(false);
        setIngestSuccessMsg('');
      }, 2000);
    } catch (err: unknown) {
      setIngestError(err instanceof Error ? err.message : 'Ingestion error');
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/public-admin/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portal Admin</span>
        </Link>

        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
          pgvector HNSW: <strong>1536 Dimensions Active</strong>
        </span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <Scale className="w-4 h-4" />
            <span>AI Legal Precedent Repository & pgvector Management</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
            Precedent Library & Ingestion Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer verified case law citations, approve OCR/PDF extractions, and inspect semantic embeddings.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleSyncCourtFeeds}
            disabled={syncingCourts}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-300 text-xs font-semibold rounded-xl shadow transition flex items-center space-x-1.5"
            title="Auto-fetch newly released decisions from Rajasthan High Court & Supreme Court e-SCR"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingCourts ? 'animate-spin' : ''}`} />
            <span>{syncingCourts ? 'Syncing Feeds...' : 'Sync Court Feeds Now'}</span>
          </button>

          <button
            onClick={() => setIngestModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-700 to-indigo-800 hover:from-indigo-800 hover:to-indigo-900 text-white text-xs font-semibold rounded-xl shadow transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Ingest New Judgment</span>
          </button>
        </div>
      </div>

      {/* Automated Judicial Ingestion & Live Scraper Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                100% Automated Live Crawler Active
              </span>
              <span className="text-[11px] text-slate-400">
                Scheduled Daily at <strong>02:00 AM IST</strong>
              </span>
            </div>
            <h2 className="text-base font-semibold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Rajasthan High Court & Supreme Court Automated Ingestion</span>
            </h2>
            <p className="text-xs text-slate-300">
              Live crawler with automated AI Captcha decoding fetches certified daily judgments from{' '}
              <span className="text-amber-200 font-mono">hcraj.nic.in</span> &{' '}
              <span className="text-amber-200 font-mono">escr.sci.gov.in</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <label className="text-[11px] text-slate-300 font-medium">Court Feed:</label>
              <select
                value={selectedCourtSync}
                onChange={e => setSelectedCourtSync(e.target.value as any)}
                className="bg-slate-900 text-xs text-amber-300 rounded-lg px-2 py-1 border border-slate-600 focus:outline-none"
              >
                <option value="all">All (High Court + Supreme Court)</option>
                <option value="high_court">Rajasthan High Court (Jaipur/Jodhpur)</option>
                <option value="supreme_court">Supreme Court (e-SCR)</option>
              </select>
            </div>

            <label className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={autoVerifySync}
                onChange={e => setAutoVerifySync(e.target.checked)}
                className="rounded border-slate-600 text-indigo-600 focus:ring-0"
              />
              <span className="text-[11px] text-slate-200">Auto-Verify (Direct Live)</span>
            </label>

            <button
              onClick={handleSyncCourtFeeds}
              disabled={syncingCourts}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl shadow transition flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingCourts ? 'animate-spin' : ''}`} />
              <span>{syncingCourts ? 'Crawling Courts...' : 'Sync Live Feeds Now'}</span>
            </button>
          </div>
        </div>

        {/* Telemetry Footer */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center space-x-4">
            <span>
              AI Captcha Engine: <strong className="text-emerald-400">Active (OCR / Optical Pattern)</strong>
            </span>
            <span>•</span>
            <span>
              Jaipur Bench Jurisdiction: <strong className="text-slate-200">Alwar & NCR Environs</strong>
            </span>
          </div>
          {lastSyncTelemetry && (
            <div className="text-amber-300 font-mono text-[11px]">
              Last sync: {lastSyncTelemetry.time} | Ingested: {lastSyncTelemetry.newlyIngested} | Skipped: {lastSyncTelemetry.skipped}
            </div>
          )}
        </div>
      </div>

      {/* Admin Review Gate Banner (सुरक्षित गेट) */}
      {metrics.pendingCount > 0 && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-amber-900">
                Admin Review Gate (सुरक्षित सत्यापन गेट):
              </span>{' '}
              <span className="text-xs font-medium">
                आज राजस्थान हाई कोर्ट / सुप्रीम कोर्ट से <strong>{metrics.pendingCount} नए फैसले</strong> ऑटोमैटिक डाउनलोड होकर समीक्षा हेतु लंबित (Pending) हैं।
              </span>
            </div>
          </div>
          <button
            onClick={handleVerifyAllPending}
            disabled={verifyingAll}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 whitespace-nowrap transition"
          >
            {verifyingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Verify All Pending ({metrics.pendingCount})</span>
          </button>
        </div>
      )}

      {/* Success / Alert message */}
      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Precedents</span>
          <div className="text-2xl font-bold font-serif text-slate-900">{metrics.totalDocuments}</div>
          <span className="text-[11px] text-slate-500">Indexed in database</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-emerald-600">Verified & Published</span>
          <div className="text-2xl font-bold font-serif text-emerald-700">{metrics.verifiedCount}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Available for RAG</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-amber-600">Pending Review</span>
          <div className="text-2xl font-bold font-serif text-amber-700">{metrics.pendingCount}</div>
          <span className="text-[11px] text-amber-600 font-medium">Require approval</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-indigo-600">Vector Chunks</span>
          <div className="text-2xl font-bold font-serif text-indigo-800">{metrics.totalChunks}</div>
          <span className="text-[11px] text-indigo-600 font-medium">HNSW Index</span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by citation, case title, court, or statutory sections..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Verification Statuses</option>
              <option value="verified">Verified (सत्यापित)</option>
              <option value="pending">Pending (लंबित)</option>
              <option value="rejected">Rejected (अस्वीकृत)</option>
              <option value="archived">Archived (अभिलेखागार)</option>
            </select>

            <select
              value={courtFilter}
              onChange={e => setCourtFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Courts</option>
              <option value="Supreme Court">Supreme Court</option>
              <option value="High Court">High Courts</option>
              <option value="District Court">District Courts</option>
              <option value="Tribunal">Tribunals</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
            >
              Filter
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setCourtFilter('ALL');
                loadData();
              }}
              className="px-3 py-2 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50 transition"
              title="Reset Filters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 text-center rounded-2xl border text-xs text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
            Loading legal precedent repository...
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-serif font-bold text-base text-slate-900">No Precedents Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No legal documents match your current filter criteria. You can ingest a new judgment or clear filters.
            </p>
          </div>
        ) : (
          documents.map(doc => (
            <div
              key={doc.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition space-y-3 text-xs"
            >
              {/* Top Row: Citation, Status, Court */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b pb-3 border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded border border-indigo-200">
                      {doc.citation}
                    </span>

                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        doc.verification_status === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.verification_status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : doc.verification_status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      ● {doc.verification_status}
                    </span>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {doc.court_level}
                    </span>

                    {doc.judgment_date && (
                      <span className="text-[10px] font-mono text-slate-400">
                        Date: {doc.judgment_date}
                      </span>
                    )}

                    <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      Chunks: {doc.chunks_count ?? 1}
                    </span>

                    {doc.source_type === 'automatic' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                        ⚡ Auto-Feed: {doc.court_name?.includes('Rajasthan') ? 'HCRAJ' : 'e-SCR'}
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-bold text-base text-slate-900">
                    {doc.title}
                  </h3>
                  <div className="text-slate-500 mt-0.5">
                    <strong>{doc.court_name}</strong>
                    {doc.judge_names && <span> • Bench: {doc.judge_names}</span>}
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {doc.verification_status !== 'verified' && (
                    <button
                      onClick={() => handleQuickStatusChange(doc.id, 'verified')}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1 shadow-sm"
                      title="Approve and publish to RAG research index"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEdit(doc)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                    title="Edit Metadata"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit</span>
                  </button>

                  <a
                    href={`/api/public/judgments/download?id=${encodeURIComponent(doc.id)}&format=pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold transition flex items-center space-x-1 border border-blue-200 shadow-sm"
                    title="Download Certified Full Judgment PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>PDF</span>
                  </a>

                  <button
                    onClick={() => setViewTranscriptDoc(doc)}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                    title="View Full Text"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>View</span>
                  </button>

                  <button
                    onClick={() => handleDelete(doc.id, doc.citation)}
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                    title="Delete document and chunks"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  </button>
                </div>
              </div>

              {/* Holding summary */}
              {doc.summary && (
                <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  <strong className="text-slate-900 block mb-0.5 text-[10px] uppercase font-mono text-slate-400">
                    Holding Summary:
                  </strong>
                  {doc.summary}
                </p>
              )}

              {/* Meta details */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
                <div>
                  {doc.statutes && (
                    <span>
                      <strong className="text-slate-700">Statutes:</strong> {doc.statutes}
                    </span>
                  )}
                  {doc.legal_subject && (
                    <span className="ml-3">
                      <strong className="text-slate-700">Subject:</strong> {doc.legal_subject}
                    </span>
                  )}
                </div>
                <div className="text-slate-400 font-mono text-[10px]">
                  ID: {doc.id}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: EDIT METADATA                                    */}
      {/* ========================================================= */}
      {editModalDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-900 border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-indigo-700" />
                <span>Edit Precedent Metadata & Verification</span>
              </h3>
              <button
                onClick={() => setEditModalDoc(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
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
                  <label className="block font-semibold mb-1">Citation (AIR / SCC / RLR)</label>
                  <input
                    required
                    type="text"
                    value={editCitation}
                    onChange={e => setEditCitation(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Court Level</label>
                  <select
                    value={editCourtLevel}
                    onChange={e => setEditCourtLevel(e.target.value as CourtLevel)}
                    className="w-full p-2.5 border rounded-lg bg-slate-50 font-semibold"
                  >
                    <option value="Supreme Court">Supreme Court</option>
                    <option value="High Court">High Court</option>
                    <option value="District Court">District Court</option>
                    <option value="Tribunal">Tribunal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Court Name</label>
                  <input
                    required
                    type="text"
                    value={editCourtName}
                    onChange={e => setEditCourtName(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Decision Date (YYYY-MM-DD)</label>
                  <input
                    type="text"
                    value={editJudgmentDate}
                    onChange={e => setEditJudgmentDate(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono"
                    placeholder="2024-05-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Coram / Bench</label>
                  <input
                    type="text"
                    value={editJudgeNames}
                    onChange={e => setEditJudgeNames(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                    placeholder="Hon'ble Justices..."
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Bench (Rajasthan High Court)</label>
                  <select
                    value={editBench}
                    onChange={e => setEditBench(e.target.value)}
                    className="w-full p-2.5 border rounded-lg bg-slate-50 font-semibold"
                  >
                    <option value="NONE">None / Principal Seat</option>
                    <option value="Jaipur">Jaipur Bench</option>
                    <option value="Jodhpur">Jodhpur Bench</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Decision Type</label>
                  <input
                    type="text"
                    value={editDecisionType}
                    onChange={e => setEditDecisionType(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                    placeholder="Judgment, Order..."
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Verification Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as VerificationStatus)}
                    className="w-full p-2.5 border rounded-lg bg-slate-50 font-bold"
                  >
                    <option value="verified">Verified (Approved)</option>
                    <option value="pending">Pending Review</option>
                    <option value="rejected">Rejected</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Publication Status</label>
                  <select
                    value={editPublicationStatus}
                    onChange={e => setEditPublicationStatus(e.target.value as any)}
                    className="w-full p-2.5 border rounded-lg bg-slate-50 font-bold"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Statutes & Key Sections</label>
                <input
                  type="text"
                  value={editStatutes}
                  onChange={e => setEditStatutes(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="Section 480 BNSS, Section 139 NI Act..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Subject / Domain</label>
                <input
                  type="text"
                  value={editLegalSubject}
                  onChange={e => setEditLegalSubject(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="Criminal Law — Regular Bail..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Holding Summary / Ratio Decidendi</label>
                <textarea
                  rows={3}
                  value={editSummary}
                  onChange={e => setEditSummary(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditModalDoc(null)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-semibold flex items-center space-x-1.5"
                >
                  {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: INGEST NEW JUDGMENT                              */}
      {/* ========================================================= */}
      {ingestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-900 border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center space-x-2">
                <Upload className="w-4 h-4 text-indigo-700" />
                <span>Ingest & Index Judgment into pgvector</span>
              </h3>
              <button
                onClick={() => setIngestModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {ingestSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{ingestSuccessMsg}</span>
              </div>
            )}

            {ingestError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{ingestError}</span>
              </div>
            )}

            <form onSubmit={handleIngest} className="space-y-4">
              {/* File upload box */}
              <div>
                <label className="block font-semibold mb-1">
                  Upload PDF / DOCX File (or paste text below)
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={e => setIngestFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              {!ingestFile && (
                <div>
                  <label className="block font-semibold mb-1">Or Paste Judgment Text</label>
                  <textarea
                    rows={6}
                    value={ingestRawText}
                    onChange={e => setIngestRawText(e.target.value)}
                    placeholder="IN THE SUPREME COURT OF INDIA / HIGH COURT... Copy and paste judgment text here..."
                    className="w-full p-2.5 border rounded-lg font-mono text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Override Case Title (Optional)</label>
                  <input
                    type="text"
                    value={ingestTitle}
                    onChange={e => setIngestTitle(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                    placeholder="Auto-extracted if omitted"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Override Citation (Optional)</label>
                  <input
                    type="text"
                    value={ingestCitation}
                    onChange={e => setIngestCitation(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono"
                    placeholder="e.g. 2026 (1) RLR 555"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Court Level</label>
                  <select
                    value={ingestCourtLevel}
                    onChange={e => setIngestCourtLevel(e.target.value as CourtLevel)}
                    className="w-full p-2.5 border rounded-lg bg-slate-50 font-semibold"
                  >
                    <option value="Supreme Court">Supreme Court</option>
                    <option value="High Court">High Court</option>
                    <option value="District Court">District Court</option>
                    <option value="Tribunal">Tribunal</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Court Name</label>
                  <input
                    type="text"
                    value={ingestCourtName}
                    onChange={e => setIngestCourtName(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIngestModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ingesting}
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow"
                >
                  {ingesting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting & Indexing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Start Indexing Pipeline</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: VIEW FULL TRANSCRIPT                             */}
      {/* ========================================================= */}
      {viewTranscriptDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 text-slate-900 border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-mono font-bold text-indigo-700">{viewTranscriptDoc.citation}</span>
                <h3 className="font-serif font-bold text-base text-slate-900">{viewTranscriptDoc.title}</h3>
              </div>
              <button
                onClick={() => setViewTranscriptDoc(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
              {viewTranscriptDoc.full_text}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <a
                href={`/api/public/judgments/download?id=${encodeURIComponent(viewTranscriptDoc.id)}&format=pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow-sm transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Certified PDF</span>
              </a>

              <button
                onClick={() => setViewTranscriptDoc(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
