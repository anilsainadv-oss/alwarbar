'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, Users, BookOpen, FileText, MessageSquare, 
  CheckCircle2, AlertTriangle, ArrowRight, Activity, Plus 
} from 'lucide-react';
import type { AdvocateProfile, WelfareScheme, LegalUpdate, AuditLog } from '@/types/database';

export default function PublicAdminDashboard() {
  const [profiles, setProfiles] = useState<AdvocateProfile[]>([]);
  const [schemes, setSchemes] = useState<WelfareScheme[]>([]);
  const [laws, setLaws] = useState<LegalUpdate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/public/advocates').then(r => r.json()),
      fetch('/api/admin/public/welfare').then(r => r.json()),
      fetch('/api/admin/public/laws').then(r => r.json()),
      fetch('/api/admin/public/audit-logs').then(r => r.json()),
    ])
      .then(([profData, welfData, lawData, logData]) => {
        if (profData.profiles) setProfiles(profData.profiles);
        if (welfData.schemes) setSchemes(welfData.schemes);
        if (lawData.laws) setLaws(lawData.laws);
        if (logData.logs) setAuditLogs(logData.logs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const verifiedAdvocates = profiles.filter(p => p.is_verified);
  const pendingVerifications = profiles.filter(p => !p.is_verified);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
            <Shield className="w-4 h-4" />
            <span>Public Portal Administration (Panel 1)</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
            Portal Operations & Content Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorize Bar Association announcements, publish welfare schemes, and verify advocate enrollments.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/public-admin/advocates"
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Verify Directory</span>
          </Link>
          <Link
            href="/public-admin/welfare"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Welfare Scheme</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Verified Advocates</span>
          <div className="text-2xl font-bold font-serif text-slate-900">{verifiedAdvocates.length}</div>
          <span className="text-[11px] text-emerald-700 font-medium">On Public Roll</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Pending Review</span>
          <div className="text-2xl font-bold font-serif text-amber-800">{pendingVerifications.length}</div>
          <span className="text-[11px] text-amber-700 font-medium">Verification queue</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Welfare Schemes</span>
          <div className="text-2xl font-bold font-serif text-blue-900">{schemes.length}</div>
          <span className="text-[11px] text-blue-700 font-medium">Active Funds</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Published Acts/Judgments</span>
          <div className="text-2xl font-bold font-serif text-purple-900">{laws.length}</div>
          <span className="text-[11px] text-purple-700 font-medium">Verified Digests</span>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Pending Verifications & Content Links (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
                <Users className="w-4 h-4 text-amber-700" />
                <span>Advocate Directory Enrollment Verifications</span>
              </h2>
              <Link href="/public-admin/advocates" className="text-xs text-blue-700 font-semibold hover:underline">
                Manage All →
              </Link>
            </div>

            <div className="space-y-3">
              {profiles.slice(0, 4).map(prof => (
                <div key={prof.id} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <span>{prof.user?.full_name}</span>
                      {prof.is_verified ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">Pending</span>
                      )}
                    </div>
                    <div className="text-slate-500 font-mono text-[11px]">Enrollment: {prof.bar_council_enrollment_no}</div>
                  </div>

                  <Link
                    href="/public-admin/advocates"
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
                  >
                    Inspect
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/public-admin/welfare"
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-500 transition space-y-2 block"
            >
              <h3 className="font-bold text-sm text-slate-900">Welfare Schemes</h3>
              <p className="text-xs text-slate-500">Edit benefits, application rules, and deadline notices.</p>
            </Link>

            <Link
              href="/public-admin/laws"
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition space-y-2 block"
            >
              <h3 className="font-bold text-sm text-slate-900">Laws & Judgments</h3>
              <p className="text-xs text-slate-500">Add BNS/BNSS digests and High Court judgments.</p>
            </Link>

            <Link
              href="/public-admin/forum"
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-purple-500 transition space-y-2 block"
            >
              <h3 className="font-bold text-sm text-slate-900">Community Moderation</h3>
              <p className="text-xs text-slate-500">Review reported posts and spam controls.</p>
            </Link>
          </div>
        </div>

        {/* Right: Administrative Audit Log */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-slate-700" />
              <span>Administrative Audit Trail</span>
            </h2>
            <Link href="/public-admin/audit-logs" className="text-xs text-slate-500 hover:underline">
              Full Logs
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            {auditLogs.slice(0, 5).map(log => (
              <div key={log.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-blue-900 uppercase">
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  Actor: <strong>{log.actor_name}</strong> ({log.actor_role})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
