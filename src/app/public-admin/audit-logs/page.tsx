'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, Shield } from 'lucide-react';
import type { AuditLog } from '@/types/database';

export default function AdminAuditLogsPage() {
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
        href="/public-admin/dashboard"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Portal Admin</span>
      </Link>

      <div className="border-b pb-4 border-slate-200">
        <h1 className="font-serif font-bold text-2xl text-slate-900">
          Public Portal Administrative Audit Trail
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable system log recording content publication, verification actions, and moderation decisions.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Action</th>
              <th className="p-3.5">Actor</th>
              <th className="p-3.5">Target Entity</th>
              <th className="p-3.5">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="p-3.5 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                <td className="p-3.5 font-bold text-blue-900">{log.action}</td>
                <td className="p-3.5 text-slate-700 font-sans">{log.actor_name} ({log.actor_role})</td>
                <td className="p-3.5 text-slate-500">{log.entity_type} #{log.entity_id?.slice(0, 8)}</td>
                <td className="p-3.5 text-slate-400">{log.ip_address || '127.0.0.1'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
