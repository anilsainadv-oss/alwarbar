'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Folder, Calendar, CheckSquare, Sparkles, Plus, Clock, 
  ArrowRight, FileText, AlertCircle, CheckCircle, ExternalLink, ShieldCheck 
} from 'lucide-react';
import type { CaseRecord, CaseHearing, CaseTask, LegalDraft } from '@/types/mycase';

export default function MyCaseDashboardPage() {
  const { t, locale } = useLanguage();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [hearings, setHearings] = useState<CaseHearing[]>([]);
  const [tasks, setTasks] = useState<CaseTask[]>([]);
  const [drafts, setDrafts] = useState<LegalDraft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/my-case/cases').then(r => r.json()),
      fetch('/api/my-case/hearings').then(r => r.json()),
      fetch('/api/my-case/tasks').then(r => r.json()),
      fetch('/api/my-case/drafts').then(r => r.json()),
    ])
      .then(([caseData, hearingData, taskData, draftData]) => {
        if (caseData.cases) setCases(caseData.cases);
        if (hearingData.hearings) setHearings(hearingData.hearings);
        if (taskData.tasks) setTasks(taskData.tasks);
        if (draftData.drafts) setDrafts(draftData.drafts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeCases = cases.filter(c => c.status === 'active');
  const pendingTasks = tasks.filter(t => t.status === 'pending');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
            <ShieldCheck className="w-4 h-4" />
            <span>Advocate Practice Command Center</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
            {locale === 'hi' ? 'माई केस — दैनिक विधिक डैशबोर्ड' : 'My Case — Advocate Legal Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strictly isolated personal legal workspace. No other advocate or administrator can inspect your files.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/my-case/cases"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.createNewCase}</span>
          </Link>
          <Link
            href="/my-case/drafting"
            className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.aiDrafting}</span>
          </Link>
        </div>
      </div>

      {/* Honest AI Status Alert */}
      <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3.5 text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{t.demoAiNotice}</span>
        </div>
        <Link href="/my-case/settings" className="text-amber-800 font-semibold underline shrink-0 ml-2">
          Configure API Key →
        </Link>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">{t.totalCases}</span>
            <Folder className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-slate-900">
            {activeCases.length}
          </div>
          <div className="text-[11px] text-slate-500">Across Alwar Courts</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">{t.upcomingHearings}</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-slate-900">
            {hearings.length}
          </div>
          <div className="text-[11px] text-slate-500">Scheduled on docket</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">{t.pendingTasks}</span>
            <CheckSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-slate-900">
            {pendingTasks.length}
          </div>
          <div className="text-[11px] text-slate-500">Compliance & filings</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Saved Drafts</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-slate-900">
            {drafts.length}
          </div>
          <div className="text-[11px] text-slate-500">Pleadings in progress</div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Active Cases & Hearings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Cases Dossier List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
                <Folder className="w-4 h-4 text-amber-700" />
                <span>Active Case Files</span>
              </h2>
              <Link href="/my-case/cases" className="text-xs text-amber-800 font-semibold hover:underline">
                View All Files →
              </Link>
            </div>

            {activeCases.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                <p>No active case records found in your private workspace.</p>
                <Link
                  href="/my-case/cases"
                  className="inline-block px-3 py-1.5 bg-amber-600 text-white rounded text-xs font-medium"
                >
                  Create Your First Case
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeCases.slice(0, 3).map(c => (
                  <div
                    key={c.id}
                    className="p-4 rounded-lg border border-slate-200 hover:border-amber-400 transition bg-slate-50/50 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          href={`/my-case/cases/${c.id}`}
                          className="font-serif font-bold text-sm text-slate-900 hover:text-amber-800 hover:underline"
                        >
                          {c.case_title}
                        </Link>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">
                          {c.case_number || 'Pending No.'} • CNR: {c.cnr_number || 'Unassigned'}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded capitalize">
                        {c.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span><strong>Court:</strong> {c.court_name}</span>
                      <span><strong>Stage:</strong> {c.stage_of_case || 'Arguments'}</span>
                      {c.next_hearing_date && (
                        <span className="text-amber-800 font-semibold">
                          <strong>Next Date:</strong> {c.next_hearing_date}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hearing Diary Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-700" />
                <span>Upcoming Hearing Dates</span>
              </h2>
              <Link href="/my-case/diary" className="text-xs text-blue-800 font-semibold hover:underline">
                Full Cause List Diary →
              </Link>
            </div>

            {hearings.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No scheduled hearings on your immediate diary.
              </div>
            ) : (
              <div className="space-y-3">
                {hearings.slice(0, 3).map(h => (
                  <div key={h.id} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">{h.case_title || 'Case Hearing'}</div>
                      <div className="text-slate-500">{h.court_room || 'Court Room'} • {h.business_recorded}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 block text-xs">
                        {h.hearing_date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deadlines & Quick AI Access */}
        <div className="space-y-6">
          {/* Action Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-emerald-700" />
                <span>Urgent Deadlines</span>
              </h2>
              <Link href="/my-case/tasks" className="text-xs text-emerald-800 font-semibold hover:underline">
                All Tasks →
              </Link>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                All tasks and court deadlines completed!
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingTasks.slice(0, 4).map(task => (
                  <div key={task.id} className="p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="font-medium text-slate-800">{task.title}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className={`capitalize font-bold ${task.priority === 'urgent' ? 'text-red-600' : 'text-slate-500'}`}>
                        {task.priority} Priority
                      </span>
                      <span>Due: {task.due_date || 'No Date'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Legal Studio Shortcuts */}
          <div className="bg-gradient-to-br from-slate-900 to-legal-navy text-white rounded-xl p-6 space-y-4 shadow">
            <h3 className="font-serif font-bold text-base text-amber-300 flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>AI Practice Tools</span>
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Accelerate drafting with statutory templates verified for BNSS regular bail, temporary injunctions, and legal notices.
            </p>

            <div className="space-y-2 pt-1 text-xs">
              <Link
                href="/my-case/drafting?type=bail_application"
                className="block p-2 rounded bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition font-medium"
              >
                ⚖️ Regular Bail Draft (Sec 480 BNSS) →
              </Link>
              <Link
                href="/my-case/research"
                className="block p-2 rounded bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition font-medium"
              >
                🔍 Research Law & High Court Citations →
              </Link>
              <Link
                href="/my-case/ai-assistant"
                className="block p-2 rounded bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition font-medium"
              >
                📑 Analyze Case File & Chronology →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
