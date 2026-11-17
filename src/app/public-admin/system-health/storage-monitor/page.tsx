'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HardDrive,
  Database,
  Server,
  AlertTriangle,
  CheckCircle2,
  Info,
  AlertOctagon,
  TrendingUp,
  FileText,
  Layers,
  Scale,
  RefreshCw,
  Clock,
  ArrowLeft,
  ShieldCheck,
  Cpu,
  Folder,
  BarChart3,
  Loader2,
  Camera,
  Check,
  Sliders,
  ExternalLink
} from 'lucide-react';
import type {
  StorageUsageMetrics,
  DatabaseUsageMetrics,
  JudgmentDatabaseStatistics,
  StorageAlertLevel,
  DailyUsageTrendPoint
} from '@/types/storage-monitor';

export default function StorageAndDatabaseMonitorPage() {
  const [storageMetrics, setStorageMetrics] = useState<StorageUsageMetrics | null>(null);
  const [databaseMetrics, setDatabaseMetrics] = useState<DatabaseUsageMetrics | null>(null);
  const [judgmentStats, setJudgmentStats] = useState<JudgmentDatabaseStatistics | null>(null);
  const [trendPoints, setTrendPoints] = useState<DailyUsageTrendPoint[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError(null);

    try {
      const [storageRes, dbRes, historyRes] = await Promise.all([
        fetch('/api/admin/system/storage-usage'),
        fetch('/api/admin/system/database-usage'),
        fetch('/api/admin/system/usage-history?days=30')
      ]);

      if (!storageRes.ok || !dbRes.ok) {
        throw new Error('Failed to retrieve system usage telemetry. Please verify administrative session.');
      }

      const storageData: StorageUsageMetrics = await storageRes.json();
      const dbData: { database: DatabaseUsageMetrics; judgments: JudgmentDatabaseStatistics } = await dbRes.json();
      const historyData: { trends: DailyUsageTrendPoint[] } = await historyRes.json();

      setStorageMetrics(storageData);
      setDatabaseMetrics(dbData.database);
      setJudgmentStats(dbData.judgments);
      setTrendPoints(historyData.trends || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading monitoring metrics';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleTakeSnapshot = async () => {
    setSnapshotLoading(true);
    try {
      const res = await fetch('/api/admin/system/usage-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual_trigger: true })
      });
      if (res.ok) {
        setSnapshotSuccess(true);
        setTimeout(() => setSnapshotSuccess(false), 3000);
        // Refresh history
        const historyRes = await fetch('/api/admin/system/usage-history?days=30');
        if (historyRes.ok) {
          const data = await historyRes.json();
          setTrendPoints(data.trends || []);
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setSnapshotLoading(false);
    }
  };

  const getAlertColor = (level: StorageAlertLevel) => {
    switch (level) {
      case 'emergency':
        return {
          bg: 'bg-rose-50 border-rose-300 text-rose-900',
          badge: 'bg-rose-600 text-white',
          bar: 'bg-rose-600',
          border: 'border-rose-400'
        };
      case 'critical':
        return {
          bg: 'bg-orange-50 border-orange-300 text-orange-900',
          badge: 'bg-orange-600 text-white',
          bar: 'bg-orange-500',
          border: 'border-orange-400'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-300 text-amber-900',
          badge: 'bg-amber-600 text-white',
          bar: 'bg-amber-500',
          border: 'border-amber-400'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-300 text-blue-900',
          badge: 'bg-blue-600 text-white',
          bar: 'bg-blue-500',
          border: 'border-blue-400'
        };
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          badge: 'bg-emerald-600 text-white',
          bar: 'bg-emerald-600',
          border: 'border-emerald-300'
        };
    }
  };

  const highestAlertLevel: StorageAlertLevel =
    storageMetrics?.alertLevel === 'emergency' || databaseMetrics?.alertLevel === 'emergency'
      ? 'emergency'
      : storageMetrics?.alertLevel === 'critical' || databaseMetrics?.alertLevel === 'critical'
      ? 'critical'
      : storageMetrics?.alertLevel === 'warning' || databaseMetrics?.alertLevel === 'warning'
      ? 'warning'
      : storageMetrics?.alertLevel === 'info' || databaseMetrics?.alertLevel === 'info'
      ? 'info'
      : 'normal';

  const alertColors = getAlertColor(highestAlertLevel);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Breadcrumb Navigation & Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
            <Link href="/public-admin/dashboard" className="hover:text-blue-700 flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Dashboard</span>
            </Link>
            <span>/</span>
            <span className="text-slate-600">System Health</span>
            <span>/</span>
            <span className="text-blue-700 font-semibold">Storage & Database Monitor</span>
          </div>

          <div className="flex items-center space-x-3 mt-2">
            <div className="p-2.5 bg-blue-700 text-white rounded-xl shadow-sm">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900">
                Storage & Database Usage Monitor
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time Supabase storage quota tracking, PostgreSQL database sizing, physical disk allocation & legal judgment metrics.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleTakeSnapshot}
            disabled={snapshotLoading}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 ${
              snapshotSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-300'
            }`}
          >
            {snapshotLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : snapshotSuccess ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
            <span>{snapshotSuccess ? 'Snapshot Saved' : 'Take Snapshot Now'}</span>
          </button>

          <button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-700' : ''}`} />
            <span>Refresh Metrics</span>
          </button>

          <Link
            href="/public-admin/legal-library"
            className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Legal Library</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchMetrics(true)} className="underline font-bold">
            Retry
          </button>
        </div>
      )}

      {/* Top Banner: Status & Threshold Alert */}
      {highestAlertLevel !== 'normal' && (
        <div className={`p-4 rounded-xl border ${alertColors.bg} flex items-start justify-between gap-4 shadow-sm`}>
          <div className="flex items-start space-x-3">
            {highestAlertLevel === 'emergency' ? (
              <AlertOctagon className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
            ) : highestAlertLevel === 'critical' ? (
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            ) : highestAlertLevel === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${alertColors.badge}`}>
                  {highestAlertLevel} Alert ({storageMetrics?.usagePercentage}% Storage)
                </span>
                {storageMetrics?.isUploadAllowed === false && (
                  <span className="text-[10px] bg-rose-700 text-white font-bold px-2 py-0.5 rounded-full">
                    Uploads Suspended
                  </span>
                )}
              </div>
              <p className="text-xs font-medium mt-1">
                {storageMetrics?.alertMessage || 'Storage capacity requires administrative attention.'}
              </p>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-500 font-mono hidden sm:block">
            Threshold: 60% Info • 75% Warning • 85% Critical • 95% Emergency
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-700 mx-auto" />
          <div className="text-sm font-medium text-slate-600">
            Gathering Supabase storage bucket metadata & database sizing metrics...
          </div>
        </div>
      ) : (
        <>
          {/* SECTION 1: STORAGE & DATABASE USAGE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Supabase Storage Quota (Free Plan: 1 GB) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-blue-900 font-bold text-sm">
                    <HardDrive className="w-4 h-4 text-blue-700" />
                    <span>Supabase Storage</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getAlertColor(storageMetrics?.alertLevel || 'normal').badge}`}>
                    {storageMetrics?.alertLevel || 'normal'}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <div className="text-2xl font-bold font-serif text-slate-900">
                      {storageMetrics?.storageUsedFormatted}
                    </div>
                    <div className="text-xs text-slate-500">
                      of {storageMetrics?.storageQuotaFormatted} Free Plan quota
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-blue-700">
                      {storageMetrics?.usagePercentage}%
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium">
                      {storageMetrics?.remainingFormatted} free
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${getAlertColor(storageMetrics?.alertLevel || 'normal').bar}`}
                    style={{ width: `${Math.min(100, storageMetrics?.usagePercentage || 0)}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Total Files: <strong className="text-slate-700">{storageMetrics?.totalFiles}</strong></span>
                <span>Buckets: <strong className="text-slate-700">{storageMetrics?.buckets.length}</strong></span>
                <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {storageMetrics?.storageEngine}
                </span>
              </div>
            </div>

            {/* Card 2: PostgreSQL Database Quota (Free Plan: 500 MB) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-indigo-900 font-bold text-sm">
                    <Database className="w-4 h-4 text-indigo-700" />
                    <span>Database Size Quota</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getAlertColor(databaseMetrics?.alertLevel || 'normal').badge}`}>
                    {databaseMetrics?.alertLevel || 'normal'}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <div className="text-2xl font-bold font-serif text-slate-900">
                      {databaseMetrics?.databaseUsedFormatted}
                    </div>
                    <div className="text-xs text-slate-500">
                      of {databaseMetrics?.databaseQuotaFormatted} Free Plan quota
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-indigo-700">
                      {databaseMetrics?.databaseUsagePercentage}%
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium">
                      {databaseMetrics?.databaseRemainingFormatted} free
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${Math.min(100, databaseMetrics?.databaseUsagePercentage || 0)}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Total Records: <strong className="text-slate-700">{databaseMetrics?.totalRecords.toLocaleString()}</strong></span>
                <span>Index Footprint: <strong className="text-slate-700">{databaseMetrics?.totalIndexSizeFormatted}</strong></span>
                <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {databaseMetrics?.databaseEngine}
                </span>
              </div>
            </div>

            {/* Card 3: Physical Disk Allocation (Free Plan: 2 GB Allocation) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                    <Cpu className="w-4 h-4 text-slate-700" />
                    <span>Physical Disk Allocation</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                    Free Plan: 2 GB
                  </span>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <div className="text-2xl font-bold font-serif text-slate-900">
                      {databaseMetrics?.physicalDiskUsedFormatted || 'Cloud-Managed'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {databaseMetrics?.physicalDiskStatus === 'available'
                        ? `of ${databaseMetrics.physicalDiskQuotaFormatted} allocation`
                        : 'Distinct from 500 MB DB quota'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                      {databaseMetrics?.physicalDiskStatus === 'available' ? 'Measured' : 'Unprivileged API'}
                    </span>
                  </div>
                </div>

                {/* Progress bar or cloud indicator */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full bg-slate-700 transition-all duration-500"
                    style={{
                      width: databaseMetrics?.physicalDiskUsedBytes
                        ? `${Math.min(100, (databaseMetrics.physicalDiskUsedBytes / databaseMetrics.physicalDiskQuotaBytes) * 100)}%`
                        : '10%'
                    }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="line-clamp-1" title={databaseMetrics?.physicalDiskStatusMessage}>
                  {databaseMetrics?.physicalDiskStatusMessage}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: JUDGMENT DATABASE INTELLIGENCE METRICS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
              <div>
                <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
                  <Scale className="w-4 h-4 text-blue-700" />
                  <span>Rajasthan Judgment Database & Ingestion Telemetry</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  High Court judgments, automated FlateDecode OCR parsing, pgvector chunks, and embedding indexing.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Last checked: {storageMetrics ? new Date(storageMetrics.lastUpdated).toLocaleTimeString() : '--'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Judgments</span>
                <div className="text-xl font-bold font-serif text-slate-900">{judgmentStats?.totalJudgments}</div>
                <span className="text-[10px] text-blue-700 font-medium">In Library</span>
              </div>

              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-emerald-700">Verified Precedents</span>
                <div className="text-xl font-bold font-serif text-emerald-900">{judgmentStats?.verifiedJudgments}</div>
                <span className="text-[10px] text-emerald-700 font-medium">Publicly Searchable</span>
              </div>

              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-700">Pending Review</span>
                <div className="text-xl font-bold font-serif text-amber-900">{judgmentStats?.pendingJudgments}</div>
                <span className="text-[10px] text-amber-700 font-medium">Review Queue</span>
              </div>

              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-blue-700">PDF Documents</span>
                <div className="text-xl font-bold font-serif text-blue-900">{judgmentStats?.totalPdfDocuments}</div>
                <span className="text-[10px] text-blue-700 font-medium">Binary PDF Sources</span>
              </div>

              <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-purple-700">Document Chunks</span>
                <div className="text-xl font-bold font-serif text-purple-900">{judgmentStats?.totalDocumentChunks}</div>
                <span className="text-[10px] text-purple-700 font-medium">HNSW Indexed</span>
              </div>

              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-indigo-700">1536-Dim Embeddings</span>
                <div className="text-xl font-bold font-serif text-indigo-900">{judgmentStats?.totalEmbeddings}</div>
                <span className="text-[10px] text-indigo-700 font-medium">pgvector Cosine Ready</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Extracted Legal Text</span>
                <div className="text-xs font-bold text-slate-900 truncate" title={judgmentStats?.totalExtractedTextFormatted}>
                  {judgmentStats?.totalExtractedTextFormatted}
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Clean Corpus</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Manual Ingestions</span>
                <div className="text-xl font-bold font-serif text-slate-900">{judgmentStats?.manualUploads}</div>
                <span className="text-[10px] text-slate-500 font-medium">Admin Uploaded</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Official Imports</span>
                <div className="text-xl font-bold font-serif text-slate-900">{judgmentStats?.automaticImports}</div>
                <span className="text-[10px] text-slate-500 font-medium">Court Sources</span>
              </div>

              <div className={`p-3.5 rounded-xl border space-y-1 ${
                (judgmentStats?.failedProcessingDocuments || 0) > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50 border-emerald-100 text-emerald-900'
              }`}>
                <span className="text-[10px] font-bold uppercase text-slate-400">Failed Processing</span>
                <div className="text-xl font-bold font-serif">{judgmentStats?.failedProcessingDocuments}</div>
                <span className="text-[10px] font-medium">
                  {(judgmentStats?.failedProcessingDocuments || 0) > 0 ? 'Requires OCR Retry' : 'Zero Failures'}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: DAILY USAGE TREND CHART */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                <span>Daily Storage & Database Growth Trends (Last 30 Days)</span>
              </h2>
              <div className="flex items-center space-x-4 text-xs">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                  <span className="text-slate-600">Storage (MB)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                  <span className="text-slate-600">Database (MB)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                  <span className="text-slate-600">PDF Count</span>
                </span>
              </div>
            </div>

            {trendPoints.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No historical snapshots recorded yet. Click "Take Snapshot Now" to record the first historical trend point.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual Bar Chart */}
                <div className="h-44 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
                  {trendPoints.slice(-14).map((pt, idx) => {
                    const maxMb = Math.max(...trendPoints.map(p => Math.max(p.storageMb, p.databaseMb)), 30);
                    const storageHeight = Math.max(8, (pt.storageMb / maxMb) * 120);
                    const dbHeight = Math.max(6, (pt.databaseMb / maxMb) * 120);

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        {/* Hover Tooltip */}
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded px-2 py-1 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                          <div><strong>{pt.date}</strong></div>
                          <div>Storage: {pt.storageMb} MB • DB: {pt.databaseMb} MB</div>
                          <div>PDFs: {pt.pdfCount} • Chunks: {pt.chunkCount}</div>
                        </div>

                        {/* Dual Bar Group */}
                        <div className="w-full flex items-end justify-center gap-1">
                          <div
                            className="w-2.5 sm:w-3.5 bg-blue-600 rounded-t transition-all group-hover:bg-blue-700"
                            style={{ height: `${storageHeight}px` }}
                          />
                          <div
                            className="w-2.5 sm:w-3.5 bg-indigo-600 rounded-t transition-all group-hover:bg-indigo-700"
                            style={{ height: `${dbHeight}px` }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 font-mono truncate w-full text-center">
                          {pt.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Earliest recorded snapshot: <strong>{trendPoints[0]?.date}</strong></span>
                  <span>Latest recorded snapshot: <strong>{trendPoints[trendPoints.length - 1]?.date}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: TWO-COLUMN TABLE VIEW (BUCKETS & LARGEST PDFS) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Bucket-Wise Usage Table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
                  <Folder className="w-4 h-4 text-blue-700" />
                  <span>Supabase Storage Buckets Breakdown</span>
                </h2>
                <span className="text-xs text-slate-500">
                  {storageMetrics?.buckets.length} Active Buckets
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Bucket Name</th>
                      <th className="py-2.5 px-3 font-semibold">Access</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Files</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Total Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {storageMetrics?.buckets.map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {b.name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            b.isPublic ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {b.isPublic ? 'Public' : 'Private (RLS)'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                          {b.fileCount}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">
                          {b.totalSizeFormatted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Top Largest Uploaded PDF Documents */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-purple-700" />
                  <span>Largest Uploaded PDF Documents</span>
                </h2>
                <span className="text-xs text-slate-500">Top 10 Files</span>
              </div>

              {storageMetrics?.largestPdfs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No PDF files detected in storage yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Document / Filename</th>
                        <th className="py-2.5 px-3 font-semibold">Court / Case</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {storageMetrics?.largestPdfs.map((pdf, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-3 max-w-[200px]">
                            <div className="font-medium text-slate-900 truncate" title={pdf.filename}>
                              {pdf.filename}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate" title={pdf.storagePath}>
                              {pdf.storagePath}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 max-w-[150px]">
                            <div className="text-[11px] font-semibold text-slate-800 truncate" title={pdf.documentTitle}>
                              {pdf.citation || pdf.documentTitle || 'Rajasthan Judgment'}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {pdf.courtName || 'Rajasthan High Court'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-900 whitespace-nowrap">
                            {pdf.fileSizeFormatted}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: CONFIGURABLE QUOTAS & SAFEGUARDS CALLOUT */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <Sliders className="w-4 h-4" />
                <span>Configurable Quota Architecture (Pro Plan Upgrade Ready)</span>
              </div>
              <p className="text-xs text-slate-300 max-w-3xl">
                Quotas are decoupled from code and read from environment variables (
                <code className="text-amber-200">STORAGE_QUOTA_BYTES</code>,{' '}
                <code className="text-amber-200">DATABASE_QUOTA_BYTES</code>, and{' '}
                <code className="text-amber-200">PHYSICAL_DISK_QUOTA_BYTES</code>
                ). When upgrading to Supabase Pro (100 GB storage / 8 GB DB), update the environment variables without redeploying code.
              </p>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="px-3 py-2 bg-slate-800/90 rounded-lg text-xs font-mono text-emerald-400 border border-slate-700 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Auto-Deletion Active</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
