'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/context';
import { Calendar, Plus, Clock, MapPin, CheckCircle, ChevronRight } from 'lucide-react';
import type { CaseHearing, CaseRecord } from '@/types/mycase';

export default function HearingDiaryPage() {
  const { t, locale } = useLanguage();
  const [hearings, setHearings] = useState<CaseHearing[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [caseId, setCaseId] = useState('');
  const [hearingDate, setHearingDate] = useState(new Date().toISOString().split('T')[0]);
  const [courtRoom, setCourtRoom] = useState('Court No. 1, Sessions Campus Alwar');
  const [businessRecorded, setBusinessRecorded] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextDate, setNextDate] = useState('');

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

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordHearing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/my-case/hearings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          hearing_date: hearingDate,
          court_room: courtRoom,
          business_recorded: businessRecorded,
          next_action: nextAction,
          next_hearing_date: nextDate || undefined
        })
      });
      setBusinessRecorded('');
      setNextAction('');
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
            <Calendar className="w-4 h-4" />
            <span>Court Cause List & Hearing Diary</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
            {locale === 'hi' ? 'दैनिक पेशी डायरी एवं वाद सूची' : 'Hearing Diary & Daily Cause List'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record hearing proceedings, judicial orders, and track upcoming appearance dates across Alwar courts.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Hearing Outcome</span>
        </button>
      </div>

      {/* Hearing Diary List */}
      <div className="space-y-4">
        {hearings.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border text-center text-xs text-slate-400">
            No hearing records logged in your diary yet. Record a hearing to maintain complete judicial history.
          </div>
        ) : (
          hearings.map(h => (
            <div
              key={h.id}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:border-blue-400 transition"
            >
              <div className="space-y-2 flex-1 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-900 font-serif">
                    {h.case_title || 'Case Hearing'}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {h.court_room}
                  </span>
                </div>

                {h.business_recorded && (
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                    <strong>Proceedings & Order:</strong> {h.business_recorded}
                  </p>
                )}

                {h.next_action && (
                  <div className="text-blue-900 font-medium">
                    <strong>Next Action / Compliance:</strong> {h.next_action}
                  </div>
                )}
              </div>

              <div className="text-right shrink-0 space-y-1">
                <span className="bg-amber-50 text-amber-900 font-bold px-3 py-1.5 rounded-lg border border-amber-200 block text-xs font-mono">
                  Date: {h.hearing_date}
                </span>
                {h.next_hearing_date && (
                  <span className="text-[11px] text-blue-700 font-medium block">
                    Next Date: {h.next_hearing_date}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Hearing Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-base text-slate-900 font-serif">Record Hearing Order</h3>
            <form onSubmit={handleRecordHearing} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Case File</label>
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
                    placeholder="Court No. 2 Alwar"
                  />
                </div>
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
                  <label className="block font-semibold mb-1">Next Action</label>
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
                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1.5 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 text-amber-300 rounded font-semibold">
                  Record Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
