'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Shield, Plus, CheckCircle2, Trash2, Bell, 
  ExternalLink, Calendar, Edit3, X, Award, FileText,
  Search, Download, Check, AlertCircle, ChevronLeft, ChevronRight,
  Filter, Users, RefreshCw, Layers
} from 'lucide-react';
import type { WelfareScheme, WelfareBulletin } from '@/types/database';

const ALL_BAR_NAMES = [
  'ALWAR',
  'BANSUR',
  'BEHROR',
  'BEHROR (BAR)',
  'BHIWADI',
  'KATHUMAR',
  'KHERLI MANDI',
  'KISHANGARH BAS',
  'KOTKASIM',
  'LAXMANGARH',
  'MALAKHERA',
  'MUNDAWAR',
  'NEEMRANA',
  'RAJGARH',
  'RAMGARH',
  'TAPUKARA',
  'THANAGAZI',
  'TIJARA'
];

export default function AdminWelfarePage() {
  const [schemes, setSchemes] = useState<WelfareScheme[]>([]);
  const [bulletins, setBulletins] = useState<WelfareBulletin[]>([]);
  const [activeTab, setActiveTab] = useState<'schemes' | 'bulletins' | 'dues'>('schemes');

  // BCR Welfare Dues Register State
  const [duesRecords, setDuesRecords] = useState<Array<{
    s_no: number;
    enrol_no: string;
    elc_no: string;
    name: string;
    due_subs: string;
    ltm_subs: string;
    category: 'ltm' | 'dues_pending' | 'na' | 'termi' | 'other';
    bar?: string;
  }>>([]);
  const [selectedBar, setSelectedBar] = useState('ALWAR');
  const [duesLoading, setDuesLoading] = useState(false);
  const [duesSearch, setDuesSearch] = useState('');
  const [duesCategory, setDuesCategory] = useState('ALL');
  const [duesPage, setDuesPage] = useState(1);
  const [duesTotalPages, setDuesTotalPages] = useState(1);
  const [duesTotalMatching, setDuesTotalMatching] = useState(0);
  const [duesSummary, setDuesSummary] = useState<{
    total: number;
    ltm_count: number;
    na_count: number;
    dues_pending_count: number;
    termi_count: number;
  }>({ total: 3120, ltm_count: 802, na_count: 1998, dues_pending_count: 296, termi_count: 24 });
  const [allBarsSummary, setAllBarsSummary] = useState<Record<string, {
    bar_name: string;
    bar_slug: string;
    total_advocates: number;
    ltm_count: number;
    dues_pending_count: number;
    na_count: number;
    termi_count: number;
    pdf_download_url: string;
  }>>({});
  const [currentBarPdfUrl, setCurrentBarPdfUrl] = useState<string>('/downloads/bcr-alwar-rawf-dues-list.pdf');

  // Scheme Modal
  const [schemeModalOpen, setSchemeModalOpen] = useState(false);
  const [titleEn, setTitleEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [authority, setAuthority] = useState('Bar Council of Rajasthan (Welfare Trustee Committee)');
  const [sourceUrl, setSourceUrl] = useState('https://barcouncilofrajasthan.org/circular/rajasthan-advocates-welfare-fund');
  const [category, setCategory] = useState<'retirement' | 'medical' | 'stipend' | 'emergency' | 'disability' | 'local_benevolent' | 'maternity'>('retirement');
  const [maxBenefitAmount, setMaxBenefitAmount] = useState('Up to ₹10,00,000');
  const [statusBadge, setStatusBadge] = useState('Active Statutory Scheme');
  const [eligibility, setEligibility] = useState('');
  const [benefits, setBenefits] = useState('');
  const [applicationProcess, setApplicationProcess] = useState('');
  const [deadline, setDeadline] = useState('Annual: 31st March');

  // Bulletin Modal
  const [bulletinModalOpen, setBulletinModalOpen] = useState(false);
  const [bulletinTitleEn, setBulletinTitleEn] = useState('');
  const [bulletinTitleHi, setBulletinTitleHi] = useState('');
  const [bulletinCategory, setBulletinCategory] = useState<'circular' | 'deadline' | 'disbursement' | 'stamp_rate'>('circular');
  const [bulletinImportant, setBulletinImportant] = useState(true);
  const [bulletinSummaryEn, setBulletinSummaryEn] = useState('');
  const [bulletinSummaryHi, setBulletinSummaryHi] = useState('');
  const [bulletinLink, setBulletinLink] = useState('https://barcouncilofrajasthan.org/circular/rajasthan-advocates-welfare-fund');

  const [message, setMessage] = useState('');

  const loadData = () => {
    fetch('/api/admin/public/welfare')
      .then(r => r.json())
      .then(data => {
        if (data.schemes) setSchemes(data.schemes);
        if (data.bulletins) setBulletins(data.bulletins);
      })
      .catch(console.error);
  };

  const fetchDuesData = async (
    page = duesPage,
    search = duesSearch,
    cat = duesCategory,
    bar = selectedBar
  ) => {
    setDuesLoading(true);
    try {
      const url = `/api/public/welfare/dues?bar=${encodeURIComponent(bar)}&page=${page}&limit=25&q=${encodeURIComponent(search)}&category=${cat}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDuesRecords(data.records || []);
        setDuesTotalPages(data.total_pages || 1);
        setDuesTotalMatching(data.total_matching || 0);
        if (data.summary) setDuesSummary(data.summary);
        if (data.all_bars_summary) setAllBarsSummary(data.all_bars_summary);
        if (data.pdf_download_url) setCurrentBarPdfUrl(data.pdf_download_url);
      }
    } catch (err) {
      console.error('Error fetching dues:', err);
    } finally {
      setDuesLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'dues') {
        setActiveTab('dues');
      } else if (tabParam === 'bulletins') {
        setActiveTab('bulletins');
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'dues') {
      fetchDuesData(duesPage, duesSearch, duesCategory, selectedBar);
    }
  }, [activeTab, selectedBar, duesPage, duesCategory]);

  const handleCreateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/public/welfare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title_en: titleEn,
          title_hi: titleHi,
          issuing_authority: authority,
          official_source_url: sourceUrl,
          category,
          max_benefit_amount: maxBenefitAmount,
          status_badge: statusBadge,
          eligibility_criteria: eligibility,
          benefits_summary: benefits,
          application_process: applicationProcess,
          deadline,
          document_checklist: ['Enrolment Certificate Copy', 'Bar Continuity Certificate', 'Nominee Form']
        })
      });
      if (res.ok) {
        setMessage('Welfare scheme published successfully!');
        setTimeout(() => setMessage(''), 3000);
        setSchemeModalOpen(false);
        // Reset form
        setTitleEn('');
        setTitleHi('');
        setBenefits('');
        setEligibility('');
        setApplicationProcess('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBulletin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/public/welfare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bulletin',
          title_en: bulletinTitleEn,
          title_hi: bulletinTitleHi,
          category: bulletinCategory,
          important: bulletinImportant,
          summary_en: bulletinSummaryEn,
          summary_hi: bulletinSummaryHi,
          official_link: bulletinLink
        })
      });
      if (res.ok) {
        setMessage('Live welfare bulletin broadcasted successfully!');
        setTimeout(() => setMessage(''), 3000);
        setBulletinModalOpen(false);
        setBulletinTitleEn('');
        setBulletinTitleHi('');
        setBulletinSummaryEn('');
        setBulletinSummaryHi('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteScheme = async (id: string) => {
    if (!confirm('Are you sure you want to delete this welfare scheme?')) return;
    try {
      const res = await fetch(`/api/admin/public/welfare?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('Scheme deleted successfully.');
        setTimeout(() => setMessage(''), 2500);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <Link
        href="/public-admin/dashboard"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Portal Admin</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-200">
        <div>
          <h1 className="font-serif font-bold text-2xl text-slate-900">
            Advocate Welfare & Live Bulletins Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Publish statutory Rajasthan Advocates Welfare Fund rules, application guidelines, and live Trustee Committee circulars.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setBulletinModalOpen(true)}
            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Post Live Circular</span>
          </button>

          <button
            onClick={() => setSchemeModalOpen(true)}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Welfare Scheme</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* TABS */}
      <div className="flex border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('schemes')}
          className={`pb-3 px-4 border-b-2 transition ${
            activeTab === 'schemes'
              ? 'border-blue-700 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Welfare Schemes ({schemes.length})
        </button>
        <button
          onClick={() => setActiveTab('bulletins')}
          className={`pb-3 px-4 border-b-2 transition flex items-center space-x-1.5 ${
            activeTab === 'bulletins'
              ? 'border-amber-600 text-amber-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span>Live Circulars & Bulletins ({bulletins.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('dues')}
          className={`pb-3 px-4 border-b-2 transition flex items-center space-x-1.5 ${
            activeTab === 'dues'
              ? 'border-purple-700 text-purple-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-purple-600" />
          <span>BCR Welfare Dues Register (18 Bar Associations)</span>
        </button>
      </div>

      {/* TAB 1: SCHEMES LIST */}
      {activeTab === 'schemes' && (
        <div className="space-y-4">
          {schemes.map(s => (
            <div key={s.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                      {s.category || 'Retirement'}
                    </span>
                    {s.status_badge && (
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                        {s.status_badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mt-1">{s.title_en}</h3>
                  <div className="text-slate-500 font-devanagari text-[11px]">{s.title_hi}</div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="font-serif font-bold text-blue-700 text-xs">{s.max_benefit_amount}</span>
                  <button
                    onClick={() => handleDeleteScheme(s.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete Scheme"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                <strong>Benefits:</strong> {s.benefits_summary}
              </p>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                <span>Authority: {s.issuing_authority}</span>
                <span>Deadline: {s.deadline || 'Ongoing'}</span>
                <span>Last Verified: {s.last_verified_date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: LIVE BULLETINS LIST */}
      {activeTab === 'bulletins' && (
        <div className="space-y-4">
          {bulletins.map(b => (
            <div key={b.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
                    {b.category}
                  </span>
                  {b.important && (
                    <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">
                      IMPORTANT NOTICE
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{b.date}</span>
              </div>

              <h3 className="font-bold text-sm text-slate-900">{b.title_en}</h3>
              <div className="text-slate-600 font-devanagari text-xs">{b.title_hi}</div>

              <p className="text-slate-700 bg-amber-50/50 p-2.5 rounded border border-amber-100">
                {b.summary_en}
              </p>

              <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
                <span>Issued by: {b.authority}</span>
                {b.official_link && (
                  <a href={b.official_link} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline inline-flex items-center space-x-1">
                    <span>Source Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: BCR WELFARE DUES REGISTER TABLE */}
      {activeTab === 'dues' && (
        <div className="space-y-6">
          {/* Controls Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-purple-700" />
                  <span>Bar Council of Rajasthan (RAWF) Welfare Dues Register</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official statutory dues records across all 18 Bar Associations under District & Sessions Judgeship, Alwar.
                </p>
              </div>

              {currentBarPdfUrl && (
                <a
                  href={currentBarPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 self-start md:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {selectedBar} Official PDF</span>
                </a>
              )}
            </div>

            {/* Filter Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
              {/* Bar Selector (4 cols) */}
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Select Bar Association (18 Bars)
                </label>
                <select
                  value={selectedBar}
                  onChange={(e) => {
                    setSelectedBar(e.target.value);
                    setDuesPage(1);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  {ALL_BAR_NAMES.map((b) => (
                    <option key={b} value={b}>
                      {b} Bar Association {allBarsSummary[b] ? `(${allBarsSummary[b].total_advocates} Adv.)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter (3 cols) */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Dues Status Filter
                </label>
                <select
                  value={duesCategory}
                  onChange={(e) => {
                    setDuesCategory(e.target.value);
                    setDuesPage(1);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="ALL">All Categories</option>
                  <option value="dues_pending">⚠️ Dues Pending Only</option>
                  <option value="ltm">⭐ Life Time Members (LTM)</option>
                  <option value="na">✓ N.A.* (Current / No Dues)</option>
                  <option value="termi">✕ Terminated</option>
                </select>
              </div>

              {/* Search Bar (5 cols) */}
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Search Advocate / Sanad
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setDuesPage(1);
                    fetchDuesData(1, duesSearch, duesCategory, selectedBar);
                  }}
                  className="relative"
                >
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={duesSearch}
                    onChange={(e) => setDuesSearch(e.target.value)}
                    placeholder="Search name, R/331/1977, ELC..."
                    className="w-full pl-8 pr-16 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 px-2.5 py-1 bg-slate-900 text-white rounded text-[10px] font-semibold hover:bg-slate-800"
                  >
                    Filter
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Summary Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Advocates</span>
              <div className="text-xl font-bold font-serif text-slate-900">{duesSummary.total.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500">{selectedBar} Bar Roll</span>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-800">Dues Pending</span>
              <div className="text-xl font-bold font-serif text-amber-900">{duesSummary.dues_pending_count.toLocaleString()}</div>
              <span className="text-[10px] text-amber-700 font-medium">बकायादार अधिवक्ता</span>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase text-purple-800">Life Time Members</span>
              <div className="text-xl font-bold font-serif text-purple-900">{duesSummary.ltm_count.toLocaleString()}</div>
              <span className="text-[10px] text-purple-700 font-medium">LTM Subscribed</span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Current / No Dues</span>
              <div className="text-xl font-bold font-serif text-emerald-900">{duesSummary.na_count.toLocaleString()}</div>
              <span className="text-[10px] text-emerald-700 font-medium">N.A.* No Dues Clear</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">Terminated</span>
              <div className="text-xl font-bold font-serif text-slate-800">{duesSummary.termi_count.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500 font-medium">Terminated Roll</span>
            </div>
          </div>

          {/* Interactive Dues Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="font-semibold text-slate-800">
                Official Register: <strong>{selectedBar} Bar Association</strong> •{' '}
                <span className="text-slate-500">Matching Records: {duesTotalMatching.toLocaleString()}</span>
              </div>
              <button
                onClick={() => fetchDuesData(duesPage, duesSearch, duesCategory, selectedBar)}
                disabled={duesLoading}
                className="inline-flex items-center space-x-1 text-slate-600 hover:text-slate-900 font-medium self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${duesLoading ? 'animate-spin text-purple-700' : ''}`} />
                <span>Refresh List</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold text-center w-12">#</th>
                    <th className="py-2.5 px-3 font-semibold">Enrolment No.</th>
                    <th className="py-2.5 px-3 font-semibold text-center">ELC No.</th>
                    <th className="py-2.5 px-3 font-semibold">Advocate Name</th>
                    <th className="py-2.5 px-3 font-semibold">Bar Association</th>
                    <th className="py-2.5 px-3 font-semibold text-center">RAWF Dues Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {duesLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin text-purple-700 mx-auto mb-2" />
                        <div>Loading {selectedBar} dues records...</div>
                      </td>
                    </tr>
                  ) : duesRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No advocate dues records match the criteria.
                      </td>
                    </tr>
                  ) : (
                    duesRecords.map((r) => (
                      <tr key={r.s_no} className="hover:bg-purple-50/40 transition">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-medium">
                          #{r.s_no}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {r.enrol_no}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {r.elc_no || '-'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {r.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {r.bar || selectedBar}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {r.category === 'dues_pending' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <AlertCircle className="w-3 h-3 mr-1 text-amber-700 shrink-0" />
                              <span>₹{r.due_subs} Pending</span>
                            </span>
                          ) : r.category === 'ltm' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-900 border border-purple-200">
                              <span>⭐ LTM (Life Time Member)</span>
                            </span>
                          ) : r.category === 'na' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Check className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                              <span>N.A.* Current / No Dues</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              <span>{r.due_subs || 'Terminated'}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {duesTotalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 border-t border-slate-200 text-xs">
                <div className="text-slate-600 font-medium">
                  Showing <strong>{((duesPage - 1) * 25) + 1}</strong> to{' '}
                  <strong>{Math.min(duesPage * 25, duesTotalMatching)}</strong> of{' '}
                  <strong>{duesTotalMatching.toLocaleString()}</strong> advocates in {selectedBar}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setDuesPage((p) => Math.max(1, p - 1))}
                    disabled={duesPage <= 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 font-semibold transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <span className="px-3 py-1.5 rounded-lg bg-purple-900 text-white font-bold font-mono">
                    {duesPage} / {duesTotalPages}
                  </span>

                  <button
                    onClick={() => setDuesPage((p) => Math.min(duesTotalPages, p + 1))}
                    disabled={duesPage >= duesTotalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 font-semibold transition"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD SCHEME */}
      {schemeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 text-slate-900 border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base text-slate-900 font-serif">Add Welfare Scheme</h3>
              <button onClick={() => setSchemeModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateScheme} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="retirement">Retirement & Death (₹10L)</option>
                    <option value="medical">Group Mediclaim (₹5L)</option>
                    <option value="stipend">Young Advocate Stipend (₹5K/mo)</option>
                    <option value="emergency">Critical Illness (₹2L)</option>
                    <option value="disability">Accident Insurance (₹10L)</option>
                    <option value="local_benevolent">Alwar Bar Distress Fund</option>
                    <option value="maternity">Women Advocate Maternity</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Max Benefit Amount</label>
                  <input
                    type="text"
                    value={maxBenefitAmount}
                    onChange={e => setMaxBenefitAmount(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="e.g. Up to ₹10,00,000"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Title (English)</label>
                <input
                  required
                  type="text"
                  value={titleEn}
                  onChange={e => setTitleEn(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. Rajasthan Advocates Emergency Distress Relief"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Title (Hindi)</label>
                <input
                  required
                  type="text"
                  value={titleHi}
                  onChange={e => setTitleHi(e.target.value)}
                  className="w-full p-2 border rounded font-devanagari"
                  placeholder="राजस्थान अधिवक्ता आपातकालीन सहायता योजना"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Issuing Authority</label>
                  <input
                    type="text"
                    value={authority}
                    onChange={e => setAuthority(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Deadline / Renewal</label>
                  <input
                    type="text"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Benefits Summary</label>
                <textarea
                  required
                  rows={2}
                  value={benefits}
                  onChange={e => setBenefits(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Details of financial assistance and payment modes..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Eligibility Criteria</label>
                <textarea
                  required
                  rows={2}
                  value={eligibility}
                  onChange={e => setEligibility(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Who can apply..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Application Process</label>
                <textarea
                  required
                  rows={2}
                  value={applicationProcess}
                  onChange={e => setApplicationProcess(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Steps to apply..."
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button type="button" onClick={() => setSchemeModalOpen(false)} className="px-3 py-1.5 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-blue-700 text-white rounded font-semibold">
                  Publish Scheme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD LIVE BULLETIN */}
      {bulletinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-900 border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center space-x-1.5">
                <Bell className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900 font-serif">Post Live Welfare Circular</h3>
              </div>
              <button onClick={() => setBulletinModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBulletin} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={bulletinCategory}
                    onChange={e => setBulletinCategory(e.target.value as any)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="stamp_rate">Stamp Duty Rate / Compliance</option>
                    <option value="deadline">Deadline Extension</option>
                    <option value="disbursement">Disbursement Announcement</option>
                    <option value="circular">General Trustee Circular</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Priority</label>
                  <label className="flex items-center space-x-2 p-2 border rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bulletinImportant}
                      onChange={e => setBulletinImportant(e.target.checked)}
                      className="accent-amber-600"
                    />
                    <span className="font-semibold text-amber-900">Mark as High Priority</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Circular Title (English)</label>
                <input
                  required
                  type="text"
                  value={bulletinTitleEn}
                  onChange={e => setBulletinTitleEn(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. Welfare Stamp Verification Drive in Alwar"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Circular Title (Hindi)</label>
                <input
                  required
                  type="text"
                  value={bulletinTitleHi}
                  onChange={e => setBulletinTitleHi(e.target.value)}
                  className="w-full p-2 border rounded font-devanagari"
                  placeholder="अलवर में कल्याण कोष स्टाम्प सत्यापन अभियान"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Summary (English)</label>
                <textarea
                  required
                  rows={2}
                  value={bulletinSummaryEn}
                  onChange={e => setBulletinSummaryEn(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Summary of circular instructions..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Summary (Hindi)</label>
                <textarea
                  required
                  rows={2}
                  value={bulletinSummaryHi}
                  onChange={e => setBulletinSummaryHi(e.target.value)}
                  className="w-full p-2 border rounded font-devanagari"
                  placeholder="परिपत्र के मुख्य बिंदु..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Official Notification URL</label>
                <input
                  type="url"
                  value={bulletinLink}
                  onChange={e => setBulletinLink(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="http://barcouncilofrajasthan.org"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button type="button" onClick={() => setBulletinModalOpen(false)} className="px-3 py-1.5 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold">
                  Broadcast Live Circular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
