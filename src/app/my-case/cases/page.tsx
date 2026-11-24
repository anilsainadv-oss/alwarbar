'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Folder, Plus, Search, Filter, Calendar, MapPin, 
  ExternalLink, Trash2, Edit2, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight 
} from 'lucide-react';
import type { CaseRecord, Client, CaseStatus } from '@/types/mycase';

export default function CasesManagementPage() {
  const { t, locale } = useLanguage();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ecourtSyncModalOpen, setEcourtSyncModalOpen] = useState(false);
  const [syncEnrollment, setSyncEnrollment] = useState('R/331/1977');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  // New Case form state
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
  const [statusValue, setStatusValue] = useState<CaseStatus>('active');
  const [privateNotes, setPrivateNotes] = useState('');
  const [clientId, setClientId] = useState('');

  // Editing Case state
  const [editingCase, setEditingCase] = useState<CaseRecord | null>(null);
  const [deletingCase, setDeletingCase] = useState<CaseRecord | null>(null);

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
          status: statusValue,
          notes: privateNotes,
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
      setEcourtSyncModalOpen(false);
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating case');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (c: CaseRecord) => {
    setEditingCase(c);
    setCaseTitle(c.case_title);
    setCourtName(c.court_name);
    setCaseType(c.case_type);
    setPetitioner(c.petitioner_parties || '');
    setRespondent(c.respondent_parties || '');
    setCaseNumber(c.case_number || '');
    setCnrNumber(c.cnr_number || '');
    setFilingDate(c.filing_date || '');
    setNextDate(c.next_hearing_date || '');
    setStageOfCase(c.stage_of_case || 'Hearing');
    setStatusValue(c.status);
    setPrivateNotes(c.private_notes || '');
    setClientId(c.client_id || '');
    setEditModalOpen(true);
    setError('');
  };

  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCase) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/my-case/cases/${editingCase.id}`, {
        method: 'PUT',
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
          status: statusValue,
          notes: privateNotes,
          client_id: clientId || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update case');

      setEditModalOpen(false);
      setEditingCase(null);
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating case');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCase = async () => {
    if (!deletingCase) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/my-case/cases/${deletingCase.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete case');
      }

      setDeleteModalOpen(false);
      setDeletingCase(null);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting case');
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
      (c.cnr_number && c.cnr_number.toLowerCase().includes(search.toLowerCase())) ||
      (c.petitioner_parties && c.petitioner_parties.toLowerCase().includes(search.toLowerCase())) ||
      (c.respondent_parties && c.respondent_parties.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedCases = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'disposed':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-blue-50 text-blue-800 border-blue-200">✓ DISPOSED (निस्तारित)</span>;
      case 'archived':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-purple-50 text-purple-800 border-purple-200">📁 ARCHIVED (अभिलेखागार)</span>;
      case 'stayed':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200">⏸ STAYED (स्थगित)</span>;
      case 'reserved_for_order':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-indigo-50 text-indigo-800 border-indigo-200">⚖ RESERVED (आदेश हेतु सुरक्षित)</span>;
      default:
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-200">● ACTIVE (विचाराधीन)</span>;
    }
  };

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

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setEcourtSyncModalOpen(true)}
            className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5"
          >
            <Search className="w-4 h-4" />
            <span>e-Courts Case Sync</span>
          </button>
          <button
            onClick={() => {
              setCaseTitle('');
              setPetitioner('');
              setRespondent('');
              setCaseNumber('');
              setCnrNumber('');
              setPrivateNotes('');
              setStatusValue('active');
              setNewModalOpen(true);
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Case File</span>
          </button>
        </div>
      </div>

      {/* Official Alwar District Court e-Courts Advocate Search Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-blue-500/30 text-white rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/30 shadow-inner">
            <Search className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <div className="font-bold text-sm text-white flex items-center space-x-2">
              <span>{locale === 'hi' ? 'अलवर जिला कोर्ट e-Courts — अधिवक्ता अनुसार केस खोजें' : 'Alwar District Court e-Courts — Case Status by Advocate'}</span>
              <span className="text-[10px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded border border-blue-400/40 font-mono tracking-wide">
                GOV.IN OFFICIAL
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {locale === 'hi'
                ? 'अलवर जिला एवं सत्र न्यायालय, विशिष्ट न्यायालयों (POCSO, SC/ST, ACJM, MACT) व उपखंड अदालतों में अपने नाम/सनद से लाइव केस सर्च करें।'
                : 'Directly search all your active and disposed cases across District & Sessions Court Alwar and subordinate courts via official e-Courts portal.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
          <a
            href="https://alwar.dcourts.gov.in/case-status-search-by-advocate/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center justify-center space-x-1.5"
          >
            <span>{locale === 'hi' ? 'e-Courts में खोजें ↗' : 'Search by Advocate ↗'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://alwar.dcourts.gov.in/cause-list/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition flex items-center justify-center space-x-1"
          >
            <span>{locale === 'hi' ? 'कॉज लिस्ट ↗' : 'Cause List ↗'}</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by case title, suit number, parties, or CNR..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: locale === 'hi' ? `सभी वाद (${cases.length})` : `All (${cases.length})` },
            { id: 'active', label: locale === 'hi' ? `सक्रिय (${cases.filter(c => c.status === 'active').length})` : `Active (${cases.filter(c => c.status === 'active').length})` },
            { id: 'stayed', label: locale === 'hi' ? `स्थगित (${cases.filter(c => c.status === 'stayed').length})` : `Stayed (${cases.filter(c => c.status === 'stayed').length})` },
            { id: 'reserved_for_order', label: locale === 'hi' ? `सुरक्षित (${cases.filter(c => c.status === 'reserved_for_order').length})` : `Reserved (${cases.filter(c => c.status === 'reserved_for_order').length})` },
            { id: 'disposed', label: locale === 'hi' ? `निस्तारित (${cases.filter(c => c.status === 'disposed').length})` : `Disposed (${cases.filter(c => c.status === 'disposed').length})` },
            { id: 'archived', label: locale === 'hi' ? `अभिलेखागार (${cases.filter(c => c.status === 'archived').length})` : `Archived (${cases.filter(c => c.status === 'archived').length})` }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1 ${
                statusFilter === st.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{st.label}</span>
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {paginatedCases.map(c => (
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
                    {getStatusBadge(c.status)}
                  </div>

                  <div className="text-xs text-slate-500 font-mono flex flex-wrap gap-x-4">
                    <span>No: {c.case_number || 'Unnumbered'}</span>
                    <span>CNR: {c.cnr_number || 'RJAL01-XXXXXX-2026'}</span>
                    <span>Type: {c.case_type}</span>
                  </div>

                  <div className="text-xs text-slate-600">
                    <span><strong>Court:</strong> {c.court_name}</span> • <span><strong>Stage:</strong> {c.stage_of_case}</span>
                  </div>

                  {(c.petitioner_parties || c.respondent_parties) && (
                    <div className="text-[11px] text-slate-500">
                      <span><strong>Parties:</strong> {c.petitioner_parties || 'Petitioner'} v. {c.respondent_parties || 'Respondent'}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:items-end space-y-2 shrink-0 text-xs w-full md:w-auto">
                  {c.next_hearing_date ? (
                    <span className="bg-amber-50 text-amber-900 font-bold px-2.5 py-1 rounded border border-amber-200">
                      Next Hearing: {c.next_hearing_date}
                    </span>
                  ) : c.status === 'disposed' ? (
                    <span className="bg-blue-50 text-blue-900 font-bold px-2.5 py-1 rounded border border-blue-200">
                      ✓ Final Order / Disposed
                    </span>
                  ) : (
                    <span className="bg-purple-50 text-purple-900 font-bold px-2.5 py-1 rounded border border-purple-200">
                      📁 Chamber Record Vault
                    </span>
                  )}

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => openEditModal(c)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium flex items-center space-x-1"
                      title="Edit case details"
                    >
                      <Edit2 className="w-3 h-3 text-slate-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setDeletingCase(c);
                        setDeleteModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[11px] font-medium flex items-center space-x-1"
                      title="Delete case file"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                      <span>Delete</span>
                    </button>
                    <Link
                      href={`/my-case/cases/${c.id}`}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold flex items-center space-x-1 shadow-sm"
                    >
                      <span>Dossier →</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500">
                Showing <strong>{(currentPage - 1) * PAGE_SIZE + 1}</strong> to <strong>{Math.min(currentPage * PAGE_SIZE, filtered.length)}</strong> of <strong>{filtered.length}</strong> cases
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg font-semibold transition ${
                      currentPage === page
                        ? 'bg-amber-600 text-white'
                        : 'border hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Record New Case Modal */}
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
                  placeholder="e.g. Ramesh Kumar v. State of Rajasthan"
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
                    <option>Court of Additional District & Sessions Judge No. 1, Alwar</option>
                    <option>Court of Additional District & Sessions Judge No. 2, Alwar</option>
                    <option>Special Court (POCSO Act Cases No. 1), Alwar</option>
                    <option>Court of CJM / ACJM, Alwar</option>
                    <option>Court of Civil Judge & Senior Division, Alwar</option>
                    <option>Commercial Court, Alwar</option>
                    <option>Family Court No. 1, Alwar</option>
                    <option>Motor Accident Claims Tribunal, Alwar</option>
                    <option>Sub-Divisional Officer (SDO Revenue Court), Alwar</option>
                    <option>Revenue Appellate Authority (RAA), Alwar</option>
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
                    placeholder="e.g. Regular Bail, Civil Suit, Revision"
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Court Case Number</label>
                  <input
                    type="text"
                    value={caseNumber}
                    onChange={e => setCaseNumber(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono"
                    placeholder="e.g. 120/2026"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">16-Digit CNR Number</label>
                  <input
                    type="text"
                    value={cnrNumber}
                    onChange={e => setCnrNumber(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono"
                    placeholder="RJAL01-001234-2026"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Case Status</label>
                  <select
                    value={statusValue}
                    onChange={e => setStatusValue(e.target.value as CaseStatus)}
                    className="w-full p-2.5 border rounded-lg bg-white"
                  >
                    <option value="active">Active (विचाराधीन)</option>
                    <option value="stayed">Stayed (स्थगन आदेश)</option>
                    <option value="reserved_for_order">Reserved for Order (सुरक्षित)</option>
                    <option value="disposed">Disposed (निस्तारित)</option>
                    <option value="archived">Archived (अभिलेखागार)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Filing Date</label>
                  <input
                    type="date"
                    value={filingDate}
                    onChange={e => setFilingDate(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
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
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Case Stage</label>
                  <input
                    type="text"
                    value={stageOfCase}
                    onChange={e => setStageOfCase(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                    placeholder="e.g. Arguments on Charge"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link with Client</label>
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white"
                >
                  <option value="">-- No Direct Client Link (General Dossier) --</option>
                  {clients.map(cl => (
                    <option key={cl.id} value={cl.id}>
                      {cl.full_name} ({cl.phone || 'No Phone'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confidential Strategy & Case Notes</label>
                <textarea
                  rows={3}
                  value={privateNotes}
                  onChange={e => setPrivateNotes(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="Record confidential instructions, strategy, or evidence checklists..."
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

      {/* Edit Case Modal */}
      {editModalOpen && editingCase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-900 border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="font-serif font-bold text-xl text-slate-900 border-b pb-3 flex items-center justify-between">
              <span>Edit Case Record: {editingCase.case_title}</span>
              <span className="text-xs font-mono text-slate-500">{editingCase.id}</span>
            </h3>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateCase} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Case Title</label>
                <input
                  required
                  type="text"
                  value={caseTitle}
                  onChange={e => setCaseTitle(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
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
                    <option>Court of Additional District & Sessions Judge No. 1, Alwar</option>
                    <option>Court of Additional District & Sessions Judge No. 2, Alwar</option>
                    <option>Special Court (POCSO Act Cases No. 1), Alwar</option>
                    <option>Court of CJM / ACJM, Alwar</option>
                    <option>Court of Civil Judge & Senior Division, Alwar</option>
                    <option>Commercial Court, Alwar</option>
                    <option>Family Court No. 1, Alwar</option>
                    <option>Motor Accident Claims Tribunal, Alwar</option>
                    <option>Sub-Divisional Officer (SDO Revenue Court), Alwar</option>
                    <option>Revenue Appellate Authority (RAA), Alwar</option>
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
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Court Case Number</label>
                  <input
                    type="text"
                    value={caseNumber}
                    onChange={e => setCaseNumber(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">16-Digit CNR Number</label>
                  <input
                    type="text"
                    value={cnrNumber}
                    onChange={e => setCnrNumber(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Case Status</label>
                  <select
                    value={statusValue}
                    onChange={e => setStatusValue(e.target.value as CaseStatus)}
                    className="w-full p-2.5 border rounded-lg bg-white"
                  >
                    <option value="active">Active (विचाराधीन)</option>
                    <option value="stayed">Stayed (स्थगन आदेश)</option>
                    <option value="reserved_for_order">Reserved for Order (सुरक्षित)</option>
                    <option value="disposed">Disposed (निस्तारित)</option>
                    <option value="archived">Archived (अभिलेखागार)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Filing Date</label>
                  <input
                    type="date"
                    value={filingDate}
                    onChange={e => setFilingDate(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
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
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Case Stage</label>
                  <input
                    type="text"
                    value={stageOfCase}
                    onChange={e => setStageOfCase(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Associated Client</label>
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white"
                >
                  <option value="">-- No Direct Client Link --</option>
                  {clients.map(cl => (
                    <option key={cl.id} value={cl.id}>
                      {cl.full_name} ({cl.phone || 'No Phone'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confidential Strategy & Case Notes</label>
                <textarea
                  rows={3}
                  value={privateNotes}
                  onChange={e => setPrivateNotes(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Case Confirmation Modal */}
      {deleteModalOpen && deletingCase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">Delete Case File?</h3>
              <p className="text-slate-500">
                Are you sure you want to permanently remove <strong>"{deletingCase.case_title}"</strong> from your docket? This action cannot be undone.
              </p>
            </div>
            <div className="pt-3 flex justify-end space-x-2 border-t">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCase}
                disabled={submitting}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete Case'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* e-Courts Case Synchronizer Modal */}
      {ecourtSyncModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-900 border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Search className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">
                    e-Courts केस सिंक एवं इम्पोर्टर (Alwar District Court)
                  </h3>
                  <p className="text-xs text-slate-500">
                    अलवर जिला न्यायालय आधिकारिक e-Courts सर्वर से अपने केस सीधे वाद पंजिका में जोड़ें।
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEcourtSyncModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-xl p-4 space-y-2 border border-blue-400/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs">
                  <div className="text-blue-300 font-semibold font-mono text-[11px]">
                    ADV. SANAD: {syncEnrollment}
                  </div>
                  <div className="font-bold text-sm text-white mt-0.5">
                    जिला न्यायालय अलवर आधिकारिक सर्च पोर्टल
                  </div>
                </div>
                <a
                  href="https://alwar.dcourts.gov.in/case-status-search-by-advocate/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow flex items-center space-x-1.5 shrink-0"
                >
                  <span>e-Courts में केस खोजें ↗</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                सरकारी e-Courts सर्वर पर अपना नाम या सनद संख्या (<code className="bg-blue-900/60 px-1 py-0.5 rounded text-blue-200">{syncEnrollment}</code>) दर्ज करके कैप्चा सॉल्व करें। मिलने वाले केस का CNR नंबर या केस नंबर नीचे डालकर तुरंत अपनी निजी पंजिका में सिंक करें।
              </p>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    16-Digit e-Courts CNR Number
                  </label>
                  <input
                    type="text"
                    value={cnrNumber}
                    onChange={e => setCnrNumber(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono"
                    placeholder="e.g. RJAL01-003412-2023"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Case / Suit Number
                  </label>
                  <input
                    type="text"
                    value={caseNumber}
                    onChange={e => setCaseNumber(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono"
                    placeholder="e.g. Civil Suit 142/2023"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Case Title (पार्टी नाम)</label>
                <input
                  required
                  type="text"
                  value={caseTitle}
                  onChange={e => setCaseTitle(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="e.g. Ramesh Kumar v. State of Rajasthan"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Competent Court (न्यायालय)</label>
                  <select
                    value={courtName}
                    onChange={e => setCourtName(e.target.value)}
                    className="w-full p-2.5 border rounded-lg bg-white"
                  >
                    <option value="District & Sessions Court, Alwar">District & Sessions Court, Alwar</option>
                    <option value="Court of Additional District & Sessions Judge No. 1, Alwar">ADJ No. 1, Alwar</option>
                    <option value="Court of Additional District & Sessions Judge No. 2, Alwar">ADJ No. 2, Alwar</option>
                    <option value="Special Court (POCSO Act Cases No. 1), Alwar">Special Court (POCSO No. 1), Alwar</option>
                    <option value="Court of Civil Judge & Senior Division, Alwar">Civil Judge & Senior Division, Alwar</option>
                    <option value="Motor Accident Claims Tribunal (MACT), Alwar">MACT Tribunal, Alwar</option>
                    <option value="Court of Sub-Divisional Officer (SDO), Alwar">Court of SDO, Alwar</option>
                    <option value="Court of Revenue Appellate Authority (RAA), Alwar">RAA Revenue Court, Alwar</option>
                    <option value="Family Court No. 1, Alwar">Family Court No. 1, Alwar</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Case Type (प्रकृति)</label>
                  <input
                    required
                    type="text"
                    value={caseType}
                    onChange={e => setCaseType(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                    placeholder="e.g. Civil Suit, Regular Bail"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Petitioner (प्रार्थी)</label>
                  <input
                    required
                    type="text"
                    value={petitioner}
                    onChange={e => setPetitioner(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                    placeholder="Petitioner name"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Respondent (विपक्षी)</label>
                  <input
                    required
                    type="text"
                    value={respondent}
                    onChange={e => setRespondent(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                    placeholder="Respondent name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Stage (कार्यवाही चरण)</label>
                  <input
                    type="text"
                    value={stageOfCase}
                    onChange={e => setStageOfCase(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                    placeholder="e.g. Plaintiff Evidence, Final Arguments"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Next Hearing Date (अगली पेशी)</label>
                  <input
                    type="date"
                    value={nextDate}
                    onChange={e => setNextDate(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setEcourtSyncModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  {submitting ? 'सिंक हो रहा है...' : 'Sync & Save to Docket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
