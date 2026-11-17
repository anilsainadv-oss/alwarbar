'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Search, BookOpen, CheckCircle, ShieldAlert, Bookmark, 
  ExternalLink, Sparkles, Scale, AlertCircle, CheckCircle2,
  Download, FileText, Printer, Eye, Copy, Check, X, ArrowUpRight, 
  Loader2, Filter, Upload, MessageSquare, History, BookmarkCheck,
  ChevronRight, Calendar, User, Layers, Tag, ShieldCheck, RefreshCw, Send
} from 'lucide-react';
import type { 
  LegalSearchResult, 
  RAGLegalResponse, 
  SavedResearch, 
  CourtLevel 
} from '@/types/legal-research';
import { JUDGMENT_REGISTRY, findJudgmentByCitation, type FullJudgmentRecord } from '@/lib/precedents/judgment-store';

function AILegalResearchDashboardContent() {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const paramCaseId = searchParams.get('case_id');
  const paramQuery = searchParams.get('query');
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'search' | 'assistant' | 'saved' | 'upload'>('search');

  // ==========================================
  // SEARCH STATE
  // ==========================================
  const [searchQuery, setSearchQuery] = useState('Grounds for regular bail under Section 480 BNSS 2023 for non-bailable offences');
  const [courtFilter, setCourtFilter] = useState<CourtLevel | 'ALL'>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [searchResults, setSearchResults] = useState<LegalSearchResult[]>([]);
  const [facets, setFacets] = useState<{ court_levels: Record<string, number>; years: Record<string, number>; subjects: Record<string, number> }>({
    court_levels: {},
    years: {},
    subjects: {}
  });
  const [detectedIntent, setDetectedIntent] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // ==========================================
  // ASSISTANT STATE
  // ==========================================
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantLang, setAssistantLang] = useState<'en' | 'hi'>(locale);
  const [messages, setMessages] = useState<{
    role: 'user' | 'assistant';
    content: string;
    response?: RAGLegalResponse;
  }[]>([]);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState('');

  // ==========================================
  // SAVED RESEARCH STATE
  // ==========================================
  const [savedList, setSavedList] = useState<SavedResearch[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [advocateCases, setAdvocateCases] = useState<{ id: string; case_title: string; case_number: string }[]>([]);
  const [selectedCaseFilter, setSelectedCaseFilter] = useState<string>('ALL');
  const [saveModalDoc, setSaveModalDoc] = useState<LegalSearchResult | null>(null);
  const [saveCaseId, setSaveCaseId] = useState<string>('');
  const [saveNotes, setSaveNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ==========================================
  // UPLOAD & INDEXING STATE
  // ==========================================
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadRawText, setUploadRawText] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCitation, setUploadCitation] = useState('');
  const [uploadCourtLevel, setUploadCourtLevel] = useState<CourtLevel>('High Court');
  const [uploadCourtName, setUploadCourtName] = useState('High Court of Judicature for Rajasthan (Jaipur Bench)');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const [uploadError, setUploadError] = useState('');

  // UI helpers
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [selectedJudgment, setSelectedJudgment] = useState<FullJudgmentRecord | null>(null);

  // Quick suggestion pills
  const SUGGESTION_PILLS = [
    { label: '(2022) 10 SCC 51 — Satender Antil (Bail)', query: '(2022) 10 SCC 51' },
    { label: 'Section 482 BNSS / 438 CrPC Anticipatory Bail', query: 'Section 482 BNSS anticipatory bail procedure' },
    { label: 'Section 53 Rajasthan Tenancy Act — Co-sharer Injunction', query: 'injunction against co-sharer in joint agricultural land partition Section 212' },
    { label: 'Section 63 BSA / 65B Evidence Act Certificate', query: 'certificate under section 65B electronic evidence call records' },
    { label: 'Section 139 NI Act Cheque Dishonour Presumption', query: 'cheque dishonour presumption under section 139 NI Act' }
  ];

  // -------------------------------------------------------------
  // 1. EXECUTE HYBRID SEARCH
  // -------------------------------------------------------------
  const executeSearch = async (queryText = searchQuery) => {
    if (!queryText.trim()) return;
    setSearchLoading(true);
    setSearchError('');

    try {
      const params = new URLSearchParams({
        query: queryText.trim(),
        limit: '20'
      });
      if (courtFilter !== 'ALL') params.append('court_level', courtFilter);
      if (yearFilter !== 'ALL') params.append('year', yearFilter);
      if (subjectFilter !== 'ALL') params.append('legal_subject', subjectFilter);

      const res = await fetch(`/api/my-case/research/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search query failed');

      setSearchResults(data.results || []);
      setFacets(data.facets || { court_levels: {}, years: {}, subjects: {} });
      setDetectedIntent(data.intent || null);
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : 'Error executing search');
    } finally {
      setSearchLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. EXECUTE AI ASSISTANT QUERY
  // -------------------------------------------------------------
  const executeAssistantQuery = async (userQ: string) => {
    if (!userQ.trim()) return;
    setAssistantLoading(true);
    setAssistantError('');

    const newMessages = [...messages, { role: 'user' as const, content: userQ.trim() }];
    setMessages(newMessages);
    setAssistantQuery('');

    try {
      const res = await fetch('/api/my-case/research/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userQ.trim(),
          language: assistantLang,
          conversation_history: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI Legal Consultation failed');

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: data.data.direct_legal_answer,
          response: data.data
        }
      ]);
    } catch (err: unknown) {
      setAssistantError(err instanceof Error ? err.message : 'AI Assistant consultation failed');
    } finally {
      setAssistantLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 3. LOAD SAVED RESEARCH & ADVOCATE CASES
  // -------------------------------------------------------------
  const loadSavedResearch = async () => {
    setSavedLoading(true);
    try {
      const url = selectedCaseFilter !== 'ALL' 
        ? `/api/my-case/research/saved?case_id=${selectedCaseFilter}`
        : '/api/my-case/research/saved';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setSavedList(data.saved || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSavedLoading(false);
    }
  };

  const loadAdvocateCases = async () => {
    try {
      const res = await fetch('/api/my-case/cases?limit=100');
      const data = await res.json();
      if (res.ok && data.cases) {
        setAdvocateCases(data.cases.map((c: any) => ({
          id: c.id,
          case_title: c.case_title,
          case_number: c.case_number
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------
  // 4. SAVE TO DOCKET HANDLER
  // -------------------------------------------------------------
  const handleSaveToDocket = async () => {
    if (!saveModalDoc) return;
    try {
      const res = await fetch('/api/my-case/research/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: saveModalDoc.document_id,
          case_id: saveCaseId || null,
          notes: saveNotes.trim()
        })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setSaveModalDoc(null);
          setSaveNotes('');
          setSaveCaseId('');
          if (activeTab === 'saved') loadSavedResearch();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------
  // 5. DELETE SAVED HANDLER
  // -------------------------------------------------------------
  const handleDeleteSaved = async (id: string) => {
    try {
      const res = await fetch(`/api/my-case/research/saved?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedList(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------
  // 6. UPLOAD HANDLER
  // -------------------------------------------------------------
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadError('');
    setUploadSuccessMsg('');

    try {
      let res;
      if (uploadFile) {
        const fd = new FormData();
        fd.append('file', uploadFile);
        if (uploadTitle) fd.append('title', uploadTitle);
        if (uploadCitation) fd.append('citation', uploadCitation);
        if (uploadCourtLevel) fd.append('court_level', uploadCourtLevel);
        if (uploadCourtName) fd.append('court_name', uploadCourtName);

        res = await fetch('/api/my-case/research/index-document', {
          method: 'POST',
          body: fd
        });
      } else {
        if (!uploadRawText.trim() || uploadRawText.trim().length < 20) {
          throw new Error('Please enter at least 20 characters of legal judgment text.');
        }

        res = await fetch('/api/my-case/research/index-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            raw_text: uploadRawText.trim(),
            title: uploadTitle || undefined,
            citation: uploadCitation || undefined,
            court_level: uploadCourtLevel,
            court_name: uploadCourtName
          })
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Document indexing failed');

      setUploadSuccessMsg(
        `Precedent successfully indexed! Generated ${data.chunksIndexed} chunks (${data.totalTokens} tokens) in ${data.processingTimeMs}ms.`
      );
      setUploadFile(null);
      setUploadRawText('');
      setUploadTitle('');
      setUploadCitation('');
      // Trigger search to surface new doc
      executeSearch(data.document.citation);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 7. DOWNLOAD PDF HANDLER
  // -------------------------------------------------------------
  const handleDownloadPdf = async (citation: string, title?: string) => {
    setDownloadingId(citation);
    try {
      const citeParam = encodeURIComponent(citation);
      const url = `/api/public/judgments/download?citation=${citeParam}&format=pdf`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const cleanTitle = (title || citation).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
      a.download = `${cleanTitle}_Judgment.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);

      setDownloadSuccessId(citation);
      setTimeout(() => setDownloadSuccessId(null), 3000);
    } catch (err) {
      console.error(err);
      window.open(`/api/public/judgments/download?citation=${encodeURIComponent(citation)}&format=pdf`, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenJudgment = (doc: LegalSearchResult | SavedResearch['document']) => {
    if (!doc) return;
    let jdg = findJudgmentByCitation(doc.citation);
    if (!jdg) {
      const docId = ('document_id' in doc ? doc.document_id : doc.id) || 'dyn-doc';
      const snippet = ('snippet' in doc ? doc.snippet : (doc.summary || doc.full_text?.slice(0, 300))) || 'Authoritative judgment proposition recorded in database.';
      const judgeStr = Array.isArray(doc.judge_names) ? doc.judge_names.join(', ') : (doc.judge_names || 'Hon\'ble Judges on Record');
      const statuteStr = Array.isArray(doc.statutes) ? doc.statutes.join(', ') : (doc.statutes || 'General Statutory Provisions');
      const subjectStr = doc.legal_subject || ('legal_subjects' in doc && Array.isArray(doc.legal_subjects) ? doc.legal_subjects.join(', ') : 'Indian Statutory Law');
      
      jdg = {
        id: docId,
        case_title: doc.title,
        citation: doc.citation,
        court: doc.court_name,
        court_hi: doc.court_name,
        bench: judgeStr,
        decision_date: doc.judgment_date || 'Judgment on Record',
        statute_subject: subjectStr,
        statute_subject_hi: 'भारतीय संविधिक विधि',
        category: 'criminal',
        headnotes: [
          `Substantive legal proposition established in ${doc.citation}`,
          `Bench: ${judgeStr}`,
          `Statutes: ${statuteStr}`
        ],
        held_proposition: snippet,
        held_proposition_hi: snippet,
        official_kanoon_url: `https://indiankanoon.org/search/?formInput=${encodeURIComponent(doc.citation)}`,
        official_escr_url: 'https://escr.sci.gov.in/',
        full_judgment_text: `IN THE ${doc.court_name.toUpperCase()}\n\nCITATION: ${doc.citation}\nBENCH: ${judgeStr}\nDECISION DATE: ${doc.judgment_date || 'N/A'}\n\n${snippet}\n\nCertified copy of authoritative legal transcript preserved in Alwar Advocates Portal pgvector precedent repository.`
      };
    }
    if (jdg) setSelectedJudgment(jdg);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Initial load
  useEffect(() => {
    const q = searchParams.get('query');
    const cId = searchParams.get('case_id');
    if (q) {
      setSearchQuery(q);
      executeSearch(q);
    } else {
      executeSearch();
    }
    if (cId) {
      setSaveCaseId(cId);
      setSelectedCaseFilter(cId);
    }
    loadAdvocateCases();
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedResearch();
    }
  }, [activeTab, selectedCaseFilter]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-legal-navyDark to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-amber-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-10 pointer-events-none">
          <Scale className="w-64 h-64 text-amber-300" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Legal Research & pgvector Precedent Search</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl tracking-tight text-white">
            {locale === 'hi' ? 'एआई विधिक शोध एवं न्यायिक दृष्टांत इंजन' : 'AI Legal Research & Intelligent Precedent Engine'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            {locale === 'hi' 
              ? 'सर्वोच्च न्यायालय, राजस्थान उच्च न्यायालय एवं अधीनस्थ न्यायालयों के सत्यापित निर्णयों, बीएनएसएस/बीएनएस नवीन संविधियों और राजस्थान काश्तकारी अधिनियम में उच्च परिशुद्धता युक्त खोज।'
              : 'High-precision hybrid semantic search across Supreme Court e-SCR, Rajasthan High Court, BNSS/BNS statutes, and local tenancy precedents with anti-hallucination AI legal consultation.'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-slate-700/60 mt-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'search' 
                ? 'bg-amber-500 text-slate-900 shadow-md font-bold' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>{locale === 'hi' ? 'दृष्टांत खोज (Search)' : 'Precedent Search'}</span>
          </button>

          <button
            onClick={() => setActiveTab('assistant')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'assistant' 
                ? 'bg-amber-500 text-slate-900 shadow-md font-bold' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{locale === 'hi' ? 'एआई विधिक सहायक (RAG Assistant)' : 'AI Legal Assistant'}</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'saved' 
                ? 'bg-amber-500 text-slate-900 shadow-md font-bold' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>{locale === 'hi' ? 'सुरक्षित शोध (Saved Bookmarks)' : 'Saved Precedents'}</span>
            {savedList.length > 0 && (
              <span className="bg-slate-900/30 text-[10px] px-1.5 py-0.5 rounded-full">
                {savedList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'upload' 
                ? 'bg-amber-500 text-slate-900 shadow-md font-bold' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{locale === 'hi' ? 'दस्तावेज़ अनुक्रमित करें (Index Precedent)' : 'Upload & Index'}</span>
          </button>
        </div>
      </div>

      {/* Active Case Docket Linkage Banner */}
      {paramCaseId && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 px-5 py-3 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-indigo-950 block">
                Active Case Docket: {advocateCases.find(c => c.id === paramCaseId)?.case_title || 'Case ' + paramCaseId}
              </span>
              <span className="text-[11px] text-indigo-700">
                Precedents saved will be directly linked to this case file for pleadings and court submissions.
              </span>
            </div>
          </div>
          <Link
            href={`/my-case/cases/${paramCaseId}`}
            className="px-3 py-1.5 bg-white border border-indigo-300 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-semibold transition shrink-0 self-start sm:self-auto flex items-center space-x-1"
          >
            <span>← Return to Case Dossier</span>
          </Link>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: PRECEDENT SEARCH                                   */}
      {/* ========================================================= */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <form 
              onSubmit={(e) => { e.preventDefault(); executeSearch(searchQuery); }} 
              className="relative flex items-center"
            >
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === 'hi' ? 'निर्णय, उद्धरण (Citation) अथवा विधिक प्रश्न दर्ज करें...' : 'Search citations, case names, or legal questions (e.g., (2022) 10 SCC 51, 482 BNSS bail)...'}
                className="w-full pl-11 pr-32 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              />
              <button
                type="submit"
                disabled={searchLoading}
                className="absolute right-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow transition disabled:opacity-50"
              >
                {searchLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>{locale === 'hi' ? 'खोजें' : 'Search'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Intent Indicator & Suggestion Pills */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-600">
                  {locale === 'hi' ? 'त्वरित दृष्टांत संदर्भ (Suggested Queries):' : 'Instant Precedent Lookups:'}
                </span>
                {detectedIntent && (
                  <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Mode: {detectedIntent.replace('_', ' ').toUpperCase()}</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {SUGGESTION_PILLS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchQuery(p.query);
                      executeSearch(p.query);
                    }}
                    className="text-[11px] bg-slate-100 hover:bg-amber-100/80 hover:text-amber-900 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Court Hierarchy
                </label>
                <select
                  value={courtFilter}
                  onChange={(e) => {
                    const val = e.target.value as CourtLevel | 'ALL';
                    setCourtFilter(val);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ALL">All Courts (All Hierarchy)</option>
                  <option value="Supreme Court">Supreme Court of India</option>
                  <option value="High Court">High Court (Rajasthan Bench)</option>
                  <option value="District Court">District & Sessions Court</option>
                  <option value="Tribunal">Tribunals & Revenue Courts</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Decision Year
                </label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ALL">All Years</option>
                  <option value="2026">2026 (BNSS / Recent Enactments)</option>
                  <option value="2024">2024</option>
                  <option value="2022">2022 (Satender Antil)</option>
                  <option value="2021">2021 (Prem Chand v. Jagdish)</option>
                  <option value="2020">2020 (Arjun Panditrao)</option>
                  <option value="2019">2019 (Bir Singh v. Mukesh)</option>
                  <option value="2014">2014 (Arnesh Kumar)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Legal Subject Matter
                </label>
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ALL">All Legal Subjects</option>
                  <option value="Bail">Criminal Defense & Bail (BNSS/CrPC)</option>
                  <option value="Tenancy">Revenue Land Law (Rajasthan Tenancy)</option>
                  <option value="Evidence">Law of Evidence & Electronic Records</option>
                  <option value="Injunction">Civil Temporary Injunctions</option>
                  <option value="Cheque">Negotiable Instruments (Section 138 NI)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search Results Display */}
          {searchError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{searchError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
              <span>
                {searchResults.length} {locale === 'hi' ? 'सत्यापित पूर्वदृष्टान्त प्राप्त हुए' : 'Verified Precedents Ranked'}
              </span>
              <button 
                onClick={() => executeSearch()} 
                className="text-blue-600 hover:text-blue-800 inline-flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            {searchResults.length === 0 && !searchLoading && (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-semibold text-sm text-slate-700">No matching precedents found</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Try broadening your search query, clearing filters, or searching by exact official citation like (2022) 10 SCC 51.
                </p>
              </div>
            )}

            {searchResults.map((doc, idx) => (
              <div 
                key={doc.document_id + '-' + idx}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition space-y-3.5"
              >
                {/* Precedent Top Row */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="bg-slate-900 text-amber-300 font-serif font-bold px-2.5 py-0.5 rounded text-xs">
                        {doc.citation}
                      </span>
                      <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded text-[11px] border border-blue-200">
                        {doc.court_level}
                      </span>
                      {doc.hybrid_score && (
                        <span className="bg-emerald-50 text-emerald-800 font-medium px-2 py-0.5 rounded text-[10px] border border-emerald-200" title="Reciprocal Rank Fusion Hybrid Relevance Score">
                          Match: {(doc.hybrid_score * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-base text-slate-900 leading-snug">
                      {doc.title}
                    </h3>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setSaveModalDoc(doc);
                        if (paramCaseId) setSaveCaseId(paramCaseId);
                        setSaveNotes(`Precedent cited for legal proposition in ${doc.citation}`);
                      }}
                      className="text-xs bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition flex items-center space-x-1"
                      title="Bookmark to active case docket"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                      <span className="hidden sm:inline">Save</span>
                    </button>

                    <button
                      onClick={() => handleDownloadPdf(doc.citation, doc.title)}
                      disabled={downloadingId === doc.citation}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition flex items-center space-x-1 disabled:opacity-50"
                      title="Download Certified PDF transcript"
                    >
                      {downloadingId === doc.citation ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      ) : downloadSuccessId === doc.citation ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span className="hidden sm:inline">PDF</span>
                    </button>

                    <button
                      onClick={() => copyToClipboard(doc.citation, doc.document_id)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg border border-slate-200 transition"
                      title="Copy citation"
                    >
                      {copiedId === doc.document_id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Scale className="w-3 h-3 text-slate-400" />
                    <span>{doc.court_name}</span>
                  </span>
                  {doc.judgment_date && (
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{doc.judgment_date}</span>
                    </span>
                  )}
                  {doc.judge_names && (
                    <span className="flex items-center space-x-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-xs">{doc.judge_names}</span>
                    </span>
                  )}
                </div>

                {/* Highlighted Snippet Box */}
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed font-sans">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: (doc as any).highlighted_snippet || doc.snippet 
                    }} 
                  />
                </div>

                {/* Statutes & Full Judgment Trigger */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span className="font-semibold text-slate-700 truncate max-w-md">
                      {doc.statutes || doc.legal_subject || 'Statutory Precedent'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenJudgment(doc)}
                    className="text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center space-x-1 text-xs"
                  >
                    <span>{locale === 'hi' ? 'सम्पूर्ण निर्णय देखें' : 'View Full Judgment'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: AI LEGAL ASSISTANT (CONVERSATIONAL RAG)             */}
      {/* ========================================================= */}
      {activeTab === 'assistant' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <h2 className="font-serif font-bold text-base text-slate-900">
                    {locale === 'hi' ? 'एआई विधिक परामर्श कक्ष (Anti-Hallucination Legal RAG)' : 'AI Legal Research Consultation'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Grounded strictly in verified Supreme Court, Rajasthan High Court and BNSS statutory provisions.
                  </p>
                </div>
              </div>

              {/* Language Selector */}
              <div className="flex items-center space-x-1 text-xs bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAssistantLang('en')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${assistantLang === 'en' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setAssistantLang('hi')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${assistantLang === 'hi' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                >
                  हिन्दी (Hindi)
                </button>
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="space-y-4 min-h-[300px] max-h-[550px] overflow-y-auto pr-1">
              {messages.length === 0 && (
                <div className="bg-slate-50 p-8 rounded-xl text-center space-y-3 text-slate-500 my-8">
                  <Scale className="w-10 h-10 text-amber-500 mx-auto opacity-70" />
                  <p className="font-serif font-bold text-sm text-slate-800">
                    {locale === 'hi' ? 'विधिक परामर्श प्रारम्भ करें' : 'Start an Anti-Hallucination Legal Consultation'}
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Ask questions on bail under Sections 480/482 BNSS, co-sharer partition injunctions under Rajasthan Tenancy Act, or electronic evidence under Section 63 BSA.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <button
                      onClick={() => executeAssistantQuery('Can police arrest without 41A notice for offences punishable up to 7 years?')}
                      className="text-[11px] bg-white border border-slate-200 hover:border-amber-400 px-3 py-1.5 rounded-lg text-slate-700 shadow-sm transition"
                    >
                      "Can police arrest without 41A notice?"
                    </button>
                    <button
                      onClick={() => executeAssistantQuery('What are the legal rights of an undivided co-sharer regarding boundary wall construction in Rajasthan?')}
                      className="text-[11px] bg-white border border-slate-200 hover:border-amber-400 px-3 py-1.5 rounded-lg text-slate-700 shadow-sm transition"
                    >
                      "Co-sharer rights in agricultural land"
                    </button>
                  </div>
                </div>
              )}

              {messages.map((m, mIdx) => (
                <div 
                  key={mIdx}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                    {m.role === 'user' ? 'Advocate Inquiry' : 'Senior Legal AI Assistant'}
                  </span>
                  
                  {m.role === 'user' ? (
                    <div className="bg-slate-900 text-amber-200 px-4 py-2.5 rounded-2xl rounded-tr-none text-xs sm:text-sm max-w-2xl shadow-sm">
                      {m.content}
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl rounded-tl-none text-xs sm:text-sm max-w-3xl shadow-sm space-y-4">
                      {/* Direct Answer */}
                      <div className="text-slate-800 font-sans leading-relaxed">
                        {m.content}
                      </div>

                      {/* Structured Details if available */}
                      {m.response && (
                        <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                          {/* Legal Principles */}
                          {m.response.legal_principles?.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                                <Scale className="w-3.5 h-3.5 text-amber-600" />
                                <span>Core Legal Ratio & Principles:</span>
                              </span>
                              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                                {m.response.legal_principles.map((pr, pIdx) => (
                                  <li key={pIdx}>{pr}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Relevant Judgments Cited */}
                          {m.response.relevant_judgments?.length > 0 && (
                            <div className="space-y-1.5 pt-2">
                              <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                                <span>Binding Precedents Cited:</span>
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {m.response.relevant_judgments.map((j, jIdx) => (
                                  <div 
                                    key={jIdx}
                                    className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-serif font-bold text-slate-900 text-[11px]">
                                        {j.citation}
                                      </span>
                                      <button
                                        onClick={() => handleDownloadPdf(j.citation, j.title)}
                                        className="text-blue-600 hover:text-blue-800 text-[10px] font-semibold flex items-center space-x-0.5"
                                      >
                                        <Download className="w-3 h-3" />
                                        <span>PDF</span>
                                      </button>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-700 truncate">{j.title}</p>
                                    <p className="text-[10px] text-slate-500">{j.court}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Practical Advocacy Notes */}
                          {m.response.practical_considerations?.length > 0 && (
                            <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl space-y-1 text-amber-900">
                              <span className="font-bold text-xs flex items-center space-x-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                                <span>Advocacy Notes for District Courts Alwar:</span>
                              </span>
                              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                                {m.response.practical_considerations.map((note, nIdx) => (
                                  <li key={nIdx}>{note}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Statutory Disclaimer */}
                          <p className="text-[10px] text-slate-400 italic pt-1">
                            {m.response.warning_disclaimer}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {assistantLoading && (
                <div className="flex items-center space-x-2 text-slate-500 text-xs py-2 px-1">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  <span>Synthesizing legal research against verified precedents...</span>
                </div>
              )}
            </div>

            {assistantError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{assistantError}</span>
              </div>
            )}

            {/* Input Bar */}
            <form 
              onSubmit={(e) => { e.preventDefault(); executeAssistantQuery(assistantQuery); }}
              className="flex items-center space-x-2 pt-2 border-t border-slate-100"
            >
              <input
                type="text"
                value={assistantQuery}
                onChange={(e) => setAssistantQuery(e.target.value)}
                placeholder={assistantLang === 'hi' ? 'विधिक प्रश्न अथवा संविधिक संशय पूछें...' : 'Ask a specific legal question or factual situation...'}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
              <button
                type="submit"
                disabled={assistantLoading || !assistantQuery.trim()}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl font-semibold text-xs flex items-center space-x-1.5 shadow transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{locale === 'hi' ? 'परामर्श करें' : 'Consult'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SAVED RESEARCH & CASE DOCKET BOOKMARKS             */}
      {/* ========================================================= */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-slate-100">
              <div className="flex items-center space-x-2">
                <BookmarkCheck className="w-5 h-5 text-amber-600" />
                <div>
                  <h2 className="font-serif font-bold text-base text-slate-900">
                    {locale === 'hi' ? 'सुरक्षित विधिक दृष्टांत एवं केस डॉकेट लिंक' : 'Saved Precedents & Case Docket Links'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Bookmarked legal authorities linked to your active cases in Alwar District Courts.
                  </p>
                </div>
              </div>

              {/* Case Filter Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-semibold text-slate-500">Filter by Case:</span>
                <select
                  value={selectedCaseFilter}
                  onChange={(e) => setSelectedCaseFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ALL">All Active Cases</option>
                  {advocateCases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} — {c.case_title.slice(0, 25)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {savedLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span>Loading saved precedent bookmarks...</span>
              </div>
            ) : savedList.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-semibold text-sm text-slate-700">No saved precedents yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Use the "Save" action on any search result to bookmark precedents directly to this library or associate them with an active case docket.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedList.map(item => (
                  <div 
                    key={item.id}
                    className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 hover:border-amber-400 transition space-y-2.5 relative"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="bg-slate-900 text-amber-300 font-serif font-bold px-2 py-0.5 rounded text-[11px]">
                          {item.document?.citation || 'Verified Precedent'}
                        </span>
                        <h4 className="font-serif font-bold text-sm text-slate-900 pt-1">
                          {item.document?.title || 'Judicial Precedent Record'}
                        </h4>
                      </div>

                      <button
                        onClick={() => handleDeleteSaved(item.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition"
                        title="Delete from saved bookmarks"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      {item.document?.court_name} {item.document?.judgment_date && `• ${item.document.judgment_date}`}
                    </p>

                    {item.notes && (
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 italic">
                        "{item.notes}"
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                      {item.case_id ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] text-blue-700 font-semibold">
                          <FileText className="w-3 h-3" />
                          <span>Case Docket Linked</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">General Bookmark</span>
                      )}

                      <div className="flex items-center space-x-1.5">
                        {item.document && (
                          <button
                            onClick={() => handleOpenJudgment(item.document)}
                            className="text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center space-x-0.5 text-xs"
                          >
                            <span>Read</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                        {item.document?.citation && (
                          <button
                            onClick={() => handleDownloadPdf(item.document!.citation, item.document!.title)}
                            className="text-slate-600 hover:text-slate-900 p-1"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: UPLOAD & INDEX PRECEDENT (INGESTION PIPELINE)      */}
      {/* ========================================================= */}
      {activeTab === 'upload' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b pb-3 border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
                <Upload className="w-5 h-5 text-amber-500" />
                <span>{locale === 'hi' ? 'नवीन न्यायिक निर्णय अथवा संविधि अनुक्रमित करें' : 'Ingest & Index Legal Judgment'}</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Upload official court PDF/Word transcripts or paste raw judgment text to create 1536-dimensional semantic chunks.
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-lg text-xs border border-emerald-200">
              pgvector Pipeline Ready
            </span>
          </div>

          {uploadSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}

          {uploadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
            {/* File Upload Option */}
            <div className="border-2 border-dashed border-slate-200 hover:border-amber-400 p-6 rounded-2xl text-center space-y-2 transition bg-slate-50/50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs text-slate-700">
                <label className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer">
                  <span>Choose PDF / DOCX file</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="sr-only"
                  />
                </label>
                <span className="text-slate-500"> or paste text below</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Supports Adobe PDF (up to 25MB) and Microsoft Word (.docx). Text is extracted pure-Node without external APIs.
              </p>
              {uploadFile && (
                <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-800 px-3 py-1 rounded-lg text-xs font-semibold">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button type="button" onClick={() => setUploadFile(null)} className="text-blue-500 hover:text-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Optional Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Case Title (Optional — Auto-extracted if blank)
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Satender Kumar Antil v. CBI"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Official Citation (Optional — Auto-extracted if blank)
                </label>
                <input
                  type="text"
                  value={uploadCitation}
                  onChange={(e) => setUploadCitation(e.target.value)}
                  placeholder="e.g. (2022) 10 SCC 51 or 2026 (1) RLR 789"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Court Hierarchy
                </label>
                <select
                  value={uploadCourtLevel}
                  onChange={(e) => setUploadCourtLevel(e.target.value as CourtLevel)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Supreme Court">Supreme Court of India</option>
                  <option value="High Court">High Court (Rajasthan Bench)</option>
                  <option value="District Court">District & Sessions Court, Alwar</option>
                  <option value="Tribunal">Tribunal / Revenue Court</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Court Name
                </label>
                <input
                  type="text"
                  value={uploadCourtName}
                  onChange={(e) => setUploadCourtName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Raw Text Input (if no file) */}
            {!uploadFile && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Full Judgment Text or Certified Transcript
                </label>
                <textarea
                  rows={8}
                  value={uploadRawText}
                  onChange={(e) => setUploadRawText(e.target.value)}
                  placeholder="Paste the complete judgment text here. The pipeline will automatically clean headers, detect citations, extract legal ratios, and generate 1536-dimensional vector chunks..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={uploadLoading || (!uploadFile && !uploadRawText.trim())}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md transition disabled:opacity-50"
            >
              {uploadLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Processing Extraction & Generating Embeddings...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Ingest & Index Precedent into Vault</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: SAVE / BOOKMARK TO DOCKET MODAL                   */}
      {/* ========================================================= */}
      {saveModalDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center space-x-2">
                <Bookmark className="w-5 h-5 text-amber-600" />
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Save Precedent to Case Docket
                </h3>
              </div>
              <button 
                onClick={() => setSaveModalDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="bg-slate-900 text-amber-300 font-serif font-bold px-2 py-0.5 rounded text-[10px]">
                  {saveModalDoc.citation}
                </span>
                <p className="font-serif font-bold text-slate-900 text-sm mt-1">{saveModalDoc.title}</p>
                <p className="text-[11px] text-slate-500">{saveModalDoc.court_name}</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Associate with Active Case Docket (Optional)
                </label>
                <select
                  value={saveCaseId}
                  onChange={(e) => setSaveCaseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">General Precedent (No specific case)</option>
                  {advocateCases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} — {c.case_title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Personal Research Notes & Argument Outline
                </label>
                <textarea
                  rows={3}
                  value={saveNotes}
                  onChange={(e) => setSaveNotes(e.target.value)}
                  placeholder="e.g. Cited for bail argument before Sessions Judge on 20th November..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {saveSuccess && (
              <div className="bg-emerald-50 text-emerald-800 text-xs p-2.5 rounded-lg flex items-center space-x-1.5 font-semibold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Precedent saved to your office docket successfully!</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSaveModalDoc(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveToDocket}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Save Precedent</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: FULL JUDGMENT VIEWER MODAL                        */}
      {/* ========================================================= */}
      {selectedJudgment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-900 text-white rounded-t-2xl">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-400 text-slate-900 font-serif font-bold text-xs px-2.5 py-0.5 rounded">
                    {selectedJudgment.citation}
                  </span>
                  <span className="text-xs text-slate-300">
                    {selectedJudgment.court}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-white">
                  {selectedJudgment.case_title}
                </h3>
                <p className="text-xs text-slate-400">
                  Bench: {selectedJudgment.bench} • Date: {selectedJudgment.decision_date}
                </p>
              </div>

              <button
                onClick={() => setSelectedJudgment(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans text-slate-700 leading-relaxed">
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <span className="font-bold text-xs flex items-center space-x-1">
                  <Scale className="w-4 h-4 text-amber-700" />
                  <span>Judicial Ratio Decidendi (Held):</span>
                </span>
                <p className="text-xs leading-relaxed">{selectedJudgment.held_proposition}</p>
                {selectedJudgment.held_proposition_hi && (
                  <p className="text-[11px] text-amber-800 pt-1 font-serif">{selectedJudgment.held_proposition_hi}</p>
                )}
              </div>

              {selectedJudgment.headnotes && selectedJudgment.headnotes.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Judicial Headnotes:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    {selectedJudgment.headnotes.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Full Judgment Text & Orders:
                </h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[11px] whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed text-slate-800">
                  {selectedJudgment.full_judgment_text}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-2xl">
              <span className="text-[11px] text-slate-400">
                Verified by District & Sessions Bar Association, Alwar
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyToClipboard(selectedJudgment.full_judgment_text, 'modal-copy')}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedId === 'modal-copy' ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => handleDownloadPdf(selectedJudgment.citation, selectedJudgment.case_title)}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Certified PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AILegalResearchDashboard() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto p-12 text-center text-xs text-slate-500">
          Loading AI Legal Research & Smart Search Engine...
        </div>
      }
    >
      <AILegalResearchDashboardContent />
    </Suspense>
  );
}
