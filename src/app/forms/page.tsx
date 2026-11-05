'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { FileText, Download, AlertCircle, CheckCircle, ShieldAlert, Search } from 'lucide-react';
import type { LegalForm } from '@/types/database';

export default function LegalFormsPage() {
  const { t, locale } = useLanguage();
  const [forms, setForms] = useState<LegalForm[]>([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [downloadModal, setDownloadModal] = useState<LegalForm | null>(null);

  useEffect(() => {
    fetch('/api/public/search')
      .then(res => res.json())
      .then(data => {
        if (data.forms) setForms(data.forms);
      })
      .catch(console.error);
  }, []);

  const categories = ['ALL', 'criminal', 'civil', 'commercial', 'revenue', 'affidavit'];

  const filtered = forms.filter(f => {
    const matchesCat = activeCategory === 'ALL' || f.category === activeCategory;
    const matchesSearch = 
      f.title_en.toLowerCase().includes(search.toLowerCase()) ||
      f.title_hi.toLowerCase().includes(search.toLowerCase()) ||
      (f.description_en && f.description_en.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleDownload = (form: LegalForm) => {
    // Increment download counter
    fetch(`/api/public/forms/download?id=${form.id}`, { method: 'POST' }).catch(() => {});
    
    // Generate simulated download file with standard text content
    const sampleText = `${form.title_en.toUpperCase()}\n\n` +
      `Source: ${form.source_name}\n` +
      `Notice: ${form.disclaimer || 'Court practice standard format'}\n\n` +
      `--------------------------------------------------------------------------------\n` +
      `BEFORE THE COMPETENT COURT AT ALWAR, RAJASTHAN\n\n` +
      `IN THE MATTER OF:\n` +
      `...Applicant / Petitioner\n` +
      `VERSUS\n` +
      `...Respondent / Non-Applicant\n\n` +
      `[Insert standard grounds and factual narrative as required by individual case]\n\n` +
      `DATED: ${new Date().toLocaleDateString()}\nPLACE: Alwar\n\nADVOCATE FOR APPLICANT\n`;

    const blob = new Blob([sampleText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${form.title_en.toLowerCase().replace(/[^a-z0-9]/g, '_')}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadModal(null);
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl space-y-8">
      {/* Title Header */}
      <div className="border-b pb-6 border-slate-200">
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
          <FileText className="w-4 h-4" />
          <span>Litigation Draft Formats</span>
        </div>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-slate-900">
          {locale === 'hi' ? 'विधिक प्रारूप एवं न्यायालयी आवेदन संग्रह' : 'Legal Forms, Petitions & Practice Templates'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
          Standard litigation templates formulated in conformity with the Bharatiya Nagarik Suraksha Sanhita (BNSS), Rajasthan Civil Court Rules, and Rajasthan Tenancy practice.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search forms (e.g. 'Bail', 'Injunction', 'Cheque Notice')..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium uppercase transition ${
                activeCategory === cat
                  ? 'bg-emerald-700 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(form => (
          <div
            key={form.id}
            id={form.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:border-emerald-500 transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded">
                  {form.category}
                </span>
                <span className="text-[10px] text-slate-400">
                  {form.downloads_count} downloads
                </span>
              </div>

              <h2 className="font-serif font-bold text-lg text-slate-900 leading-snug">
                {locale === 'hi' ? form.title_hi : form.title_en}
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed">
                {locale === 'hi' ? form.description_hi : form.description_en}
              </p>

              {form.disclaimer && (
                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200/80 text-[11px] text-amber-800 flex items-start space-x-2">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span>{form.disclaimer}</span>
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase">
                Format: .{form.file_format}
              </span>
              <button
                onClick={() => setDownloadModal(form)}
                className="px-4 py-2 bg-slate-900 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Template</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Download Confirmation & Disclaimer Modal */}
      {downloadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200">
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">
              Confirm Form Download
            </h3>
            <p className="text-xs font-semibold text-emerald-800 mb-2">
              {downloadModal.title_en}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              This document is provided as a standard procedural template. The practicing advocate must independently verify facts, dates, court fees, and applicable local rules before court presentation.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => setDownloadModal(null)}
                className="px-3 py-1.5 border rounded-lg text-xs text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDownload(downloadModal)}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Agree & Download (.docx)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
