'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { ForumReport, ForumPost } from '@/types/forum';

export default function AdminForumModerationPage() {
  const [reports, setReports] = useState<ForumReport[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [message, setMessage] = useState('');

  const loadData = () => {
    fetch('/api/admin/public/forum')
      .then(r => r.json())
      .then(data => {
        if (data.reports) setReports(data.reports);
        if (data.allPosts) setPosts(data.allPosts);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateReport = async (reportId: string, status: 'reviewed' | 'dismissed') => {
    try {
      await fetch('/api/admin/public/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId, status })
      });
      setMessage(`Report status marked as ${status}.`);
      setTimeout(() => setMessage(''), 2500);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <Link
        href="/public-admin/dashboard"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Portal Admin</span>
      </Link>

      <div className="border-b pb-4 border-slate-200">
        <h1 className="font-serif font-bold text-2xl text-slate-900">
          Advocates Forum Moderation & Spam Control
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review reported discussion threads, enforce professional etiquette, and protect against client confidentiality breaches.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="font-serif font-bold text-base text-slate-900">
          Reported Content Queue ({reports.filter(r => r.status === 'pending').length} Pending)
        </h2>

        {reports.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border text-center text-xs text-slate-400">
            No community reports in moderation queue. Clean record.
          </div>
        ) : (
          reports.map(r => (
            <div key={r.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded text-[10px] uppercase">
                  {r.reason}
                </span>
                <span className="text-slate-400 text-[11px]">
                  Reported: {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="text-slate-700">
                Reporter: <strong>{r.reporter_name}</strong>
              </div>

              {r.details && (
                <p className="bg-slate-50 p-2.5 rounded border border-slate-100 text-slate-600">
                  {r.details}
                </p>
              )}

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  onClick={() => handleUpdateReport(r.id, 'dismissed')}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
                >
                  Dismiss Report
                </button>
                <button
                  onClick={() => handleUpdateReport(r.id, 'reviewed')}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
                >
                  Action & Close
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
