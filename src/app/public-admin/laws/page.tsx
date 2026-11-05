'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Plus, CheckCircle2 } from 'lucide-react';
import type { LegalUpdate } from '@/types/database';

export default function AdminLawsPage() {
  const [laws, setLaws] = useState<LegalUpdate[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [titleEn, setTitleEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [category, setCategory] = useState<'central_law' | 'rajasthan_act' | 'hc_judgment' | 'sc_judgment'>('central_law');
  const [actName, setActName] = useState('');
  const [citation, setCitation] = useState('');
  const [summaryEn, setSummaryEn] = useState('');
  const [summaryHi, setSummaryHi] = useState('');
  const [sourceUrl, setSourceUrl] = useState('https://www.indiacode.nic.in');
  const [message, setMessage] = useState('');

  const loadData = () => {
    fetch('/api/admin/public/laws')
      .then(r => r.json())
      .then(data => {
        if (data.laws) setLaws(data.laws);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/admin/public/laws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title_en: titleEn,
          title_hi: titleHi,
          category,
          act_or_case_name: actName,
          citation,
          summary_en: summaryEn,
          summary_hi: summaryHi,
          official_source_url: sourceUrl,
          key_sections: ['Key Section']
        })
      });
      setMessage('Legal digest published successfully!');
      setTimeout(() => setMessage(''), 2500);
      setModalOpen(false);
      loadData();
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

      <div className="flex items-center justify-between border-b pb-4 border-slate-200">
        <div>
          <h1 className="font-serif font-bold text-2xl text-slate-900">
            Laws, Acts & Precedents Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Publish verified statutory digests of Central Acts (BNS, BNSS, BSA) and Rajasthan High Court decisions.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Publish New Law/Judgment</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      <div className="space-y-4">
        {laws.map(l => (
          <div key={l.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">{l.title_en}</span>
              <span className="bg-blue-50 text-blue-800 font-semibold px-2 py-0.5 rounded text-[10px] uppercase font-mono">
                {l.category}
              </span>
            </div>
            <div className="text-slate-500 font-devanagari">{l.title_hi}</div>
            <p className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100">
              {l.summary_en}
            </p>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-900 border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-base text-slate-900 font-serif">Publish Law / Precedent</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Title (English)</label>
                <input
                  required
                  type="text"
                  value={titleEn}
                  onChange={e => setTitleEn(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. Criminal Appeal on Bail Guidelines"
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
                  placeholder="दांडिक अपील पर जमानत दिशा-निर्देश"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="central_law">Central Law (BNS/BNSS)</option>
                    <option value="rajasthan_act">Rajasthan State Act</option>
                    <option value="hc_judgment">Rajasthan High Court</option>
                    <option value="sc_judgment">Supreme Court</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Citation / Act No.</label>
                  <input
                    type="text"
                    value={citation}
                    onChange={e => setCitation(e.target.value)}
                    className="w-full p-2 border rounded font-mono"
                    placeholder="2025 (1) RLR 342"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Act / Case Name</label>
                <input
                  required
                  type="text"
                  value={actName}
                  onChange={e => setActName(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. Ramhet v. State of Rajasthan"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Practical Summary (English)</label>
                <textarea
                  required
                  rows={2}
                  value={summaryEn}
                  onChange={e => setSummaryEn(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Practical Summary (Hindi)</label>
                <textarea
                  required
                  rows={2}
                  value={summaryHi}
                  onChange={e => setSummaryHi(e.target.value)}
                  className="w-full p-2 border rounded font-devanagari"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1.5 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-blue-700 text-white rounded font-semibold">
                  Publish Digest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
