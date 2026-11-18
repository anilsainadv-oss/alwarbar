'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Scale, Plus, CheckCircle2, AlertTriangle, ShieldCheck, 
  Search, Filter, Trash2, Edit2, Download, FileText, Upload, RefreshCw, 
  ExternalLink, Layers, Check, X, Eye, Loader2, Sparkles, BookOpen,
  Cloud, Database, Clock, History, CheckSquare, XCircle, AlertCircle,
  Lock, Unlock, FileCheck, ArrowRight, Zap
} from 'lucide-react';
import type { 
  LegalDocument, 
  CourtLevel, 
  VerificationStatus, 
  ApprovalStatus, 
  PublicationStatus, 
  JudgmentAuditLog 
} from '@/types/legal-research';

interface DocumentWithMeta extends LegalDocument {
  chunks_count?: number;
}

interface Metrics {
  totalDocuments: number;
  verifiedCount: number;
  pendingCount: number;
  approvedCount: number;
  publishedCount: number;
  rejectedCount: number;
  draftCount: number;
  r2StorageCount: number;
  totalChunks: number;
  vectorStorageStatus: string;
}

interface R2StatusInfo {
  configured: boolean;
  bucketName: string | null;
  accountId: string | null;
  missingVariables: string[];
  connectionStatus: 'connected' | 'pending_configuration' | 'error';
  errorMessage?: string;
  totalFiles?: number;
  totalStorageBytes?: number;
}

type AdminSection = 
  | 'PENDING'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'ALL_DOCS'
  | 'COLLECTION'
  | 'R2_STORAGE'
  | 'REJECTED_DRAFTS'
  | 'AUDIT_LOGS';

export default function AdminLegalLibraryPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>('PENDING');
  const [documents, setDocuments] = useState<DocumentWithMeta[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalDocuments: 0,
    verifiedCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    publishedCount: 0,
    rejectedCount: 0,
    draftCount: 0,
    r2StorageCount: 0,
    totalChunks: 0,
    vectorStorageStatus: 'active'
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [courtFilter, setCourtFilter] = useState<string>('ALL');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Rejection Modal State
  const [rejectModalDoc, setRejectModalDoc] = useState<DocumentWithMeta | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

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
  const [editPetitioner, setEditPetitioner] = useState('');
  const [editRespondent, setEditRespondent] = useState('');
  const [editAdvocateNames, setEditAdvocateNames] = useState('');
  const [editLegalSubject, setEditLegalSubject] = useState('');
  const [editStatutes, setEditStatutes] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editApprovalStatus, setEditApprovalStatus] = useState<ApprovalStatus>('pending');
  const [editPublicationStatus, setEditPublicationStatus] = useState<PublicationStatus>('draft');
  const [savingEdit, setSavingEdit] = useState(false);

  // Ingest / Collection Modal State
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

  // R2 Management State
  const [r2Status, setR2Status] = useState<R2StatusInfo | null>(null);
  const [r2SetupSteps, setR2SetupSteps] = useState<string[]>([]);
  const [testingR2, setTestingR2] = useState(false);
  const [r2TestOutput, setR2TestOutput] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  // Official Court Search State
  const [collectionCourt, setCollectionCourt] = useState<'rajasthan_high_court' | 'supreme_court'>('rajasthan_high_court');
  const [collBench, setCollBench] = useState<'Jaipur' | 'Jodhpur' | 'All'>('Jaipur');
  const [collDateFrom, setCollDateFrom] = useState('');
  const [collDateTo, setCollDateTo] = useState('');
  const [collCaseType, setCollCaseType] = useState('');
  const [collPartyName, setCollPartyName] = useState('');
  const [collAdvocateName, setCollAdvocateName] = useState('');
  const [collJudgeName, setCollJudgeName] = useState('');
  const [collCitation, setCollCitation] = useState('');
  const [collSearching, setCollSearching] = useState(false);
  const [collResults, setCollResults] = useState<any[]>([]);
  const [collUrlInput, setCollUrlInput] = useState('');
  const [collUrlTitle, setCollUrlTitle] = useState('');
  const [collUrlCitation, setCollUrlCitation] = useState('');
  const [importingUrl, setImportingUrl] = useState(false);
  const [isSyncingDaily, setIsSyncingDaily] = useState(false);
  const [autoPublishDaily, setAutoPublishDaily] = useState(true);
  const [dailySyncMessage, setDailySyncMessage] = useState<string | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<JudgmentAuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // ---------------------------------------------------------------------------
  // Load Documents & Metrics
  // ---------------------------------------------------------------------------
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (courtFilter !== 'ALL') params.set('court_level', courtFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      if (activeSection === 'PENDING') {
        params.set('approval_status', 'pending');
      } else if (activeSection === 'APPROVED') {
        params.set('approval_status', 'approved');
        params.set('publication_status', 'draft');
      } else if (activeSection === 'PUBLISHED') {
        params.set('publication_status', 'published');
      } else if (activeSection === 'REJECTED_DRAFTS') {
        params.set('approval_status', 'rejected');
      }

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

  // ---------------------------------------------------------------------------
  // Load R2 Status
  // ---------------------------------------------------------------------------
  const loadR2Status = async () => {
    try {
      const res = await fetch('/api/admin/public/r2-storage');
      if (res.ok) {
        const data = await res.json();
        if (data.status) setR2Status(data.status);
        if (data.setupInstructions?.steps) setR2SetupSteps(data.setupInstructions.steps);
      }
    } catch (err) {
      console.error('Failed to load R2 status:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // Load Audit Logs
  // ---------------------------------------------------------------------------
  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/public/legal-library/approval');
      if (res.ok) {
        const data = await res.json();
        if (data.logs) setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadData();
    loadR2Status();
    if (activeSection === 'AUDIT_LOGS') {
      loadAuditLogs();
    }
  }, [activeSection, courtFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // ---------------------------------------------------------------------------
  // Approval Actions
  // ---------------------------------------------------------------------------
  const handleApprovalAction = async (
    docId: string,
    action: 'approve_and_publish' | 'approve_only' | 'reject' | 'save_draft' | 'reprocess',
    reason?: string
  ) => {
    setSubmittingAction(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/public/legal-library/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: docId,
          action,
          rejection_reason: reason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval action failed');
      
      const label = action === 'approve_and_publish' 
        ? 'Judgment approved and published to public & AI research.'
        : action === 'approve_only'
          ? 'Judgment approved (saved in draft status).'
          : action === 'reject'
            ? 'Judgment rejected with reason recorded.'
            : action === 'save_draft'
              ? 'Saved as draft.'
              : 'Reprocessing triggered.';
      setMessage(label);
      setRejectModalDoc(null);
      setRejectionReason('');
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Cloudflare R2 Connection Test Probe
  // ---------------------------------------------------------------------------
  const handleTestR2 = async () => {
    setTestingR2(true);
    setR2TestOutput(null);
    try {
      const res = await fetch('/api/admin/public/r2-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_connection' })
      });
      const data = await res.json();
      setR2TestOutput(data);
      loadR2Status();
    } catch (err: unknown) {
      setR2TestOutput({
        success: false,
        message: err instanceof Error ? err.message : 'R2 test probe failed'
      });
    } finally {
      setTestingR2(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Official Court Search
  // ---------------------------------------------------------------------------
  const handleSearchCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    setCollSearching(true);
    setCollResults([]);
    try {
      const res = await fetch('/api/admin/public/legal-library/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search_court',
          params: {
            court: collectionCourt,
            bench: collBench,
            dateFrom: collDateFrom || undefined,
            dateTo: collDateTo || undefined,
            caseType: collCaseType || undefined,
            partyName: collPartyName || undefined,
            advocateName: collAdvocateName || undefined,
            judgeName: collJudgeName || undefined,
            citationNumber: collCitation || undefined,
            neutralCitation: collCitation || undefined
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to search court repository');
      if (data.candidates) setCollResults(data.candidates);
      if (data.captchaStatus?.challenged) {
        setMessage(data.captchaStatus.message || 'Direct court search presented Captcha barrier. You can import using the official URL or PDF upload.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Court search error');
    } finally {
      setCollSearching(false);
    }
  };

  // ---------------------------------------------------------------------------
  // URL Import
  // ---------------------------------------------------------------------------
  const handleImportByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collUrlInput || !collUrlTitle || !collUrlCitation) {
      alert('Please provide the PDF URL, Case Title, and Citation');
      return;
    }
    setImportingUrl(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/public/legal-library/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import_by_url',
          court: collectionCourt,
          pdfUrl: collUrlInput,
          title: collUrlTitle,
          citation: collUrlCitation,
          bench: collBench
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import judgment from URL');
      setMessage(data.message || 'Judgment imported and placed in Pending Approval.');
      setCollUrlInput('');
      setCollUrlTitle('');
      setCollUrlCitation('');
      loadData();
      setActiveSection('PENDING');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'URL import failed');
    } finally {
      setImportingUrl(false);
    }
  };

  // ---------------------------------------------------------------------------
  // ⚡ Run Automated Daily Court Ingestion
  // ---------------------------------------------------------------------------
  const handleRunDailySync = async () => {
    setIsSyncingDaily(true);
    setDailySyncMessage(null);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/public/legal-library/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto_sync_daily',
          autoPublish: autoPublishDaily,
          court: 'all'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Daily Court Auto-Sync failed');
      setDailySyncMessage(
        data.message ||
        `Successfully synced ${data.newlyIngestedCount} judgments to Cloudflare R2!`
      );
      setMessage(`Daily Sync Completed: ${data.newlyIngestedCount} new judgments processed.`);
      loadData();
      if (autoPublishDaily) {
        setActiveSection('PUBLISHED');
      } else {
        setActiveSection('PENDING');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Daily court sync failed');
    } finally {
      setIsSyncingDaily(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Ingest from File Upload
  // ---------------------------------------------------------------------------
  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngesting(true);
    setIngestSuccessMsg('');
    setIngestError('');

    try {
      const formData = new FormData();
      if (ingestFile) formData.append('file', ingestFile);
      if (ingestRawText) formData.append('raw_text', ingestRawText);
      if (ingestTitle) formData.append('title', ingestTitle);
      if (ingestCitation) formData.append('citation', ingestCitation);
      formData.append('court_level', ingestCourtLevel);
      formData.append('court_name', ingestCourtName);

      const res = await fetch('/api/admin/public/legal-library/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ingestion failed');

      setIngestSuccessMsg('Judgment uploaded, SHA-256 verified, indexed, and queued in Pending Approval.');
      setTimeout(() => {
        setIngestModalOpen(false);
        setIngestFile(null);
        setIngestRawText('');
        setIngestTitle('');
        setIngestCitation('');
        loadData();
      }, 1500);
    } catch (err: unknown) {
      setIngestError(err instanceof Error ? err.message : 'Failed to ingest document');
    } finally {
      setIngesting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Edit Document Metadata
  // ---------------------------------------------------------------------------
  const handleOpenEdit = (doc: DocumentWithMeta) => {
    setEditModalDoc(doc);
    setEditTitle(doc.title);
    setEditCitation(doc.citation);
    setEditCourtName(doc.court_name);
    setEditCourtLevel(doc.court_level || 'Supreme Court');
    setEditBench(doc.bench || 'NONE');
    setEditDecisionType(doc.decision_type || 'Judgment');
    setEditJudgmentDate(doc.judgment_date || '');
    setEditJudgeNames(Array.isArray(doc.judge_names) ? doc.judge_names.join(', ') : (doc.judge_names || ''));
    setEditPetitioner(doc.petitioner || (Array.isArray(doc.parties) ? doc.parties[0] : (doc.parties || '')));
    setEditRespondent(doc.respondent || (Array.isArray(doc.parties) ? doc.parties[1] : ''));
    setEditAdvocateNames(Array.isArray(doc.advocate_names) ? doc.advocate_names.join(', ') : (doc.advocate_names || ''));
    setEditLegalSubject(doc.legal_subject || (Array.isArray(doc.legal_subjects) ? doc.legal_subjects.join(', ') : ''));
    setEditStatutes(Array.isArray(doc.statutes) ? doc.statutes.join(', ') : (doc.statutes || ''));
    setEditSummary(doc.summary || '');
    setEditApprovalStatus(doc.approval_status || 'pending');
    setEditPublicationStatus(doc.publication_status || 'draft');
  };

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
          title: editTitle,
          citation: editCitation,
          court_name: editCourtName,
          court_level: editCourtLevel,
          bench: editBench === 'NONE' ? null : editBench,
          decision_type: editDecisionType,
          judgment_date: editJudgmentDate,
          judge_names: editJudgeNames.split(',').map(s => s.trim()).filter(Boolean),
          parties: [editPetitioner, editRespondent].filter(Boolean),
          legal_subject: editLegalSubject,
          statutes: editStatutes.split(',').map(s => s.trim()).filter(Boolean),
          summary: editSummary,
          approval_status: editApprovalStatus,
          publication_status: editPublicationStatus
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update document metadata');

      setMessage(`Metadata for ${editCitation} successfully updated.`);
      setEditModalDoc(null);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating document');
    } finally {
      setSavingEdit(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete Document
  // ---------------------------------------------------------------------------
  const handleDeleteDoc = async (id: string, citation: string) => {
    if (!confirm(`Permanently delete judgment ${citation} and all vector embeddings from database?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/public/legal-library?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      setMessage(`Precedent ${citation} removed successfully.`);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting document');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link href="/public-admin/dashboard" className="hover:text-indigo-600 flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Overview</span>
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Official Court Judgment Repository</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 flex items-center space-x-2.5">
            <Scale className="w-7 h-7 text-indigo-700" />
            <span>Supreme Court & Rajasthan High Court Precedent Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official Precedent Repository with Cloudflare R2 Private Storage, SHA-256 Checksum, and Mandatory Admin Approval Workflow.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIngestModalOpen(true)}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Official PDF</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')}><X className="w-4 h-4 text-emerald-600" /></button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')}><X className="w-4 h-4 text-red-600" /></button>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setActiveSection('PENDING')}
          className={`p-4 rounded-xl border text-left transition ${
            activeSection === 'PENDING'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/40 shadow-sm'
              : 'bg-white border-slate-200 hover:border-amber-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-amber-700">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-amber-900 mt-1">{metrics.pendingCount}</div>
          <span className="text-[10px] text-amber-700 font-medium">Requires Admin Action</span>
        </button>

        <button
          onClick={() => setActiveSection('PUBLISHED')}
          className={`p-4 rounded-xl border text-left transition ${
            activeSection === 'PUBLISHED'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/40 shadow-sm'
              : 'bg-white border-slate-200 hover:border-emerald-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-emerald-700">Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-emerald-900 mt-1">{metrics.publishedCount}</div>
          <span className="text-[10px] text-emerald-700 font-medium">Live in Public & AI</span>
        </button>

        <button
          onClick={() => setActiveSection('APPROVED')}
          className={`p-4 rounded-xl border text-left transition ${
            activeSection === 'APPROVED'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-400/40 shadow-sm'
              : 'bg-white border-slate-200 hover:border-blue-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-blue-700">Approved Drafts</span>
            <CheckSquare className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-blue-900 mt-1">{metrics.approvedCount - metrics.publishedCount}</div>
          <span className="text-[10px] text-blue-600 font-medium">Verified Unreleased</span>
        </button>

        <button
          onClick={() => setActiveSection('COLLECTION')}
          className={`p-4 rounded-xl border text-left transition ${
            activeSection === 'COLLECTION'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-400/40 shadow-sm'
              : 'bg-white border-slate-200 hover:border-indigo-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-indigo-700">Court Feeds</span>
            <Scale className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-indigo-900 mt-1">2 Sources</div>
          <span className="text-[10px] text-indigo-600 font-medium">HCRAJ & e-SCR</span>
        </button>

        <button
          onClick={() => setActiveSection('R2_STORAGE')}
          className={`p-4 rounded-xl border text-left transition ${
            activeSection === 'R2_STORAGE'
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-400/40 shadow-sm'
              : 'bg-white border-slate-200 hover:border-purple-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-purple-700">Cloudflare R2</span>
            <Cloud className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-base font-bold font-serif text-purple-900 mt-1 truncate">
            {r2Status?.configured ? 'Connected' : 'Pending'}
          </div>
          <span className="text-[10px] text-purple-700 font-medium">
            {r2Status?.configured ? `${r2Status.totalFiles || 0} PDFs in R2` : 'Config Required'}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('AUDIT_LOGS')}
          className={`p-4 rounded-xl border text-left transition ${
            activeSection === 'AUDIT_LOGS'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/40 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-600">Audit History</span>
            <History className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-slate-900 mt-1">{auditLogs.length || metrics.totalDocuments}</div>
          <span className="text-[10px] text-slate-500 font-medium">Immutable Events</span>
        </button>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSection('PENDING')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            activeSection === 'PENDING'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Pending Admin Approval</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-200 text-amber-900 font-bold">
            {metrics.pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('APPROVED')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            activeSection === 'APPROVED'
              ? 'border-blue-600 text-blue-800 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
          <span>Approved Judgments</span>
        </button>

        <button
          onClick={() => setActiveSection('PUBLISHED')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            activeSection === 'PUBLISHED'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Published (Public & AI)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
            {metrics.publishedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('COLLECTION')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            activeSection === 'COLLECTION'
              ? 'border-indigo-600 text-indigo-800 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-indigo-600" />
          <span>Official Court Collection</span>
        </button>

        <button
          onClick={() => setActiveSection('R2_STORAGE')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            activeSection === 'R2_STORAGE'
              ? 'border-purple-600 text-purple-800 bg-purple-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cloud className="w-3.5 h-3.5 text-purple-600" />
          <span>Cloudflare R2 Management</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            r2Status?.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {r2Status?.configured ? 'Live' : 'Pending'}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('REJECTED_DRAFTS')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            activeSection === 'REJECTED_DRAFTS'
              ? 'border-red-600 text-red-800 bg-red-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-red-600" />
          <span>Rejected & Drafts ({metrics.rejectedCount + metrics.draftCount})</span>
        </button>

        <button
          onClick={() => setActiveSection('AUDIT_LOGS')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            activeSection === 'AUDIT_LOGS'
              ? 'border-slate-800 text-slate-900 bg-slate-100'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5 text-slate-600" />
          <span>Audit History</span>
        </button>

        <button
          onClick={() => setActiveSection('ALL_DOCS')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            activeSection === 'ALL_DOCS'
              ? 'border-slate-800 text-slate-900 bg-slate-100'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-slate-600" />
          <span>All Documents ({metrics.totalDocuments})</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* SECTION: CLOUDFLARE R2 MANAGEMENT                                     */}
      {/* ===================================================================== */}
      {activeSection === 'R2_STORAGE' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Cloud className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold font-serif text-slate-900">Cloudflare R2 Object Storage</h2>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                  r2Status?.configured ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {r2Status?.configured ? 'Configured & Connected' : 'R2 Configuration Pending'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Private, S3-compatible cloud storage for authentic court judgment PDF copies with SHA-256 integrity checks and presigned access.
              </p>
            </div>

            <button
              onClick={handleTestR2}
              disabled={testingR2}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow transition shrink-0"
            >
              {testingR2 ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>Run R2 Connection Test</span>
            </button>
          </div>

          {/* Test Probe Output */}
          {r2TestOutput && (
            <div className={`p-4 rounded-xl border text-xs space-y-1 ${
              r2TestOutput.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="font-bold flex items-center space-x-2">
                {r2TestOutput.success ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : <AlertTriangle className="w-4 h-4 text-amber-700" />}
                <span>{r2TestOutput.message}</span>
              </div>
              {r2TestOutput.details && (
                <pre className="p-3 bg-white/80 rounded border font-mono text-[11px] mt-2 overflow-x-auto">
                  {JSON.stringify(r2TestOutput.details, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Configuration Parameters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400">R2 Bucket Name</span>
              <div className="font-mono font-semibold text-slate-800 text-sm mt-1 truncate">
                {r2Status?.bucketName || 'Not Set'}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400">Account ID</span>
              <div className="font-mono font-semibold text-slate-800 text-sm mt-1 truncate">
                {r2Status?.accountId ? `${r2Status.accountId.slice(0, 8)}...` : 'Not Set'}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400">PDFs in Bucket</span>
              <div className="font-mono font-semibold text-slate-800 text-sm mt-1">
                {r2Status?.totalFiles ?? 'N/A'}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400">Storage Used</span>
              <div className="font-mono font-semibold text-slate-800 text-sm mt-1">
                {r2Status?.totalStorageBytes ? `${(r2Status.totalStorageBytes / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}
              </div>
            </div>
          </div>

          {/* Setup Instructions if Pending */}
          {!r2Status?.configured && r2SetupSteps.length > 0 && (
            <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 font-bold text-amber-900 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>Cloudflare Dashboard Setup Instructions:</span>
              </div>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs text-amber-900 leading-relaxed font-sans">
                {r2SetupSteps.map((step, idx) => (
                  <li key={idx} className={step.startsWith('  ') ? 'font-mono text-[11px] bg-white/70 p-1 rounded my-1' : ''}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION: OFFICIAL COURT COLLECTION                                    */}
      {/* ===================================================================== */}
      {activeSection === 'COLLECTION' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold font-serif text-slate-900 flex items-center space-x-2">
                <Scale className="w-6 h-6 text-indigo-700" />
                <span>Official Judgment Feed Discovery</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Legitimate discovery across Rajasthan High Court (hcraj.nic.in) & Supreme Court of India (sci.gov.in / e-SCR).
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCollectionCourt('rajasthan_high_court')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  collectionCourt === 'rajasthan_high_court'
                    ? 'bg-amber-800 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Rajasthan High Court
              </button>
              <button
                onClick={() => setCollectionCourt('supreme_court')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  collectionCourt === 'supreme_court'
                    ? 'bg-purple-800 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Supreme Court of India
              </button>
            </div>
          </div>

          {/* ⚡ PROMINENT DAILY COURT AUTO-SYNC HERO CARD */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-500/30 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>AUTOMATIC DAILY JUDGMENT ENGINE</span>
                </div>
                <h3 className="text-xl font-black text-white tracking-wide">
                  Daily Supreme Court & Rajasthan High Court Auto-Sync
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Fetches today's published judgments from the Supreme Court of India (INSC) and Rajasthan High Court (Jaipur & Jodhpur Benches), generates official PDFs, uploads them directly to your private Cloudflare R2 bucket (<code className="text-amber-300 font-mono">alwar-advocates-judgements</code>), extracts full text, and indexes in AI Legal Research.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
                <label className="flex items-center space-x-2 bg-white/10 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border border-white/15 hover:bg-white/20 transition select-none">
                  <input
                    type="checkbox"
                    checked={autoPublishDaily}
                    onChange={e => setAutoPublishDaily(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-400"
                  />
                  <span>Auto-Save & Publish Directly</span>
                </label>

                <button
                  onClick={handleRunDailySync}
                  disabled={isSyncingDaily}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs transition shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSyncingDaily ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Syncing & Uploading to R2...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-slate-950" />
                      <span>⚡ Sync Today's Judgments Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {dailySyncMessage && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{dailySyncMessage}</span>
              </div>
            )}
          </div>

          {/* Search Filters Form */}
          <form onSubmit={handleSearchCourt} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {collectionCourt === 'rajasthan_high_court' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bench</label>
                <select
                  value={collBench}
                  onChange={e => setCollBench(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                >
                  <option value="Jaipur">Jaipur Bench</option>
                  <option value="Jodhpur">Jodhpur Principal Seat</option>
                  <option value="All">All Benches</option>
                </select>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date From</label>
              <input
                type="date"
                value={collDateFrom}
                onChange={e => setCollDateFrom(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date To</label>
              <input
                type="date"
                value={collDateTo}
                onChange={e => setCollDateTo(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Citation / Diary No.</label>
              <input
                type="text"
                value={collCitation}
                onChange={e => setCollCitation(e.target.value)}
                placeholder={collectionCourt === 'supreme_court' ? 'e.g. 2026 INSC 485' : 'e.g. 2026:RJ-JP:44204'}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Case Type / No.</label>
              <input
                type="text"
                value={collCaseType}
                onChange={e => setCollCaseType(e.target.value)}
                placeholder="CRLA, CRLMB, D.B. Ref..."
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Party Name</label>
              <input
                type="text"
                value={collPartyName}
                onChange={e => setCollPartyName(e.target.value)}
                placeholder="Petitioner or Respondent..."
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Judge Name</label>
              <input
                type="text"
                value={collJudgeName}
                onChange={e => setCollJudgeName(e.target.value)}
                placeholder="Hon'ble Judge..."
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={collSearching}
                className="w-full py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition"
              >
                {collSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Search Official Portal</span>
              </button>
            </div>
          </form>

          {/* Direct URL Import Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h3 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
              <Download className="w-4 h-4 text-indigo-700" />
              <span>Import Official Judgment Copy Directly by URL</span>
            </h3>
            <form onSubmit={handleImportByUrl} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="sm:col-span-2">
                <input
                  type="url"
                  required
                  value={collUrlInput}
                  onChange={e => setCollUrlInput(e.target.value)}
                  placeholder="https://hcraj.nic.in/... or https://escr.sci.gov.in/..."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <input
                  type="text"
                  required
                  value={collUrlCitation}
                  onChange={e => setCollUrlCitation(e.target.value)}
                  placeholder="Citation (e.g. 2026 INSC 485)"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <input
                  type="text"
                  required
                  value={collUrlTitle}
                  onChange={e => setCollUrlTitle(e.target.value)}
                  placeholder="Case Title"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="sm:col-span-4 flex justify-end">
                <button
                  type="submit"
                  disabled={importingUrl}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-lg flex items-center space-x-1.5 shadow"
                >
                  {importingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>Retrieve PDF & Queue in Pending Approval</span>
                </button>
              </div>
            </form>
          </div>

          {/* Results List */}
          {collResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 text-xs">Discovered Official Precedents ({collResults.length}):</h3>
              <div className="space-y-2">
                {collResults.map((cand, idx) => (
                  <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {cand.citation}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{cand.courtCode}</span>
                        <span className="text-[10px] text-slate-400">Date: {cand.judgmentDate}</span>
                      </div>
                      <h4 className="font-bold font-serif text-slate-900 text-sm">{cand.caseTitle}</h4>
                      <p className="text-[11px] text-slate-500">Bench / Coram: {cand.judgeNames?.join(', ')}</p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <a
                        href={cand.officialSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center space-x-1 font-semibold"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={async () => {
                          if (!cand.officialPdfUrl) {
                            alert('Direct PDF URL not available for this record. Use URL import above.');
                            return;
                          }
                          try {
                            const res = await fetch('/api/admin/public/legal-library/collection', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                action: 'import_by_url',
                                court: collectionCourt,
                                pdfUrl: cand.officialPdfUrl,
                                title: cand.caseTitle,
                                citation: cand.citation,
                                bench: cand.bench
                              })
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || 'Import failed');
                            alert('Judgment imported and queued in Pending Approval!');
                            loadData();
                            setActiveSection('PENDING');
                          } catch (err: unknown) {
                            alert(err instanceof Error ? err.message : 'Import failed');
                          }
                        }}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg flex items-center space-x-1 shadow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Import to Pending</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION: AUDIT LOGS                                                   */}
      {/* ===================================================================== */}
      {activeSection === 'AUDIT_LOGS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xl font-bold font-serif text-slate-900 flex items-center space-x-2">
              <History className="w-5 h-5 text-indigo-700" />
              <span>Immutable Precedent Audit History</span>
            </h2>
            <button
              onClick={loadAuditLogs}
              disabled={loadingLogs}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              <span>Refresh Logs</span>
            </button>
          </div>

          {loadingLogs ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No audit events recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Document ID</th>
                    <th className="py-2.5 px-3">Notes & Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          log.action === 'published' ? 'bg-emerald-100 text-emerald-800' :
                          log.action === 'approved' ? 'bg-blue-100 text-blue-800' :
                          log.action === 'rejected' ? 'bg-red-100 text-red-800' :
                          log.action === 'submitted_for_approval' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 truncate max-w-[140px]">
                        {log.document_id}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-sans">
                        {log.notes || 'Routine status transition'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTIONS: PENDING / APPROVED / PUBLISHED / REJECTED / ALL DOCS        */}
      {/* ===================================================================== */}
      {(activeSection === 'PENDING' || activeSection === 'APPROVED' || activeSection === 'PUBLISHED' || activeSection === 'REJECTED_DRAFTS' || activeSection === 'ALL_DOCS') && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by citation, case title, court, or statutory sections..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </form>

            <div className="flex items-center gap-2">
              <select
                value={courtFilter}
                onChange={e => setCourtFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Courts</option>
                <option value="Supreme Court">Supreme Court of India</option>
                <option value="High Court">Rajasthan High Court</option>
              </select>
            </div>
          </div>

          {/* Documents Table */}
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-700" />
              <span>Loading judgment repository records...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 space-y-2">
              <Scale className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">No legal documents found in this section</h3>
              <p className="text-xs text-slate-400">
                {activeSection === 'PENDING' ? 'All discovered court judgments have been reviewed.' : 'Adjust search filters or upload new judgments.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => {
                const isPending = (doc.approval_status || doc.verification_status) === 'pending';
                const isApproved = doc.approval_status === 'approved' || doc.verification_status === 'verified';
                const isPublished = doc.publication_status === 'published';
                const isRejected = doc.approval_status === 'rejected' || doc.verification_status === 'rejected';

                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                          {doc.citation}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          doc.court_code === 'INSC' || doc.court_level === 'Supreme Court'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}>
                          {doc.court_code || doc.court_name}
                        </span>
                        {doc.case_number && (
                          <span className="text-[11px] font-mono text-slate-500">
                            {doc.case_number}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          Decided: {doc.judgment_date || 'N/A'}
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 ${
                          isPublished
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isApproved
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : isRejected
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {isPublished ? <CheckCircle2 className="w-3 h-3" /> : isApproved ? <CheckSquare className="w-3 h-3" /> : isRejected ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{isPublished ? 'Published' : isApproved ? 'Approved (Draft)' : isRejected ? 'Rejected' : 'Pending Approval'}</span>
                        </span>

                        {doc.r2_storage_key ? (
                          <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-mono font-semibold" title={doc.r2_storage_key}>
                            R2 Stored
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">
                            Local Storage
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Parties */}
                    <div>
                      <h3 className="font-serif font-bold text-base text-slate-900">{doc.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Coram: {Array.isArray(doc.judge_names) ? doc.judge_names.join(', ') : (doc.judge_names || 'Bench on record')}
                      </p>
                    </div>

                    {/* Rejection notice if rejected */}
                    {doc.rejection_reason && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                        <span><strong>Rejection Reason:</strong> {doc.rejection_reason}</span>
                      </div>
                    )}

                    {/* Summary */}
                    {doc.summary && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 line-clamp-2">
                        {doc.summary}
                      </p>
                    )}

                    {/* Actions Row */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      {/* Technical details */}
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
                        {doc.pdf_sha256 && (
                          <span title={doc.pdf_sha256}>SHA: {doc.pdf_sha256.slice(0, 10)}...</span>
                        )}
                        <span>Chunks: {doc.chunks_count ?? 'Index Active'}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Approval Workflows */}
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleApprovalAction(doc.id, 'approve_and_publish')}
                              disabled={submittingAction}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1 shadow-sm transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve & Publish</span>
                            </button>

                            <button
                              onClick={() => handleApprovalAction(doc.id, 'approve_only')}
                              disabled={submittingAction}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center space-x-1 shadow-sm transition"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Approve (Draft)</span>
                            </button>

                            <button
                              onClick={() => setRejectModalDoc(doc)}
                              disabled={submittingAction}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold flex items-center space-x-1 transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {isApproved && !isPublished && (
                          <button
                            onClick={() => handleApprovalAction(doc.id, 'approve_and_publish')}
                            disabled={submittingAction}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1 shadow-sm transition"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Publish to Public</span>
                          </button>
                        )}

                        <button
                          onClick={() => setViewTranscriptDoc(doc)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center space-x-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Transcript</span>
                        </button>

                        <a
                          href={`/api/public/judgments/download?id=${encodeURIComponent(doc.id)}&format=pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold flex items-center space-x-1 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>

                        <button
                          onClick={() => handleOpenEdit(doc)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                          title="Edit Metadata"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteDoc(doc.id, doc.citation)}
                          className="p-1.5 text-red-500 hover:text-red-800 hover:bg-red-50 rounded-lg"
                          title="Delete Judgment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: REJECT JUDGMENT WITH REASON                                    */}
      {/* ===================================================================== */}
      {rejectModalDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif font-bold text-base text-red-900 flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span>Reject Court Precedent</span>
              </h3>
              <button onClick={() => setRejectModalDoc(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <p className="text-slate-600">
              Please enter the official reason for rejecting <strong>{rejectModalDoc.citation}</strong>. This record will not be published and the reason will be logged in audit history.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rejection Reason *</label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Scanned copy illegible, incomplete order sheet, or duplicate citation..."
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setRejectModalDoc(null)}
                className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction || !rejectionReason.trim()}
                onClick={() => handleApprovalAction(rejectModalDoc.id, 'reject', rejectionReason)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center space-x-1"
              >
                {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: EDIT METADATA                                                  */}
      {/* ===================================================================== */}
      {editModalDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-900 border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-indigo-700" />
                <span>Edit Judgment Metadata</span>
              </h3>
              <button onClick={() => setEditModalDoc(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Case Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Citation</label>
                  <input
                    type="text"
                    required
                    value={editCitation}
                    onChange={e => setEditCitation(e.target.value)}
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Petitioner</label>
                  <input
                    type="text"
                    value={editPetitioner}
                    onChange={e => setEditPetitioner(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Respondent</label>
                  <input
                    type="text"
                    value={editRespondent}
                    onChange={e => setEditRespondent(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Approval Status</label>
                  <select
                    value={editApprovalStatus}
                    onChange={e => setEditApprovalStatus(e.target.value as ApprovalStatus)}
                    className="w-full p-2 border rounded-lg bg-slate-50 font-bold"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Publication Status</label>
                  <select
                    value={editPublicationStatus}
                    onChange={e => setEditPublicationStatus(e.target.value as PublicationStatus)}
                    className="w-full p-2 border rounded-lg bg-slate-50 font-bold"
                  >
                    <option value="draft">Draft (Private)</option>
                    <option value="published">Published (Public)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Judgment Date</label>
                  <input
                    type="date"
                    value={editJudgmentDate}
                    onChange={e => setEditJudgmentDate(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Coram / Judge Names</label>
                <input
                  type="text"
                  value={editJudgeNames}
                  onChange={e => setEditJudgeNames(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Ratio Decidendi / Summary</label>
                <textarea
                  rows={3}
                  value={editSummary}
                  onChange={e => setEditSummary(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
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
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg flex items-center space-x-1"
                >
                  {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: UPLOAD ORIGINAL PDF                                            */}
      {/* ===================================================================== */}
      {ingestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-900 border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center space-x-2">
                <Upload className="w-4 h-4 text-indigo-700" />
                <span>Upload Official Court Judgment PDF</span>
              </h3>
              <button onClick={() => setIngestModalOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
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
              <div>
                <label className="block font-semibold mb-1">Select Official Court Copy (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  required={!ingestRawText}
                  onChange={e => setIngestFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Case Title</label>
                  <input
                    type="text"
                    value={ingestTitle}
                    onChange={e => setIngestTitle(e.target.value)}
                    placeholder="Auto-extracted if left empty"
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Citation</label>
                  <input
                    type="text"
                    value={ingestCitation}
                    onChange={e => setIngestCitation(e.target.value)}
                    placeholder="e.g. 2026 INSC 485 or 2026:RJ-JP:44204"
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Court Level</label>
                  <select
                    value={ingestCourtLevel}
                    onChange={e => {
                      const lvl = e.target.value as CourtLevel;
                      setIngestCourtLevel(lvl);
                      setIngestCourtName(lvl === 'Supreme Court' ? 'Supreme Court of India' : 'High Court of Judicature for Rajasthan (Jaipur Bench)');
                    }}
                    className="w-full p-2 border rounded-lg bg-slate-50 font-semibold"
                  >
                    <option value="Supreme Court">Supreme Court of India</option>
                    <option value="High Court">Rajasthan High Court</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Court Name</label>
                  <input
                    type="text"
                    value={ingestCourtName}
                    onChange={e => setIngestCourtName(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
                <strong>Mandatory Approval Guarantee:</strong> Newly uploaded judgments are placed in <strong>Pending Admin Approval</strong> and will NOT be visible publicly until reviewed and approved.
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
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
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold rounded-lg flex items-center space-x-1.5 shadow"
                >
                  {ingesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Verify PDF & Ingest</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: VIEW FULL TRANSCRIPT                                           */}
      {/* ===================================================================== */}
      {viewTranscriptDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 text-slate-900 border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-mono font-bold text-indigo-700">{viewTranscriptDoc.citation}</span>
                <h3 className="font-serif font-bold text-base text-slate-900">{viewTranscriptDoc.title}</h3>
              </div>
              <button onClick={() => setViewTranscriptDoc(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed select-text">
              {viewTranscriptDoc.full_text}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <a
                href={`/api/public/judgments/download?id=${encodeURIComponent(viewTranscriptDoc.id)}&format=pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-sm transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Original Certified PDF</span>
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
