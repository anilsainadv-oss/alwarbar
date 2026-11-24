'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Calendar as CalendarIcon, Plus, Clock, MapPin, CheckCircle, 
  ChevronRight, ChevronLeft, ExternalLink, Edit2, Trash2, Filter, AlertCircle,
  UploadCloud, RefreshCw, Check
} from 'lucide-react';
import type { CaseHearing, CaseRecord } from '@/types/mycase';

export default function HearingDiaryPage() {
  const { t, locale } = useLanguage();
  const [hearings, setHearings] = useState<CaseHearing[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([]);

  // View mode: 'monthly' | 'weekly' | 'daily' | 'all' | 'causelist'
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly' | 'daily' | 'all' | 'causelist'>('monthly');

  // Calendar date selection
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split('T')[0]);

  // Cause List Tracker State (P4)
  const [causeListDate, setCauseListDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [causeListEntries, setCauseListEntries] = useState<any[]>([]);
  const [causeListMatches, setCauseListMatches] = useState<any[]>([]);
  const [causeListLoading, setCauseListLoading] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importCourt, setImportCourt] = useState('District & Sessions Court, Alwar');
  const [importJudge, setImportJudge] = useState('Presiding Officer, Alwar');
  const [importRawText, setImportRawText] = useState('');
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importSuccess, setImportSuccess] = useState('');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingHearing, setEditingHearing] = useState<CaseHearing | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [caseId, setCaseId] = useState('');
  const [hearingDate, setHearingDate] = useState(new Date().toISOString().split('T')[0]);
  const [courtRoom, setCourtRoom] = useState('Court No. 1, Sessions Campus Alwar');
  const [judgeName, setJudgeName] = useState('');
  const [businessRecorded, setBusinessRecorded] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [attended, setAttended] = useState(false);

  const loadData = () => {
    fetch('/api/my-case/hearings')
      .then(r => r.json())
      .then(data => {
        if (data.hearings) setHearings(data.hearings);
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

  const loadCauseList = (dateStr?: string) => {
    const d = dateStr || causeListDate;
    setCauseListLoading(true);
    fetch(`/api/my-case/cause-list?date=${d}`)
      .then(r => r.json())
      .then(data => {
        if (data.entries) setCauseListEntries(data.entries);
        if (data.matches) setCauseListMatches(data.matches);
      })
      .catch(console.error)
      .finally(() => setCauseListLoading(false));
  };

  useEffect(() => {
    loadData();
    loadCauseList();
  }, []);

  const handleImportCauseList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importRawText.trim()) return;
    setImportSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/my-case/cause-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          court_name: importCourt,
          judge_name: importJudge,
          cause_list_date: causeListDate,
          raw_text: importRawText
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setImportSuccess(`✓ Imported ${data.importedCount} cause list items (${data.matchedCount} matched to docket)`);
      setImportRawText('');
      loadCauseList(causeListDate);
      setTimeout(() => {
        setImportSuccess('');
        setImportModalOpen(false);
      }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error importing cause list');
    } finally {
      setImportSubmitting(false);
    }
  };

  const handleRecordHearing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/my-case/hearings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          hearing_date: hearingDate,
          court_room: courtRoom,
          judge_name: judgeName,
          business_recorded: businessRecorded,
          next_action: nextAction,
          next_hearing_date: nextDate || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record hearing');

      setBusinessRecorded('');
      setNextAction('');
      setNextDate('');
      setAddModalOpen(false);
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error recording hearing');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditHearing = (h: CaseHearing) => {
    setEditingHearing(h);
    setHearingDate(h.hearing_date);
    setCourtRoom(h.court_room || '');
    setJudgeName(h.judge_name || '');
    setBusinessRecorded(h.business_recorded || '');
    setNextAction(h.next_action || '');
    setNextDate(h.next_hearing_date || '');
    setAttended(h.attended || false);
    setEditModalOpen(true);
    setError('');
  };

  const handleUpdateHearing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHearing) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/my-case/hearings/${editingHearing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hearing_date: hearingDate,
          court_room: courtRoom,
          judge_name: judgeName,
          business_recorded: businessRecorded,
          next_action: nextAction,
          next_hearing_date: nextDate || undefined,
          attended
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update hearing');

      setEditModalOpen(false);
      setEditingHearing(null);
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating hearing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelHearing = async (hId: string) => {
    if (!confirm('Are you sure you want to cancel and delete this hearing record?')) return;
    try {
      const res = await fetch(`/api/my-case/hearings/${hId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to cancel hearing');
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error cancelling hearing');
    }
  };

  // Calendar helpers
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNamesHi = [
    'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
    'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonthDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Calculate hearings for a specific day string 'YYYY-MM-DD'
  const getHearingsForDate = (dateStr: string) => {
    return hearings.filter(h => h.hearing_date === dateStr);
  };

  // Filter hearings based on active view mode
  const filteredHearings = hearings.filter(h => {
    if (viewMode === 'all') return true;

    if (viewMode === 'daily') {
      return h.hearing_date === selectedDateStr;
    }

    if (viewMode === 'monthly') {
      if (!h.hearing_date) return false;
      const hDate = new Date(h.hearing_date);
      return hDate.getFullYear() === year && hDate.getMonth() === month;
    }

    if (viewMode === 'weekly') {
      if (!h.hearing_date || !selectedDateStr) return false;
      const selected = new Date(selectedDateStr);
      const startOfWeek = new Date(selected);
      startOfWeek.setDate(selected.getDate() - selected.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const hDate = new Date(h.hearing_date);
      return hDate >= startOfWeek && hDate <= endOfWeek;
    }

    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
            <CalendarIcon className="w-4 h-4" />
            <span>Court Cause List & Hearing Diary</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
            {locale === 'hi' ? 'दैनिक पेशी डायरी एवं वाद कैलेंडर' : 'Hearing Diary & Court Calendar'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record hearing proceedings, judicial orders, and track upcoming appearance dates across Alwar courts.
          </p>
        </div>

        <button
          onClick={() => {
            setHearingDate(selectedDateStr || new Date().toISOString().split('T')[0]);
            setBusinessRecorded('');
            setNextAction('');
            setNextDate('');
            setAddModalOpen(true);
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Hearing Outcome</span>
        </button>
      </div>

      {/* Official Alwar e-Courts Quick Access Strip */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 text-white rounded-xl p-4 border border-blue-400/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center space-x-3 text-xs">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/30">
            <CalendarIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="font-bold text-sm text-white flex items-center space-x-2">
              <span>अलवर जिला न्यायालय e-Courts लाइव केस स्टेटस</span>
              <span className="text-[10px] bg-blue-400/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30 font-mono">
                Live Server
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              अपने नाम अथवा सनद नंबर से अलवर कोर्ट में लिस्टेड सभी मुकदमों की आज की कॉज लिस्ट, पेशी तारीख व केस स्टेटस देखें।
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <a
            href="https://alwar.dcourts.gov.in/case-status-search-by-advocate/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow flex items-center space-x-1.5"
          >
            <span>Search by Advocate ↗</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://alwar.dcourts.gov.in/cause-list/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            दैनिक कॉज लिस्ट
          </a>
        </div>
      </div>

      {/* View Filters & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs">
        <div className="flex items-center space-x-1.5">
          <span className="font-semibold text-slate-600 mr-1 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>View:</span>
          </span>
          {[
            { id: 'monthly', label: locale === 'hi' ? 'मासिक कैलेंडर' : 'Monthly Calendar' },
            { id: 'weekly', label: locale === 'hi' ? 'साप्ताहिक' : 'Weekly' },
            { id: 'daily', label: locale === 'hi' ? 'दैनिक (चुनी तारीख)' : 'Daily' },
            { id: 'all', label: locale === 'hi' ? `सभी पेशी (${hearings.length})` : `All (${hearings.length})` },
            { id: 'causelist', label: locale === 'hi' ? 'कॉज लिस्ट ट्रैकर' : 'Cause List Matcher' }
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setViewMode(v.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === v.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Calendar Navigation Buttons or Cause List Actions */}
        {viewMode !== 'causelist' ? (
          <div className="flex items-center space-x-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 text-slate-700"
            >
              Today
            </button>
            <button
              onClick={prevMonth}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-serif font-bold text-sm text-slate-800 px-2 min-w-36 text-center">
              {locale === 'hi' ? `${monthNamesHi[month]} ${year}` : `${monthNames[month]} ${year}`}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={causeListDate}
              onChange={e => {
                setCauseListDate(e.target.value);
                loadCauseList(e.target.value);
              }}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-700 bg-white"
            />
            <button
              onClick={() => loadCauseList(causeListDate)}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
              title="Refresh Cause List"
            >
              <RefreshCw className={`w-4 h-4 ${causeListLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              onClick={() => setImportModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center space-x-1 shadow-sm"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Import Cause List</span>
            </button>
          </div>
        )}
      </div>

      {viewMode !== 'causelist' ? (
        <>
          {/* Interactive Calendar Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600 py-2.5">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 text-xs">
              {/* Empty cells before month start */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-24 bg-slate-50/40 p-2" />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayHearings = getHearingsForDate(dayStr);
                const isToday = dayStr === new Date().toISOString().split('T')[0];
                const isSelected = dayStr === selectedDateStr;

                return (
                  <div
                    key={dayStr}
                    onClick={() => {
                      setSelectedDateStr(dayStr);
                    }}
                    className={`min-h-24 p-2 transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-50/60 ring-2 ring-inset ring-amber-500'
                        : isToday
                        ? 'bg-blue-50/50 hover:bg-slate-50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                          isToday
                            ? 'bg-blue-600 text-white'
                            : isSelected
                            ? 'bg-amber-600 text-white'
                            : 'text-slate-700'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayHearings.length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          {dayHearings.length}
                        </span>
                      )}
                    </div>

                    {/* Hearing Preview Pills */}
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {dayHearings.slice(0, 2).map(h => (
                        <div
                          key={h.id}
                          className="text-[10px] truncate px-1.5 py-0.5 rounded bg-blue-100/70 text-blue-900 border border-blue-200 font-medium"
                          title={`${h.case_title || 'Hearing'} - ${h.court_room || ''}`}
                        >
                          {h.case_title || 'Hearing'}
                        </div>
                      ))}
                      {dayHearings.length > 2 && (
                        <span className="text-[10px] text-slate-400 block pl-1">
                          +{dayHearings.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hearing Diary Entries List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2 border-slate-200">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
                <span>
                  {viewMode === 'daily'
                    ? `Hearings on ${selectedDateStr}`
                    : viewMode === 'weekly'
                    ? `Hearings for Week of ${selectedDateStr}`
                    : viewMode === 'monthly'
                    ? `Hearings in ${monthNames[month]} ${year}`
                    : 'All Scheduled Hearings'}
                </span>
                <span className="text-xs font-normal text-slate-500">
                  ({filteredHearings.length} entries)
                </span>
              </h3>

              <span className="text-xs text-slate-500">
                Click any hearing date in the calendar above to filter.
              </span>
            </div>

            {filteredHearings.length === 0 ? (
              <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-400 space-y-2">
                <CalendarIcon className="w-8 h-8 mx-auto text-slate-300" />
                <p>No hearing records logged for this selected view.</p>
              </div>
            ) : (
              filteredHearings.map(h => (
                <div
                  key={h.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:border-blue-400 transition"
                >
                  <div className="space-y-2 flex-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 font-serif">
                        {h.case_title || 'Court Hearing'}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {h.court_room}
                      </span>
                      {h.attended && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.2 rounded font-medium flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Attended</span>
                        </span>
                      )}
                    </div>

                    {h.business_recorded && (
                      <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                        <strong>Proceedings & Order:</strong> {h.business_recorded}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-slate-600">
                      {h.judge_name && (
                        <span><strong>Bench:</strong> {h.judge_name}</span>
                      )}
                      {h.next_action && (
                        <span className="text-blue-900 font-medium">
                          <strong>Next Action:</strong> {h.next_action}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end space-y-2 shrink-0 text-xs">
                    <span className="bg-amber-50 text-amber-900 font-bold px-3 py-1.5 rounded-lg border border-amber-200 block text-xs font-mono">
                      Hearing Date: {h.hearing_date}
                    </span>
                    {h.next_hearing_date && (
                      <span className="text-[11px] text-blue-700 font-medium block">
                        Next Date: {h.next_hearing_date}
                      </span>
                    )}

                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => openEditHearing(h)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium flex items-center space-x-1"
                        title="Edit hearing order"
                      >
                        <Edit2 className="w-3 h-3 text-slate-600" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleCancelHearing(h.id)}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[11px] font-medium flex items-center space-x-1"
                        title="Cancel hearing entry"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Cause List Matcher View */
        <div className="space-y-6">
          {/* Official Compliance Notice Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">e-Courts Compliance & Cause List Integration Workflow</p>
              <p className="text-amber-800 leading-relaxed">
                In strict compliance with eCourts terms of service and access restrictions, automated CAPTCHA bypass is not performed. 
                Advocates can import or paste daily cause lists directly from the{' '}
                <a 
                  href="https://alwar.dcourts.gov.in/cause-list/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-bold underline text-blue-800 hover:text-blue-900"
                >
                  District Court Alwar Portal ↗
                </a>
                . The system automatically cross-references every listed item against your active docket to highlight your scheduled appearances.
              </p>
            </div>
          </div>

          {/* Matches highlight banner if any matches found */}
          {causeListMatches.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-xs text-emerald-950 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-sm">
                    {causeListMatches.length} Matching Case{causeListMatches.length > 1 ? 's' : ''} Found on Docket for {causeListDate}
                  </span>
                </div>
                <span className="text-[11px] font-semibold bg-emerald-200/60 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Active Appearances
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {causeListMatches.map((m, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-emerald-200 shadow-xs flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900">Item #{m.item_number}: {m.case_number}</div>
                      <div className="text-slate-600 text-[11px] mt-0.5">{m.parties}</div>
                      <div className="text-slate-500 text-[10px] mt-0.5 font-mono">{m.court_name}</div>
                    </div>
                    {m.docket_case_id && (
                      <Link
                        href={`/my-case/cases/${m.docket_case_id}`}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold shrink-0 ml-2"
                      >
                        View File ↗
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cause List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50">
              <div>
                <h3 className="font-serif font-bold text-slate-900 text-sm">
                  Daily Cause List Entries — {causeListDate}
                </h3>
                <p className="text-slate-500 text-[11px]">
                  {causeListEntries.length} total matter(s) listed across tracked courtrooms.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setImportModalOpen(true)}
                  className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-xs"
                >
                  + Add / Paste More
                </button>
              </div>
            </div>

            {causeListLoading ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin text-blue-600" />
                <p>Loading cause list entries...</p>
              </div>
            ) : causeListEntries.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 space-y-3">
                <UploadCloud className="w-8 h-8 mx-auto text-slate-400" />
                <p className="font-medium text-slate-700">No cause list entries loaded for {causeListDate}.</p>
                <p className="text-slate-400 max-w-md mx-auto">
                  Copy the cause list text from the official Alwar court portal or PDF notice board and paste it to match against your client cases.
                </p>
                <button
                  onClick={() => setImportModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Import Cause List for Today
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 w-16">Item #</th>
                      <th className="p-3">Case Number</th>
                      <th className="p-3">Parties</th>
                      <th className="p-3">Purpose / Stage</th>
                      <th className="p-3">Court & Bench</th>
                      <th className="p-3 text-right">Docket Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {causeListEntries.map((item, idx) => {
                      const isMatch = item.matched_to_docket || item.is_matched || item.docket_case_id;
                      return (
                        <tr key={item.id || idx} className={isMatch ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50'}>
                          <td className="p-3 font-mono font-bold text-slate-900">{item.item_number}</td>
                          <td className="p-3 font-mono font-medium text-blue-900">{item.case_number}</td>
                          <td className="p-3 font-medium text-slate-900">{item.parties}</td>
                          <td className="p-3 text-slate-600">{item.stage || item.purpose || 'For Hearing'}</td>
                          <td className="p-3 text-slate-500 text-[11px]">
                            <div>{item.court_name}</div>
                            {item.judge_name && <div className="text-[10px] text-slate-400">{item.judge_name}</div>}
                          </td>
                          <td className="p-3 text-right">
                            {isMatch ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Docket Match</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] font-mono">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Record Hearing Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-base text-slate-900 font-serif border-b pb-2">
              Record Hearing Outcome & Daily Cause Entry
            </h3>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleRecordHearing} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Case File</label>
                <select
                  value={caseId}
                  onChange={e => setCaseId(e.target.value)}
                  className="w-full p-2 border rounded bg-white"
                  required
                >
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.case_title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Hearing Date</label>
                  <input
                    required
                    type="date"
                    value={hearingDate}
                    onChange={e => setHearingDate(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Court Room</label>
                  <input
                    type="text"
                    value={courtRoom}
                    onChange={e => setCourtRoom(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Court No. 1"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Presiding Judge</label>
                <input
                  type="text"
                  value={judgeName}
                  onChange={e => setJudgeName(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. Special Judge (POCSO), Alwar"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Judicial Proceedings / Order Passed</label>
                <textarea
                  rows={3}
                  value={businessRecorded}
                  onChange={e => setBusinessRecorded(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. Reply filed. Matter posted for final arguments on interim stay."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Next Action Required</label>
                  <input
                    type="text"
                    value={nextAction}
                    onChange={e => setNextAction(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Prepare citation list"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Next Hearing Date</label>
                  <input
                    type="date"
                    value={nextDate}
                    onChange={e => setNextDate(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-slate-900 text-amber-300 rounded-lg font-semibold"
                >
                  {submitting ? 'Recording...' : 'Save Hearing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hearing Modal */}
      {editModalOpen && editingHearing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-base text-slate-900 font-serif border-b pb-2">
              Edit Hearing Order: {editingHearing.case_title}
            </h3>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateHearing} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Hearing Date</label>
                  <input
                    required
                    type="date"
                    value={hearingDate}
                    onChange={e => setHearingDate(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Court Room</label>
                  <input
                    type="text"
                    value={courtRoom}
                    onChange={e => setCourtRoom(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Presiding Judge</label>
                <input
                  type="text"
                  value={judgeName}
                  onChange={e => setJudgeName(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Judicial Proceedings / Order Passed</label>
                <textarea
                  rows={3}
                  value={businessRecorded}
                  onChange={e => setBusinessRecorded(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Next Action Required</label>
                  <input
                    type="text"
                    value={nextAction}
                    onChange={e => setNextAction(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Next Hearing Date</label>
                  <input
                    type="date"
                    value={nextDate}
                    onChange={e => setNextDate(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="diaryAttended"
                  checked={attended}
                  onChange={e => setAttended(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <label htmlFor="diaryAttended" className="font-semibold text-slate-700">
                  Attended by Advocate in Court
                </label>
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold"
                >
                  {submitting ? 'Updating...' : 'Update Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Cause List Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-900 border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 font-serif flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <span>Import Daily Cause List (Alwar Courts)</span>
              </h3>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {error}
              </div>
            )}

            {importSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
                {importSuccess}
              </div>
            )}

            <form onSubmit={handleImportCauseList} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Cause List Date</label>
                  <input
                    type="date"
                    required
                    value={causeListDate}
                    onChange={e => setCauseListDate(e.target.value)}
                    className="w-full p-2 border rounded bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Presiding Court</label>
                  <input
                    type="text"
                    required
                    value={importCourt}
                    onChange={e => setImportCourt(e.target.value)}
                    className="w-full p-2 border rounded bg-white text-xs"
                    placeholder="District & Sessions Court, Alwar"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Presiding Judge / Bench</label>
                <input
                  type="text"
                  value={importJudge}
                  onChange={e => setImportJudge(e.target.value)}
                  className="w-full p-2 border rounded bg-white text-xs"
                  placeholder="e.g. Additional District Judge No. 1, Alwar"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold">
                    Paste Cause List Text / Content
                  </label>
                  <a
                    href="https://alwar.dcourts.gov.in/cause-list/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center space-x-1"
                  >
                    <span>Open eCourts Portal ↗</span>
                  </a>
                </div>
                <textarea
                  required
                  rows={7}
                  value={importRawText}
                  onChange={e => setImportRawText(e.target.value)}
                  className="w-full p-2.5 border rounded-lg font-mono text-[11px] leading-relaxed bg-slate-50 focus:bg-white"
                  placeholder={`Item 1: Cr. Misc. 102/2024 - Ramesh Kumar vs State of Rajasthan - Stage: Arguments on Bail\nItem 2: Regular Civil Appeal 45/2023 - Sunita Devi vs Municipal Board Alwar - Stage: Framing of Issues\nItem 3: Execution 12/2022 - M/s Alwar Traders vs Suresh Singhal - Stage: Evidence`}
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Supports items copied directly from official PDF or web cause lists. Items will be automatically parsed and matched against your cases.
                </p>
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importSubmitting || !importRawText.trim()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {importSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Parsing & Matching...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Parse & Import Cause List</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
