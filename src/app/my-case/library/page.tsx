'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Bookmark, Plus, Search, BookOpen, ExternalLink, ShieldCheck } from 'lucide-react';
import type { PersonalLibraryItem } from '@/types/mycase';

export default function PersonalLibraryPage() {
  const { t, locale } = useLanguage();
  const [items, setItems] = useState<PersonalLibraryItem[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Criminal Law');
  const [citation, setCitation] = useState('');
  const [notes, setNotes] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  const loadData = () => {
    fetch('/api/my-case/library')
      .then(r => r.json())
      .then(data => {
        if (data.items) setItems(data.items);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/my-case/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          citation,
          notes,
          source_url: sourceUrl || undefined
        })
      });
      setTitle('');
      setCitation('');
      setNotes('');
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = items.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    (i.citation && i.citation.toLowerCase().includes(search.toLowerCase())) ||
    (i.notes && i.notes.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
            <Bookmark className="w-4 h-4" />
            <span>Private Legal Knowledge Vault</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
            {locale === 'hi' ? 'निजी विधिक पुस्तकालय (लाइब्रेरी)' : 'Personal Legal Library & Citations'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your private repository of saved High Court rulings, practice notes, and custom drafting clauses.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Bookmark Precedent / Note</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search saved precedents, citations..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(item => (
          <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900">{item.title}</h3>
                <span className="text-[10px] font-mono text-amber-800 font-semibold">{item.citation}</span>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase font-medium">
                {item.category}
              </span>
            </div>

            {item.notes && (
              <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700 leading-relaxed">
                {item.notes}
              </p>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Saved on: {new Date(item.created_at).toLocaleDateString()}</span>
              {item.source_url && (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline flex items-center space-x-1 font-medium"
                >
                  <span>Law Report Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-base text-slate-900 font-serif">Save Precedent / Legal Note</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Title / Legal Proposition</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. Co-sharer right to maintain possession before partition"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option>Criminal Law (BNSS/BNS)</option>
                    <option>Revenue Law (Rajasthan Tenancy)</option>
                    <option>Civil Procedure & Injunctions</option>
                    <option>Commercial / NI Act</option>
                    <option>Constitutional & Writs</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Citation (AIR / SCC / RLR)</label>
                  <input
                    type="text"
                    value={citation}
                    onChange={e => setCitation(e.target.value)}
                    className="w-full p-2 border rounded font-mono"
                    placeholder="2025 (1) RLR 342 (HC)"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Legal Ratio & Key Paragraphs</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Summarize key ratio decidendi or argument formulation..."
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Source URL (Optional)</label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={e => setSourceUrl(e.target.value)}
                  className="w-full p-2 border rounded font-mono"
                  placeholder="https://hcraj.nic.in/..."
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1.5 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 text-amber-300 rounded font-semibold">
                  Bookmark Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
