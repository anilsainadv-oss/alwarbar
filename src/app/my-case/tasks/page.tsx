'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { CheckSquare, Plus, Check, Clock, AlertCircle } from 'lucide-react';
import type { CaseTask, CaseRecord } from '@/types/mycase';

export default function TasksPage() {
  const { t, locale } = useLanguage();
  const [tasks, setTasks] = useState<CaseTask[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [caseId, setCaseId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium');

  const loadData = () => {
    fetch('/api/my-case/tasks')
      .then(r => r.json())
      .then(data => {
        if (data.tasks) setTasks(data.tasks);
      })
      .catch(console.error);

    fetch('/api/my-case/cases')
      .then(r => r.json())
      .then(data => {
        if (data.cases) setCases(data.cases);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/my-case/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId || undefined,
          title,
          due_date: dueDate || undefined,
          priority
        })
      });
      setTitle('');
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await fetch('/api/my-case/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <CheckSquare className="w-4 h-4" />
            <span>Deadlines & Compliance</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
            {locale === 'hi' ? 'विधिक कार्य एवं समय-सीमा पंजिका' : 'Tasks & Filing Deadlines'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track limitation windows, certified copy filings, rejoinder due dates, and client appointments.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
        {tasks.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No pending tasks on your compliance docket.
          </div>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between transition text-xs ${
                task.status === 'completed' ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleToggle(task.id, task.status)}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition ${
                    task.status === 'completed' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 hover:border-emerald-600'
                  }`}
                >
                  {task.status === 'completed' && <Check className="w-3.5 h-3.5" />}
                </button>
                <div>
                  <div className={`font-semibold ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {task.title}
                  </div>
                  {task.case_title && (
                    <div className="text-[11px] text-slate-400 font-mono">Case: {task.case_title}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  task.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {task.priority}
                </span>
                <span className="text-[11px] text-slate-400">
                  {task.due_date ? `Due: ${task.due_date}` : 'No date'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-base text-slate-900 font-serif">Add Legal Compliance Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Task Title / Action</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. File rejoinder with certified Khasra map in SDO Court"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Linked Case (Optional)</label>
                <select
                  value={caseId}
                  onChange={e => setCaseId(e.target.value)}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="">-- General Practice Task --</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.case_title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="urgent">Urgent / Today</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1.5 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 text-amber-300 rounded font-semibold">
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
