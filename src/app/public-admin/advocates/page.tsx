'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Users, ShieldCheck, CheckCircle2, XCircle, Search, 
  AlertCircle, Upload, Download, FileSpreadsheet, X, Check, RefreshCw
} from 'lucide-react';
import type { AdvocateProfile } from '@/types/database';

export default function AdminAdvocatesPage() {
  const [profiles, setProfiles] = useState<AdvocateProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // Bulk import modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [previewRows, setPreviewRows] = useState<Array<Record<string, string>>>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ added?: number; updated?: number; total?: number; errors?: string[] } | null>(null);

  const loadData = () => {
    fetch('/api/admin/public/advocates')
      .then(r => r.json())
      .then(data => {
        if (data.profiles) setProfiles(data.profiles);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleVerify = async (profileId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/public/advocates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId, is_verified: !currentStatus })
      });
      if (res.ok) {
        setMessage(`Advocate verification status updated successfully.`);
        setTimeout(() => setMessage(''), 2500);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to parse CSV / TSV text in browser
  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const delimiter = lines[0].includes('\t') ? '\t' : ',';

    const parseLine = (line: string): string[] => {
      const entries: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          entries.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      entries.push(current.trim());
      return entries;
    };

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      rows.push(row);
    }

    return rows;
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCsvInput(val);
    const parsed = parseCSVText(val);
    setPreviewRows(parsed);
    setImportResult(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvInput(text);
      const parsed = parseCSVText(text);
      setPreviewRows(parsed);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const downloadSampleTemplate = () => {
    const sample = `full_name,bar_council_enrollment_no,email,phone,bar_association_name,chamber_address,court_practice_complex,practice_areas,experience_years,bio_hindi,bio_english,is_verified
"Advocate Rameshwar Dayal Sharma","R/1122/2008","rameshwar.adv@alwarbar.in","9829011223","District & Sessions Bar Association Alwar","Chamber No. 12, Civil Wing","District & Sessions Court Alwar","Criminal Defense, Regular Bail, BNSS Trials",17,"अलवर सत्र न्यायालय में 17 वर्षों से आपराधिक मामलों के वरिष्ठ अधिवक्ता।","Senior trial counsel with 17 years practice in Alwar criminal courts.",true
"Advocate Pooja Yadav","R/3451/2018","pooja.adv@alwarbar.in","9829044556","District Bar Association Alwar","Chamber No. 5, Revenue Section","Revenue Courts & SDO Alwar","Revenue Tenancy, Agricultural Land Partition, Civil Writs",8,"राजस्व मंडल एवं एसडीओ न्यायालय अलवर में काश्तकारी भूमि विशेषज्ञ।","Specialist in Rajasthan Tenancy Act, partition and mutation appeals.",true
"Advocate Surendra Singh Rathore","R/982/2012","surendra.rathore@alwarbar.in","9414022334","District & Sessions Bar Association Alwar","Chamber No. 27, Sessions Block","District Court Alwar & Commercial Court","Commercial Disputes, Section 138 NI Act, Arbitration",14,"चेक अनादर एवं वाणिज्यिक विवादों के अनुभवी अधिवक्ता।","Extensive practice in negotiable instruments litigation and commercial arbitration.",true`;

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'advocates_bulk_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeBulkImport = async () => {
    if (!csvInput.trim()) return;
    setImporting(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/admin/public/advocates/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_text: csvInput })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Bulk import failed');
      }

      setImportResult({
        added: data.added,
        updated: data.updated,
        total: data.total,
        errors: data.errors
      });

      loadData();
      setMessage(`Bulk import completed: ${data.added} added, ${data.updated} updated.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      setImportResult({ errors: [msg] });
    } finally {
      setImporting(false);
    }
  };

  const filtered = profiles.filter(p =>
    (p.user?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    p.bar_council_enrollment_no.toLowerCase().includes(search.toLowerCase()) ||
    (p.chamber_address || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/public-admin/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portal Admin</span>
        </Link>

        {/* Bulk Upload Button */}
        <button
          onClick={() => {
            setIsBulkModalOpen(true);
            setImportResult(null);
          }}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg text-xs font-semibold shadow transition"
        >
          <Upload className="w-4 h-4" />
          <span>Bulk Upload / Update Directory (CSV/Excel)</span>
        </button>
      </div>

      <div className="border-b pb-4 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-serif font-bold text-2xl text-slate-900">
            Advocate Directory Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage advocates, upload bulk records, and verify Bar Council of Rajasthan enrollments.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          Total Advocates Listed: <strong>{profiles.length}</strong>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Search and Quick Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by advocate name, enrollment (R/..), chamber..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span>Showing {filtered.length} of {profiles.length} advocates</span>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="p-4">Advocate Name & Email</th>
              <th className="p-4">Bar Council Enrollment</th>
              <th className="p-4">Court / Chamber</th>
              <th className="p-4">Practice Areas</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Verification Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-900">
                  {p.user?.full_name}
                  <div className="text-[11px] text-slate-400 font-normal">
                    {p.user?.email} {p.user?.phone ? `• ${p.user.phone}` : ''}
                  </div>
                </td>
                <td className="p-4 font-mono font-semibold text-amber-800">
                  {p.bar_council_enrollment_no}
                  <div className="text-[10px] text-slate-400 font-sans">
                    {p.experience_years} yrs exp.
                  </div>
                </td>
                <td className="p-4 text-slate-600">
                  <div>{p.court_practice_complex}</div>
                  <div className="text-[11px] text-slate-400">{p.chamber_address}</div>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {p.practice_areas.slice(0, 2).map((a, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {a}
                      </span>
                    ))}
                    {p.practice_areas.length > 2 && (
                      <span className="text-[10px] text-slate-400">+{p.practice_areas.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  {p.is_verified ? (
                    <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-mono">
                      Pending
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleToggleVerify(p.id, p.is_verified)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition ${
                      p.is_verified
                        ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {p.is_verified ? 'Revoke' : 'Verify Enrollment'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BULK UPLOAD MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-300">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase text-blue-700">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Advocate Bulk Importer</span>
                </div>
                <h2 className="font-serif font-bold text-xl text-slate-900 mt-0.5">
                  Bulk Upload or Update Advocate Directory
                </h2>
                <p className="text-xs text-slate-500">
                  Upload CSV file or copy-paste rows directly from Microsoft Excel or Google Sheets. Existing records (matched by Enrollment Number or Email) will be safely updated without duplicates.
                </p>
              </div>

              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Download & File Upload Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg font-semibold flex items-center space-x-1.5 shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Download Sample CSV Template</span>
                </button>
                <span className="text-slate-400 hidden sm:inline">•</span>
                <span className="text-slate-500 hidden sm:inline">Contains pre-formatted columns</span>
              </div>

              <div>
                <label className="cursor-pointer px-3 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 rounded-lg font-semibold flex items-center space-x-1.5 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select CSV File</span>
                  <input
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Paste Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Or Paste CSV / Tab-Separated Data Here:
              </label>
              <textarea
                value={csvInput}
                onChange={handleCsvChange}
                rows={6}
                placeholder={`full_name,bar_council_enrollment_no,email,phone,practice_areas,experience_years,chamber_address,is_verified\n"Advocate Ram Mohan","R/501/2014","ram.mohan@alwarbar.in","9829011111","Criminal, Bail",12,"Chamber 14",true`}
                className="w-full p-3 text-xs font-mono bg-slate-900 text-amber-200 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Preview of Parsed Rows */}
            {previewRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Detected {previewRows.length} Valid Rows:</span>
                  <span className="text-[11px] text-slate-400">Preview (first 5 shown)</span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b text-slate-600 text-[11px]">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Enrollment</th>
                        <th className="p-2">Email / Phone</th>
                        <th className="p-2">Areas</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewRows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-semibold text-slate-800">
                            {row.full_name || row.name || '—'}
                          </td>
                          <td className="p-2 font-mono text-amber-900">
                            {row.bar_council_enrollment_no || row.enrollment_no || '—'}
                          </td>
                          <td className="p-2 text-slate-500 text-[11px]">
                            {row.email || 'auto'} / {row.phone || '—'}
                          </td>
                          <td className="p-2 text-slate-600 text-[11px]">
                            {row.practice_areas || 'General'}
                          </td>
                          <td className="p-2">
                            {profiles.some(p => p.bar_council_enrollment_no.toLowerCase() === (row.bar_council_enrollment_no || '').toLowerCase()) ? (
                              <span className="text-[10px] bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                                Will Update
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                                New Entry
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Results Feedback */}
            {importResult && (
              <div className={`p-4 rounded-xl text-xs space-y-1.5 border ${
                importResult.errors && importResult.errors.length > 0 && !importResult.added
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200'
              }`}>
                <div className="font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Import Report:</span>
                </div>
                {importResult.total !== undefined && (
                  <div>
                    Processed: <strong>{importResult.total}</strong> | Newly Added: <strong>{importResult.added}</strong> | Updated: <strong>{importResult.updated}</strong>
                  </div>
                )}
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="text-red-700 font-mono text-[11px] pt-1">
                    {importResult.errors.map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>

              <button
                type="button"
                onClick={executeBulkImport}
                disabled={importing || previewRows.length === 0}
                className="px-5 py-2 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50 flex items-center space-x-2"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Import...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Import {previewRows.length} Advocates Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
