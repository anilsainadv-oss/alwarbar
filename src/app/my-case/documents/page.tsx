'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { FileText, Upload, Trash2, Search, Filter, ShieldCheck, CheckCircle } from 'lucide-react';
import type { CaseDocument, CaseRecord } from '@/types/mycase';

export default function DocumentsVaultPage() {
  const { t, locale } = useLanguage();
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [uploadModal, setUploadModal] = useState(false);

  // Upload Form
  const [title, setTitle] = useState('');
  const [caseId, setCaseId] = useState('');
  const [category, setCategory] = useState<'pleading' | 'evidence' | 'order' | 'bail'>('evidence');
  const [extractedText, setExtractedText] = useState('');

  const loadData = () => {
    fetch('/api/my-case/documents')
      .then(r => r.json())
      .then(data => {
        if (data.documents) setDocuments(data.documents);
      })
      .catch(console.error);

    fetch('/api/my-case/cases')
      .then(r => r.json())
      .then(data => {
        if (data.cases) {
          setCases(data.cases);
          if (!caseId && data.cases.length > 0) setCaseId(data.cases[0].id);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/my-case/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          title,
          category,
          extracted_text: extractedText || 'Uploaded into private advocate vault.'
        })
      });
      setTitle('');
      setExtractedText('');
      setUploadModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this document from your vault?')) return;
    try {
      await fetch(`/api/my-case/documents?id=${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = documents.filter(d => {
    const matchesCat = categoryFilter === 'ALL' || d.category === categoryFilter;
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
            <FileText className="w-4 h-4" />
            <span>Encrypted Case Vault</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
            {locale === 'hi' ? 'दस्तावेज़ तिजोरी (केस अभिलेख)' : 'Private Document Vault & OCR Viewer'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strictly private document repository for pleadings, revenue nakals, bail bonds, and court orders.
          </p>
        </div>

        <button
          onClick={() => setUploadModal(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Case Document</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search document title or keywords..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          {['ALL', 'evidence', 'pleading', 'order', 'bail'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase transition ${
                categoryFilter === cat
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(doc => (
          <div key={doc.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{doc.title}</h3>
                <span className="text-[10px] uppercase font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {doc.category}
                </span>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                className="text-slate-400 hover:text-red-600"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {doc.extracted_text && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700 font-devanagari leading-relaxed max-h-24 overflow-y-auto">
                {doc.extracted_text}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Added: {new Date(doc.created_at).toLocaleDateString()}</span>
              <span className="text-emerald-700 flex items-center space-x-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Protected</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-900 font-serif">Upload Document to Vault</h3>
            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Select Linked Case</label>
                <select
                  value={caseId}
                  onChange={e => setCaseId(e.target.value)}
                  className="w-full p-2 border rounded bg-white"
                >
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.case_title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Document Title</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. Certified Copy of Interim Injunction Order"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="pleading">Pleading / Application</option>
                  <option value="evidence">Evidence / Revenue Record</option>
                  <option value="order">Judicial Order</option>
                  <option value="bail">Bail Paper / Vakalatnama</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Extracted Text / OCR Summary</label>
                <textarea
                  rows={3}
                  value={extractedText}
                  onChange={e => setExtractedText(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Paste or enter notes on document contents..."
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button type="button" onClick={() => setUploadModal(false)} className="px-3 py-1.5 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 text-amber-300 rounded font-semibold">
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
