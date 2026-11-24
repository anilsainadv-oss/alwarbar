'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Scale, Sparkles, Folder, Calendar, CheckSquare, 
  AlertTriangle, FileText, CheckCircle2, Clock, Send, 
  RefreshCw, Plus, MessageSquare, Trash2, Coins, ShieldCheck,
  AlertCircle, ArrowRight, BookOpen, Layers
} from 'lucide-react';
import type { CaseRecord, CaseDocument, AIChatSession, AIChatMessage } from '@/types/mycase';
import type { AIAnalysisResult } from '@/lib/ai/provider';

export default function AIAssistantPage() {
  const { t, locale } = useLanguage();

  // Tab State
  const [activeTab, setActiveTab] = useState<'chat' | 'analysis'>('chat');

  // Common Cases State
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');

  // ----------------------------------------------------
  // CHAT STATE
  // ----------------------------------------------------
  const [chatSessions, setChatSessions] = useState<AIChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLanguage, setChatLanguage] = useState<'hi' | 'en'>(locale);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [lastUserPrompt, setLastUserPrompt] = useState('');
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const [totalCostINR, setTotalCostINR] = useState(0);
  const [providerName, setProviderName] = useState('Deterministic Legal Analysis Engine (Offline Grounded)');
  const [isDemoMode, setIsDemoMode] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ----------------------------------------------------
  // CASE ANALYSIS STATE
  // ----------------------------------------------------
  const [factsInput, setFactsInput] = useState('');
  const [docsInput, setDocsInput] = useState('');
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  // Initial Load: Cases, Documents, Chat Sessions
  useEffect(() => {
    // 1. Fetch Cases
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

    // 2. Fetch Chat Sessions & Usage Telemetry
    loadChatSessions();
  }, []);

  // Fetch Documents when case changes
  useEffect(() => {
    if (selectedCaseId) {
      fetch(`/api/my-case/documents?caseId=${selectedCaseId}`)
        .then(r => r.json())
        .then(data => {
          if (data.documents) {
            setDocuments(data.documents);
          }
        })
        .catch(console.error);
    }
  }, [selectedCaseId]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const loadChatSessions = async () => {
    try {
      const res = await fetch('/api/my-case/ai/chat');
      const data = await res.json();
      if (data.sessions) {
        setChatSessions(data.sessions);
        if (data.sessions.length > 0 && !activeSessionId) {
          selectSession(data.sessions[0]);
        }
      }
      if (data.usage) {
        setTotalTokensUsed(data.usage.totalTokens || 0);
        setTotalCostINR(data.usage.totalCostINR || 0);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const selectSession = (session: AIChatSession) => {
    setActiveSessionId(session.id);
    setMessages(session.messages || []);
    if (session.case_id) {
      setSelectedCaseId(session.case_id);
    }
    setChatError('');
  };

  const handleStartNewSession = () => {
    setActiveSessionId('');
    setMessages([]);
    setInputMessage('');
    setChatError('');
    setSuggestedPrompts([
      chatLanguage === 'hi' ? 'धारा 480 बीएनएसएस के तहत नियमित जमानत के आधार बताएं' : 'Explain grounds for regular bail under Section 480 BNSS',
      chatLanguage === 'hi' ? 'आदेश 39 नियम 1 व 2 सीपीसी का अंतरिम स्थगन प्रारूप' : 'Tripartite test for temporary injunction under Order 39 CPC',
      chatLanguage === 'hi' ? 'धारा 63 साक्ष्य अधिनियम (BSA 2023) का इलेक्ट्रॉनिक प्रमाण पत्र' : 'Section 63 BSA electronic evidence certificate requirements'
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || chatLoading) return;

    setChatLoading(true);
    setChatError('');
    setLastUserPrompt(text);
    setInputMessage('');

    // Optimistically add user message
    const tempUserMsg: AIChatMessage = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/my-case/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId || undefined,
          caseId: selectedCaseId || undefined,
          message: text,
          language: chatLanguage
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to communicate with Legal AI');
      }

      // Update session ID if newly created
      if (data.session) {
        setActiveSessionId(data.session.id);
        setMessages(data.session.messages);
        setChatSessions(prev => {
          const idx = prev.findIndex(s => s.id === data.session.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = data.session;
            return updated;
          }
          return [data.session, ...prev];
        });
      }

      if (data.result) {
        setProviderName(data.result.provider);
        setIsDemoMode(data.result.isDemo);
        if (data.result.suggestedFollowUps) {
          setSuggestedPrompts(data.result.suggestedFollowUps);
        }
      }

      // Refresh aggregate telemetry
      loadChatSessions();
    } catch (err: unknown) {
      setChatError(err instanceof Error ? err.message : 'Error in chat consultation');
    } finally {
      setChatLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this consultation thread?')) return;

    try {
      await fetch(`/api/my-case/ai/chat?sessionId=${sessionId}`, { method: 'DELETE' });
      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        handleStartNewSession();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // ----------------------------------------------------
  // CASE ANALYSIS HANDLER
  // ----------------------------------------------------
  const handleCaseChange = (caseId: string) => {
    setSelectedCaseId(caseId);
    const found = cases.find(c => c.id === caseId);
    if (found && found.private_notes) {
      setFactsInput(found.private_notes);
    }
  };

  const handleDocSelect = (docId: string) => {
    setSelectedDocId(docId);
    const doc = documents.find(d => d.id === docId);
    if (doc && doc.extracted_text) {
      setDocsInput(doc.extracted_text);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalysisLoading(true);
    setAnalysisError('');

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
      setAnalysisError(err instanceof Error ? err.message : 'Error analyzing dossier');
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="border-b pb-4 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
            <Scale className="w-4 h-4" />
            <span>Alwar Bar Practice Intelligence</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
            {locale === 'hi' ? 'एआई विधिक सहायक एवं केस फाइल विश्लेषक' : 'AI Legal Assistant & Dossier Diagnostic'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-turn Indian statutory consultation, chronological fact timeline, evidentiary contradiction detection, and real Word pleading generation.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeTab === 'chat'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
            <span>Multi-Turn Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeTab === 'analysis'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Case Diagnostic & Timeline</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: MULTI-TURN AI LEGAL CONSULTATION */}
      {/* ======================================================== */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Session Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* New Thread Button */}
            <button
              type="button"
              onClick={handleStartNewSession}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Legal Consultation</span>
            </button>

            {/* Case Grounding Selector */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <label className="block font-semibold text-slate-700">Attach Case Context (Optional)</label>
              <select
                value={selectedCaseId}
                onChange={e => setSelectedCaseId(e.target.value)}
                className="w-full p-2 border rounded-lg bg-slate-50 text-slate-800"
              >
                <option value="">-- General Statutory Inquiry --</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.case_title} ({c.court_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Language Selector */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <label className="block font-semibold text-slate-700">Consultation Language</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChatLanguage('hi')}
                  className={`py-1.5 rounded-lg border text-center font-semibold text-xs transition ${
                    chatLanguage === 'hi' ? 'bg-amber-600 text-white' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  हिंदी (Court Hindi)
                </button>
                <button
                  type="button"
                  onClick={() => setChatLanguage('en')}
                  className={`py-1.5 rounded-lg border text-center font-semibold text-xs transition ${
                    chatLanguage === 'en' ? 'bg-amber-600 text-white' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  English (Court English)
                </button>
              </div>
            </div>

            {/* Saved Threads List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
              <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 flex items-center justify-between">
                <span>Recent Consultations</span>
                <span className="text-[10px] text-slate-400">{chatSessions.length} saved</span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {chatSessions.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No previous sessions. Start a new one above.</div>
                ) : (
                  chatSessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => selectSession(session)}
                      className={`p-3 cursor-pointer transition flex items-center justify-between group ${
                        activeSessionId === session.id
                          ? 'bg-amber-50/70 text-amber-900 border-l-4 border-amber-600 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="truncate pr-2 space-y-0.5">
                        <div className="truncate font-medium">{session.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(session.updated_at).toLocaleDateString()} • {session.messages?.length || 0} msgs
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={e => handleDeleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Token & Cost Telemetry Widget */}
            <div className="bg-slate-900 text-slate-300 p-4 rounded-xl space-y-2.5 text-xs border border-slate-800">
              <div className="flex items-center justify-between text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                <span className="flex items-center space-x-1">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Advocate AI Usage & Cost</span>
                </span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                  {isDemoMode ? 'Zero Cost (Offline)' : 'Live API'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Tokens</span>
                  <span className="text-sm font-mono font-bold text-white">
                    {totalTokensUsed.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Est. Expense</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    ₹{totalCostINR.toFixed(4)}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                Budget limit: 500,000 tokens/month. Zero hidden fees.
              </p>
            </div>
          </div>

          {/* Right Conversation Canvas */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
            {/* Thread Header Banner */}
            <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-slate-800 truncate">
                  {providerName}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                {isDemoMode ? 'Offline Grounded (Zero Hallucination)' : 'Live Google Gemini'}
              </span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-bold text-slate-800 text-base">
                    {locale === 'hi' ? 'विधिक परामर्श सत्र प्रारंभ करें' : 'Start an Indian Legal Consultation'}
                  </h3>
                  <p className="text-xs max-w-md text-slate-500">
                    Ask questions regarding Section 480/482 BNSS bail grounds, Order 39 interim stay tripartite tests, Section 63 BSA electronic evidence certificates, or Alwar District Court practice.
                  </p>
                </div>
              )}

              {messages.map((m, idx) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id || idx}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-1.5 ${
                        isUser
                          ? 'bg-slate-900 text-white rounded-tr-none'
                          : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] opacity-70 mb-1 border-b border-black/10 pb-1">
                        <span className="font-bold uppercase tracking-wider">
                          {isUser ? 'Advocate' : 'Alwar Practice Intelligence'}
                        </span>
                        <span className="font-mono">
                          {m.tokens ? `${m.tokens} tokens` : ''}
                        </span>
                      </div>

                      <div className="whitespace-pre-wrap font-sans text-xs">
                        {m.content}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Chat Loading State */}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-4 text-xs space-y-2 text-slate-600 max-w-[70%]">
                    <div className="flex items-center space-x-2 text-amber-700 font-semibold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing statutory doctrine & verified citations...</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Cross-referencing Bharatiya Nagarik Suraksha Sanhita, 2023, CPC, and Rajasthan High Court precedents.
                    </p>
                  </div>
                </div>
              )}

              {/* Error & Retry State */}
              {chatError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{chatError}</span>
                  </div>
                  {lastUserPrompt && (
                    <button
                      type="button"
                      onClick={() => handleSendMessage(lastUserPrompt)}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-[11px] transition flex items-center space-x-1 shrink-0"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Follow-Up Prompt Chips */}
            {suggestedPrompts.length > 0 && !chatLoading && (
              <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-200 flex flex-wrap gap-2 text-[11px]">
                <span className="text-slate-400 font-medium py-1">Suggested Next Steps:</span>
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(p)}
                    className="bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 px-2.5 py-1 rounded-full transition flex items-center space-x-1"
                  >
                    <span>{p}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <div className="p-3 border-t border-slate-200 bg-white">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  disabled={chatLoading}
                  placeholder={
                    chatLanguage === 'hi'
                      ? 'विधिक प्रश्न पूछें (उदा. धारा 480 बीएनएसएस जमानत के आधार, अंतरिम रोक)...'
                      : 'Ask Indian legal question (e.g. Regular bail grounds under Sec 480 BNSS, stay checklist)...'
                  }
                  className="flex-1 p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />

                <button
                  type="submit"
                  disabled={chatLoading || !inputMessage.trim()}
                  className="p-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl transition disabled:opacity-50 shadow-sm"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CASE FILE DIAGNOSTIC & TIMELINE */}
      {/* ======================================================== */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Diagnostic Setup Card */}
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
                  <label className="block font-semibold text-slate-700 mb-1">Select Vault Document for Analysis</label>
                  <select
                    value={selectedDocId}
                    onChange={e => handleDocSelect(e.target.value)}
                    className="w-full p-2.5 border rounded-lg bg-white"
                  >
                    <option value="">-- Manual Text / Direct Exhibits --</option>
                    {documents.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.category}) {d.ocr_status === 'completed' ? '✓ Text' : `[${d.ocr_status}]`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Extracted Documentary Text / Exhibits</label>
                <textarea
                  rows={2}
                  value={docsInput}
                  onChange={e => setDocsInput(e.target.value)}
                  className="w-full p-2.5 border rounded-lg font-mono text-[11px]"
                  placeholder="Certified revenue Jamabandi Nakal excerpts, FIR contents, bank return memos..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Case Narrative & Client Allegations</label>
                <textarea
                  rows={3}
                  value={factsInput}
                  onChange={e => setFactsInput(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="State factual narrative, allegations, defence grounds..."
                />
              </div>

              <button
                type="submit"
                disabled={analysisLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg font-semibold shadow-sm transition flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{analysisLoading ? 'Synthesizing Case Dossier...' : 'Run Case File Diagnostic'}</span>
              </button>
            </form>
          </div>

          {analysisError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              {analysisError}
            </div>
          )}

          {/* Diagnostic Output */}
          {analysis && (
            <div className="space-y-6">
              {/* Chronological Event Timeline */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-700" />
                    <span>Chronological Event Timeline</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {analysis.chronology.length} dated events extracted
                  </span>
                </div>

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

              {/* Side-by-Side: Extracted Documentary Facts vs AI Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50/60 p-6 rounded-2xl border border-blue-200 space-y-3 text-xs">
                  <h4 className="font-bold text-blue-900 flex items-center space-x-1.5">
                    <BookOpen className="w-4 h-4 text-blue-700" />
                    <span>Extracted Documentary Facts (Verified Records):</span>
                  </h4>
                  <ul className="space-y-2 text-blue-800">
                    {analysis.keyFacts.map((fact, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-200 space-y-3 text-xs">
                  <h4 className="font-bold text-emerald-900 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span>AI Litigation Hypotheses & Strategic Action:</span>
                  </h4>
                  <ul className="space-y-2 text-emerald-800">
                    {analysis.suggestedActionItems.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Missing Evidence & Contradictions */}
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

              {/* Framed Legal Issues */}
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
      )}
    </div>
  );
}
