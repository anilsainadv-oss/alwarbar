'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Shield, Plus, CheckCircle2, Trash2, Bell, 
  ExternalLink, Calendar, Edit3, X, Award, FileText
} from 'lucide-react';
import type { WelfareScheme, WelfareBulletin } from '@/types/database';

export default function AdminWelfarePage() {
  const [schemes, setSchemes] = useState<WelfareScheme[]>([]);
  const [bulletins, setBulletins] = useState<WelfareBulletin[]>([]);
  const [activeTab, setActiveTab] = useState<'schemes' | 'bulletins'>('schemes');

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

  useEffect(() => {
    loadData();
  }, []);

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
