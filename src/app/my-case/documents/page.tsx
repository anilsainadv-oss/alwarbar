'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { 
  FileText, Upload, Trash2, Search, Filter, ShieldCheck, 
  Download, Clock, AlertCircle, FileCheck, CheckCircle2 
} from 'lucide-react';
import type { CaseDocument, CaseRecord } from '@/types/mycase';

export default function DocumentsVaultPage() {
  const { t, locale } = useLanguage();
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [uploadModal, setUploadModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Upload Form State
  const [title, setTitle] = useState('');
  const [caseId, setCaseId] = useState('');
  const [category, setCategory] = useState<'pleading' | 'evidence' | 'order' | 'bail' | 'vakalatnama'>('evidence');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
    if (!caseId) {
      setError('Please select a linked case.');
      return;
    }
    if (!title.trim()) {
      setError('Document title is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (selectedFile) {
        // Multipart binary upload
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('case_id', caseId);
        formData.append('title', title.trim());
        formData.append('category', category);

        const res = await fetch('/api/my-case/documents', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
      } else {
        // Fallback metadata-only upload
        const res = await fetch('/api/my-case/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            case_id: caseId,
            title: title.trim(),
            category
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
      }

      setTitle('');
      setSelectedFile(null);
      setUploadModal(false);
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this document from your vault?')) return;
    try {
      const res = await fetch(`/api/my-case/documents?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExtractText = async (docId: string) => {
    setExtractingId(docId);
    try {
      const res = await fetch('/api/my-case/documents/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Text extraction failed');
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Extraction error');
    } finally {
      setExtractingId(null);
    }
  };

  const filtered = documents.filter(d => {
    const matchesCat = categoryFilter === 'ALL' || d.category === categoryFilter;
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-200">
        <div>
          <h1 className="font-serif font-bold text-2xl text-slate-900">
            {locale === 'hi' ? 'दस्तावेज़ तिजोरी (केस अभिलेख)' : 'Private Document Vault'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Confidential pleadings, certified judicial orders, and evidence exhibits.
          </p>
        </div>
        <button
          onClick={() => {
            setError('');
            setUploadModal(true);
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents by title..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'evidence', 'pleading', 'order', 'bail', 'vakalatnama'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium uppercase transition whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-amber-300 font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-700 text-sm">No Documents in Vault</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload certified orders, affidavits, vakalatnamas, or evidence exhibits linked to your active court matters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(doc => {
            const linkedCase = cases.find(c => c.id === doc.case_id);
            const isOcrCompleted = doc.ocr_status === 'completed';

            return (
              <div key={doc.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">{doc.title}</h3>
                      {linkedCase && (
                        <div className="text-[11px] text-slate-500 font-medium">
                          Case: <span className="text-slate-800">{linkedCase.case_title}</span> ({linkedCase.case_number || 'Docket'})
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-slate-400 hover:text-red-600 transition p-1"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 text-[10px]">
                    <span className="uppercase font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                      {doc.category}
                    </span>
                    {doc.file_size_bytes > 0 && (
                      <span className="font-mono text-slate-400">
                        {(doc.file_size_bytes / 1024).toFixed(0)} KB
                      </span>
                    )}
                    {doc.ocr_status === 'completed' && (
                      <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Text Indexed</span>
                      </span>
                    )}
                    {doc.ocr_status === 'pending' && (
                      <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                        <Clock className="w-3 h-3" />
                        <span>Text Pending</span>
                      </span>
                    )}
                    {doc.ocr_status === 'unsupported' && (
                      <span className="inline-flex items-center space-x-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-medium" title="Scanned image without active OCR provider">
                        <AlertCircle className="w-3 h-3" />
                        <span>Scanned (OCR Off)</span>
                      </span>
                    )}
                  </div>

                  {doc.extracted_text && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-600 font-devanagari leading-relaxed max-h-20 overflow-y-auto">
                      {doc.extracted_text}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-2">
                    {doc.ocr_status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => handleExtractText(doc.id)}
                        disabled={extractingId === doc.id}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>{extractingId === doc.id ? 'Extracting...' : 'Extract Text'}</span>
                      </button>
                    )}
                    <a
                      href={`/api/my-case/documents/download?id=${doc.id}`}
                      download
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-900 font-serif">
              Upload Confidential Document
            </h3>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Link to Court Matter</label>
                <select
                  value={caseId}
                  onChange={e => setCaseId(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                >
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.case_title} ({c.court_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Document Title</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="e.g. Certified Order Copy / Vakalatnama"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Document Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full p-2 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="pleading">Pleading / Plaint / Written Statement</option>
                  <option value="evidence">Evidence / Revenue Document</option>
                  <option value="order">Judicial Order / Judgment Copy</option>
                  <option value="bail">Bail Application / Bond</option>
                  <option value="vakalatnama">Vakalatnama / Memo of Appearance</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Select File (PDF, DOCX, PNG, JPG — Max 25 MB)</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      if (!title) {
                        setTitle(file.name.replace(/\.[^/.]+$/, ''));
                      }
                    }
                  }}
                  className="w-full p-2 border rounded-lg bg-slate-50 text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-amber-300 hover:file:bg-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModal(false)}
                  disabled={loading}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg font-semibold transition"
                >
                  {loading ? 'Uploading...' : 'Save to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
