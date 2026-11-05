'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Folder, Plus, Search, Filter, Calendar, MapPin, 
  ExternalLink, Trash2, Edit2, CheckCircle2, AlertCircle 
} from 'lucide-react';
import type { CaseRecord, Client } from '@/types/mycase';

export default function CasesManagementPage() {
  const { t, locale } = useLanguage();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [caseTitle, setCaseTitle] = useState('');
  const [courtName, setCourtName] = useState('District & Sessions Court, Alwar');
  const [caseType, setCaseType] = useState('Bail Application (Sec 480 BNSS)');
  const [petitioner, setPetitioner] = useState('');
  const [respondent, setRespondent] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [cnrNumber, setCnrNumber] = useState('');
  const [filingDate, setFilingDate] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [stageOfCase, setStageOfCase] = useState('Arguments on Charge');
  const [privateNotes, setPrivateNotes] = useState('');
  const [clientId, setClientId] = useState('');

  const loadData = () => {
    fetch('/api/my-case/cases')
      .then(r => r.json())
      .then(data => {
        if (data.cases) setCases(data.cases);
      })
      .catch(console.error);

    fetch('/api/my-case/clients')
      .then(r => r.json())
      .then(data => {
        if (data.clients) setClients(data.clients);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/my-case/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_title: caseTitle,
          court_name: courtName,
          case_type: caseType,
          petitioner_parties: petitioner,
          respondent_parties: respondent,
          case_number: caseNumber,
          cnr_number: cnrNumber,
          filing_date: filingDate,
          next_hearing_date: nextDate,
          stage_of_case: stageOfCase,
          private_notes: privateNotes,
          client_id: clientId || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create case');

      // Reset form
      setCaseTitle('');
      setPetitioner('');
      setRespondent('');
      setCaseNumber('');
      setCnrNumber('');
      setPrivateNotes('');
      setNewModalOpen(false);
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating case');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = cases.filter(c => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch =
      c.case_title.toLowerCase().includes(search.toLowerCase()) ||
      c.court_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.case_number && c.case_number.toLowerCase().includes(search.toLowerCase())) ||
      (c.cnr_number && c.cnr_number.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
            <Folder className="w-4 h-4" />
            <span>Case Docket Ledger</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
            {locale === 'hi' ? 'केस प्रबंधन एवं वाद पंजिका' : 'Case Management & Docket'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strictly isolated personal legal records with CNR tracking and stage monitoring.
          </p>
        </div>

        <button
          onClick={() => setNewModalOpen(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Case File</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by case title, suit number, or CNR..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'active', 'stayed', 'reserved_for_order', 'disposed', 'archived'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Table / Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <Folder className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-700">No matching cases found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You currently have no cases matching this criteria. Record a new case file to manage pleadings, hearings, and AI briefs.
          </p>
          <button
            onClick={() => setNewModalOpen(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold shadow"
          >
            Create New Case
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(c => (
            <div
              key={c.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-amber-400 transition"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/my-case/cases/${c.id}`}
                    className="font-serif font-bold text-base text-slate-900 hover:text-amber-800 hover:underline"
                  >
                    {c.case_title}
                  </Link>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                    {c.status}
                  </span>
                </div>

                <div className="text-xs text-slate-500 font-mono flex flex-wrap gap-x-4">
                  <span>No: {c.case_number || 'Unnumbered'}</span>
                  <span>CNR: {c.cnr_number || 'RJAL01-XXXXXX-2026'}</span>
                  <span>Type: {c.case_type}</span>
                </div>

                <div className="text-xs text-slate-600">
                  <span><strong>Court:</strong> {c.court_name}</span> • <span><strong>Stage:</strong> {c.stage_of_case}</span>
                </div>
              </div>

              <div className="flex flex-col md:items-end space-y-1 shrink-0 text-xs">
                {c.next_hearing_date && (
                  <span className="bg-blue-50 text-blue-900 font-bold px-2.5 py-1 rounded border border-blue-200">
                    Next Hearing: {c.next_hearing_date}
                  </span>
                )}
                <Link
                  href={`/my-case/cases/${c.id}`}
                  className="text-amber-800 font-semibold hover:underline flex items-center space-x-1 pt-1"
                >
                  <span>Open Full Dossier →</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Case Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-900 border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="font-serif font-bold text-xl text-slate-900 border-b pb-3">
              Record New Case File (Confidential Dossier)
            </h3>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Case Title</label>
                <input
                  required
                  type="text"
                  value={caseTitle}
                  onChange={e => setCaseTitle(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="e.g. Ramesh Kumar v. State of Rajasthan / Shanti Devi v. Municipal Council"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Competent Court</label>
                  <select
                    value={courtName}
                    onChange={e => setCourtName(e.target.value)}
                    className="w-full p-2.5 border rounded-lg bg-white"
                  >
                    <option>District & Sessions Court, Alwar</option>
                    <option>Court of CJM / ACJM, Alwar</option>
                    <option>Commercial Court, Alwar</option>
                    <option>Family Court, Alwar</option>
                    <option>Motor Accident Claims Tribunal, Alwar</option>
                    <option>Sub-Divisional Officer (SDO Revenue Court), Alwar</option>
                    <option>Civil Judge & Judicial Magistrate, Rajgarh</option>
                    <option>Civil Judge & Judicial Magistrate, Tijara</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Case Category / Type</label>
                  <input
                    required
                    type="text"
                    value={caseType}
                    onChange={e => setCaseType(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                    placeholder="e.g. Regular Bail (Sec 480 BNSS), Civil Suit, Partition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Petitioner / Complainant</label>
                  <input
                    required
                    type="text"
                    value={petitioner}
                    onChange={e => setPetitioner(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                    placeholder="Full name & parentage"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Respondent / Accused</label>
                  <input
                    required
                    type="text"
                    value={respondent}
                    onChange={e => setRespondent(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                    placeholder="Full name & parentage"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Court Case Number</label>
                  <input
                    type="text"
                    value={caseNumber}
                    onChange={e => setCaseNumber(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono"
                    placeholder="e.g. Criminal Misc. 120/2026"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">16-Digit CNR Number (if issued)</label>
                  <input
                    type="text"
                    value={cnrNumber}
                    onChange={e => setCnrNumber(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono"
                    placeholder="RJAL01-001234-2026"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Case Stage</label>
                  <input
                    type="text"
                    value={stageOfCase}
                    onChange={e => setStageOfCase(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                    placeholder="e.g. Arguments on Stay / Charge / Evidence"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Next Hearing Date</label>
                  <input
                    type="date"
                    value={nextDate}
                    onChange={e => setNextDate(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confidential Strategy & Case Notes</label>
                <textarea
                  rows={3}
                  value={privateNotes}
                  onChange={e => setPrivateNotes(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="Record confidential client instructions, witness weaknesses, or trial strategy..."
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-semibold rounded-lg shadow-sm"
                >
                  {submitting ? 'Recording Case...' : 'Save Case File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
