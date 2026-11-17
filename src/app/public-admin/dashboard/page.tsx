'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, Users, BookOpen, FileText, MessageSquare, 
  CheckCircle2, AlertTriangle, ArrowRight, Activity, Plus, Scale, Server, HardDrive, AlertOctagon, Info
} from 'lucide-react';
import type { AdvocateProfile, WelfareScheme, LegalUpdate, AuditLog } from '@/types/database';

export default function PublicAdminDashboard() {
  const [profiles, setProfiles] = useState<AdvocateProfile[]>([]);
  const [schemes, setSchemes] = useState<WelfareScheme[]>([]);
  const [laws, setLaws] = useState<LegalUpdate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [storageAlert, setStorageAlert] = useState<{
    level: 'normal' | 'info' | 'warning' | 'critical' | 'emergency';
    percentage: number;
    message?: string;
  } | null>(null);
  const [pendingCourtDocs, setPendingCourtDocs] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/public/advocates').then(r => r.json()),
      fetch('/api/admin/public/welfare').then(r => r.json()),
      fetch('/api/admin/public/laws').then(r => r.json()),
      fetch('/api/admin/public/audit-logs').then(r => r.json()),
      fetch('/api/admin/system/storage-usage').then(r => r.json()).catch(() => null),
      fetch('/api/admin/public/legal-library?status=pending').then(r => r.json()).catch(() => null),
    ])
      .then(([profData, welfData, lawData, logData, storageData, legalData]) => {
        if (profData?.profiles) setProfiles(profData.profiles);
        if (welfData?.schemes) setSchemes(welfData.schemes);
        if (lawData?.laws) setLaws(lawData.laws);
        if (logData?.logs) setAuditLogs(logData.logs);
        if (legalData?.metrics?.pendingCount) setPendingCourtDocs(legalData.metrics.pendingCount);
        if (storageData && storageData.alertLevel) {
          setStorageAlert({
            level: storageData.alertLevel,
            percentage: storageData.usagePercentage || 0,
            message: storageData.alertMessage
          });
        }
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
            href="/public-admin/system-health/storage-monitor"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1"
          >
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>System Health</span>
          </Link>
          <Link
            href="/public-admin/legal-library"
            className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Legal Library & AI</span>
          </Link>
          <Link
            href="/public-admin/advocates"
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Verify Directory</span>
          </Link>
          <Link
            href="/public-admin/welfare?tab=dues"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Welfare & Dues</span>
          </Link>
        </div>
      </div>

      {/* Storage Alert Notification (Configurable 60% Info, 75% Warning, 85% Critical, 95% Emergency) */}
      {storageAlert && storageAlert.level !== 'normal' && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 shadow-sm ${
          storageAlert.level === 'emergency'
            ? 'bg-rose-50 border-rose-300 text-rose-900'
            : storageAlert.level === 'critical'
            ? 'bg-orange-50 border-orange-300 text-orange-900'
            : storageAlert.level === 'warning'
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <div className="flex items-center space-x-3">
            {storageAlert.level === 'emergency' ? (
              <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0" />
            ) : storageAlert.level === 'critical' || storageAlert.level === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
            )}
            <div>
              <span className="font-bold text-xs uppercase tracking-wider">
                Storage Alert ({storageAlert.percentage}% Used):
              </span>{' '}
              <span className="text-xs">{storageAlert.message}</span>
            </div>
          </div>
          <Link
            href="/public-admin/system-health/storage-monitor"
            className="px-3 py-1 bg-white hover:bg-slate-50 border rounded text-xs font-semibold whitespace-nowrap"
          >
            Inspect Storage →
          </Link>
        </div>
      )}

      {/* Court Ingestion Review Gate Alert */}
      {pendingCourtDocs > 0 && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <Scale className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-amber-900">
                Court Ingestion Alert:
              </span>{' '}
              <span className="text-xs font-medium">
                आज राजस्थान हाई कोर्ट / सुप्रीम कोर्ट के <strong>{pendingCourtDocs} नए फैसले</strong> डाउनलोड हुए हैं (Pending Review)।
              </span>
            </div>
          </div>
          <Link
            href="/public-admin/legal-library?status=pending"
            className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-sm transition"
          >
            Review & Approve →
          </Link>
        </div>
      )}

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/public-admin/system-health/storage-monitor"
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition space-y-2 block"
            >
              <div className="flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-blue-700" />
                <h3 className="font-bold text-sm text-slate-900">Storage & Database Monitor</h3>
              </div>
              <p className="text-xs text-slate-500">Track 1 GB Supabase storage quota, 500 MB DB size, 2 GB physical disk & alerts.</p>
            </Link>

            <Link
              href="/public-admin/legal-library"
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-500 transition space-y-2 block"
            >
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-indigo-700" />
                <h3 className="font-bold text-sm text-slate-900">Precedent Library & AI</h3>
              </div>
              <p className="text-xs text-slate-500">Manage pgvector case laws, OCR indexing, and RAG verification.</p>
            </Link>

            <Link
              href="/public-admin/welfare?tab=dues"
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-500 transition space-y-2 block"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Welfare Schemes & BCR Dues</h3>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">18 Bars</span>
              </div>
              <p className="text-xs text-slate-500">Manage welfare benefits, circulars & inspect BCR Dues Register for 18 Bar Associations.</p>
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
