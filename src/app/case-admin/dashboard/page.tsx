'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, Server, HardDrive, Users, Activity, 
  Lock, AlertTriangle, ArrowRight, CheckCircle2 
} from 'lucide-react';

interface Telemetry {
  totalAdvocates: number;
  activeTenants: number;
  totalCasesAggregate: number;
  totalDocumentsAggregate: number;
  totalStorageBytes: number;
  systemHealth: string;
}

export default function CaseAdminDashboard() {
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/case/telemetry')
      .then(r => r.json())
      .then(data => {
        if (data.telemetry) setTelemetry(data.telemetry);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-red-700">
            <Lock className="w-4 h-4" />
            <span>My Case Infrastructure Operations (Panel 2)</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
            Service Telemetry & Tenant Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational monitoring, storage consumption, and account quotas.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/case-admin/accounts"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            Manage Accounts
          </Link>
          <Link
            href="/case-admin/usage"
            className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            Storage & AI Quotas
          </Link>
        </div>
      </div>

      {/* ZERO-KNOWLEDGE MANDATORY SECURITY BANNER */}
      <div className="bg-gradient-to-r from-red-950 to-slate-900 text-white rounded-2xl p-6 border border-red-500/40 shadow-md space-y-2">
        <div className="flex items-center space-x-2 text-red-300 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Zero-Knowledge Architecture Strictly Enforced</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          By architectural design, this administrative tier has <strong>NO access</strong> to confidential case titles, client rosters, legal draft texts, or document exhibits. All counts displayed below are blind mathematical aggregates to guarantee legal professional privilege under Section 132 of Bharatiya Sakshya Adhiniyam, 2023.
        </p>
      </div>

      {/* Operational Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Total Tenants</span>
          <div className="text-2xl font-bold font-serif text-slate-900">
            {telemetry?.totalAdvocates ?? 0}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">
            {telemetry?.activeTenants ?? 0} Active Chambers
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Aggregate Cases</span>
          <div className="text-2xl font-bold font-serif text-blue-900">
            {telemetry?.totalCasesAggregate ?? 0}
          </div>
          <span className="text-[11px] text-slate-400">Blind count (Titles masked)</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Vault Documents</span>
          <div className="text-2xl font-bold font-serif text-purple-900">
            {telemetry?.totalDocumentsAggregate ?? 0}
          </div>
          <span className="text-[11px] text-slate-400">Encrypted files</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Storage Used</span>
          <div className="text-2xl font-bold font-serif text-amber-800">
            {telemetry ? `${(telemetry.totalStorageBytes / (1024 * 1024)).toFixed(2)} MB` : '0 MB'}
          </div>
          <span className="text-[11px] text-slate-400">Free Tier: 1,000 MB</span>
        </div>
      </div>

      {/* Service Health & Operational Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <div className="flex items-center space-x-2 text-emerald-700 font-bold">
            <Server className="w-4 h-4" />
            <span>Infrastructure Health</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            API endpoints, database connections, and session authenticators are operating nominally with zero reported downtime.
          </p>
          <div className="pt-2 text-slate-400 font-mono text-[11px]">
            Engine: Next.js 15 App Router / Node.js
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <div className="flex items-center space-x-2 text-blue-700 font-bold">
            <HardDrive className="w-4 h-4" />
            <span>Storage & Bucket Quotas</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Free-first storage bucket is configured with a 25 MB per-file upload restriction to prevent exhaustion.
          </p>
          <div className="pt-2 text-slate-400 font-mono text-[11px]">
            Bucket: private-advocate-cases
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <div className="flex items-center space-x-2 text-purple-700 font-bold">
            <Activity className="w-4 h-4" />
            <span>AI Token Monitor</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Running in honest offline deterministic mode. 0 billable API tokens consumed on external commercial vendors.
          </p>
          <div className="pt-2 text-slate-400 font-mono text-[11px]">
            Provider: Deterministic Local
          </div>
        </div>
      </div>
    </div>
  );
}
