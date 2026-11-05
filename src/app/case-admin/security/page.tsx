'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, AlertTriangle } from 'lucide-react';
import type { AuditLog } from '@/types/database';

export default function CaseAdminSecurityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetch('/api/admin/public/audit-logs')
      .then(r => r.json())
      .then(data => {
        if (data.logs) setLogs(data.logs);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <Link
        href="/case-admin/dashboard"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Service Admin</span>
      </Link>

      <div className="border-b pb-4 border-slate-200">
        <h1 className="font-serif font-bold text-2xl text-slate-900">
          Security Audits & Multi-Tenant Boundary Events
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Access logs, session verifications, and tenant boundary telemetry.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
        <h3 className="font-serif font-bold text-sm text-slate-900">
          Automated Tenant Boundary Assurance
        </h3>
        <p className="text-slate-600 leading-relaxed">
          The security subsystem continuously intercepts requests to <code>/api/my-case/*</code>. Any attempt to read or mutate a case belonging to another advocate immediately yields an HTTP 403 Forbidden or 404 Not Found error and raises an alert.
        </p>

        <div className="space-y-2 pt-2">
          {logs.map(log => (
            <div key={log.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between font-mono text-[11px]">
              <div>
                <span className="font-bold text-slate-900">{log.action}</span>
                <span className="text-slate-400 ml-2">by {log.actor_name}</span>
              </div>
              <span className="text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
