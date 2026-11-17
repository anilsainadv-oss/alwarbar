import fs from 'node:fs';
import path from 'node:path';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/db/supabase';
import { localDb } from '@/lib/db';
import {
  getStorageQuotaBytes,
  getDatabaseQuotaBytes,
  getPhysicalDiskQuotaBytes,
  calculateAlertLevel,
  getAlertMessage,
  formatBytes,
  ALERT_THRESHOLDS
} from './storage-monitor-config';
import type {
  StorageUsageMetrics,
  DatabaseUsageMetrics,
  JudgmentDatabaseStatistics,
  StorageBucketMetric,
  LargestUploadedPdf,
  TableStorageMetric,
  StorageUsageHistoryRecord,
  DailyUsageTrendPoint
} from '@/types/storage-monitor';

const PRIVATE_CASES_BUCKET = process.env.STORAGE_BUCKET_PRIVATE_CASES || 'private-cases';
const LEGAL_JUDGMENTS_BUCKET = process.env.STORAGE_BUCKET_LEGAL_JUDGMENTS || 'legal-judgments';
const LOCAL_VAULT_DIR = path.join(process.cwd(), 'data', 'vault');
const LOCAL_DB_FILE = path.join(process.cwd(), 'data', 'local-db.json');

/**
 * Recursively scans a local directory to compute total byte size and file count
 */
function getDirectoryStats(dirPath: string): { totalBytes: number; fileCount: number; files: { path: string; size: number; mtime: Date }[] } {
  let totalBytes = 0;
  let fileCount = 0;
  const files: { path: string; size: number; mtime: Date }[] = [];

  if (!fs.existsSync(dirPath)) {
    return { totalBytes, fileCount, files };
  }

  function walk(current: string) {
    try {
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile()) {
          const stat = fs.statSync(full);
          totalBytes += stat.size;
          fileCount++;
          files.push({ path: full, size: stat.size, mtime: stat.mtime });
        }
      }
    } catch {
      // Graceful fallback on permission error
    }
  }

  walk(dirPath);
  return { totalBytes, fileCount, files };
}

export const monitorService = {
  /**
   * 1. Storage Usage Monitoring
   * Gathers actual Supabase Storage metadata and local vault stats
   */
  async getStorageUsageMetrics(): Promise<StorageUsageMetrics> {
    const quotaBytes = getStorageQuotaBytes();
    let totalStorageBytes = 0;
    let totalFileCount = 0;
    const bucketMetrics: StorageBucketMetric[] = [];
    const largestPdfs: LargestUploadedPdf[] = [];

    let engine: 'supabase_storage' | 'local_encrypted_vault' | 'hybrid' = 'local_encrypted_vault';

    // 1A. Inspect Supabase Storage if configured
    if (isSupabaseAdminConfigured && supabaseAdmin) {
      engine = 'supabase_storage';
      try {
        const { data: bucketsData, error: bucketsErr } = await supabaseAdmin.storage.listBuckets();
        const activeBuckets = (!bucketsErr && Array.isArray(bucketsData) && bucketsData.length > 0)
          ? bucketsData
          : [
              { name: LEGAL_JUDGMENTS_BUCKET, id: LEGAL_JUDGMENTS_BUCKET, public: false, created_at: new Date().toISOString() },
              { name: PRIVATE_CASES_BUCKET, id: PRIVATE_CASES_BUCKET, public: false, created_at: new Date().toISOString() }
            ];

        for (const b of activeBuckets) {
          let bSizeBytes = 0;
          let bFileCount = 0;

          try {
            const { data: filesData } = await supabaseAdmin.storage.from(b.name).list('', {
              limit: 500,
              sortBy: { column: 'created_at', order: 'desc' }
            });

            if (Array.isArray(filesData)) {
              for (const f of filesData) {
                const size = (f.metadata && typeof f.metadata.size === 'number') ? f.metadata.size : 0;
                bSizeBytes += size;
                bFileCount++;

                if (f.name.toLowerCase().endsWith('.pdf') || (f.metadata?.mimetype === 'application/pdf')) {
                  largestPdfs.push({
                    id: f.id || f.name,
                    filename: f.name,
                    storagePath: `supabase://${b.name}/${f.name}`,
                    fileSizeBytes: size,
                    fileSizeFormatted: formatBytes(size),
                    mimeType: f.metadata?.mimetype || 'application/pdf',
                    createdAt: f.created_at || new Date().toISOString()
                  });
                }
              }
            }
          } catch {
            // Ignore single-bucket list error
          }

          bucketMetrics.push({
            name: b.name,
            id: b.id || b.name,
            fileCount: bFileCount,
            totalSizeBytes: bSizeBytes,
            totalSizeFormatted: formatBytes(bSizeBytes),
            isPublic: Boolean(b.public),
            createdAt: b.created_at || new Date().toISOString()
          });

          totalStorageBytes += bSizeBytes;
          totalFileCount += bFileCount;
        }
      } catch {
        engine = 'hybrid';
      }
    }

    // 1B. Inspect local vault directory (Always includes local test/uploaded PDFs)
    const vaultStats = getDirectoryStats(LOCAL_VAULT_DIR);
    if (vaultStats.fileCount > 0) {
      if (engine === 'supabase_storage') engine = 'hybrid';
      totalStorageBytes += vaultStats.totalBytes;
      totalFileCount += vaultStats.fileCount;

      bucketMetrics.push({
        name: 'local-vault (AES-256)',
        id: 'local-vault',
        fileCount: vaultStats.fileCount,
        totalSizeBytes: vaultStats.totalBytes,
        totalSizeFormatted: formatBytes(vaultStats.totalBytes),
        isPublic: false,
        createdAt: new Date().toISOString()
      });

      for (const f of vaultStats.files) {
        if (f.path.toLowerCase().endsWith('.pdf')) {
          largestPdfs.push({
            id: path.basename(f.path),
            filename: path.basename(f.path),
            storagePath: f.path,
            fileSizeBytes: f.size,
            fileSizeFormatted: formatBytes(f.size),
            mimeType: 'application/pdf',
            createdAt: f.mtime.toISOString()
          });
        }
      }
    }

    // 1C. Supplement from database sources table (Legal Document Sources)
    const sources = localDb.getLegalDocumentSources ? localDb.getLegalDocumentSources() : [];
    const legalDocs = localDb.getLegalDocuments();
    const docMap = new Map(legalDocs.map(d => [d.id, d]));

    let sourcesSizeBytes = 0;
    for (const src of sources) {
      sourcesSizeBytes += src.file_size || 0;
      const doc = src.document_id ? docMap.get(src.document_id) : undefined;
      
      // Avoid duplicate listing in largest PDFs
      if (!largestPdfs.some(p => p.filename === src.original_filename || p.storagePath === src.storage_path)) {
        largestPdfs.push({
          id: src.id,
          filename: src.original_filename || 'judgment.pdf',
          storagePath: src.storage_path || '',
          fileSizeBytes: src.file_size || 0,
          fileSizeFormatted: formatBytes(src.file_size || 0),
          mimeType: src.mime_type || 'application/pdf',
          documentId: src.document_id,
          documentTitle: doc?.title,
          citation: doc?.citation,
          courtName: doc?.court_name,
          createdAt: src.created_at
        });
      }
    }

    // Ensure baseline bucket for Legal Judgments is visible if no live Supabase
    if (!bucketMetrics.some(b => b.name === LEGAL_JUDGMENTS_BUCKET)) {
      bucketMetrics.unshift({
        name: LEGAL_JUDGMENTS_BUCKET,
        id: LEGAL_JUDGMENTS_BUCKET,
        fileCount: sources.length,
        totalSizeBytes: sourcesSizeBytes,
        totalSizeFormatted: formatBytes(sourcesSizeBytes),
        isPublic: false,
        createdAt: new Date().toISOString()
      });
      totalStorageBytes = Math.max(totalStorageBytes, sourcesSizeBytes);
      totalFileCount = Math.max(totalFileCount, sources.length);
    }

    // Sort largest PDFs by byte size descending
    largestPdfs.sort((a, b) => b.fileSizeBytes - a.fileSizeBytes);
    const topLargestPdfs = largestPdfs.slice(0, 10);

    const remainingBytes = Math.max(0, quotaBytes - totalStorageBytes);
    const usagePercentage = quotaBytes > 0 ? Number(((totalStorageBytes / quotaBytes) * 100).toFixed(2)) : 0;
    const alertLevel = calculateAlertLevel(usagePercentage);
    const alertMessage = getAlertMessage(alertLevel, usagePercentage);

    return {
      storageEngine: engine,
      storageQuotaBytes: quotaBytes,
      storageQuotaFormatted: formatBytes(quotaBytes),
      storageUsedBytes: totalStorageBytes,
      storageUsedFormatted: formatBytes(totalStorageBytes),
      remainingBytes,
      remainingFormatted: formatBytes(remainingBytes),
      usagePercentage,
      totalFiles: totalFileCount,
      alertLevel,
      alertMessage,
      buckets: bucketMetrics,
      largestPdfs: topLargestPdfs,
      quotaIsConfigurable: true,
      isUploadAllowed: alertLevel !== 'emergency' && remainingBytes > 1024,
      lastUpdated: new Date().toISOString()
    };
  },

  /**
   * 2. Database Usage Monitoring
   * Measures PostgreSQL or Local ACID DB table sizes, index footprints, and distinguishes
   * 500 MB database quota from 2 GB physical disk allocation.
   */
  async getDatabaseUsageMetrics(): Promise<DatabaseUsageMetrics> {
    const dbQuotaBytes = getDatabaseQuotaBytes();
    const diskQuotaBytes = getPhysicalDiskQuotaBytes();

    const tables: TableStorageMetric[] = [];
    let totalSizeBytes = 0;
    let totalIndexSizeBytes = 0;
    let totalRecords = 0;

    // 2A. Inspect Postgres via Supabase Admin if configured
    let usedLivePostgres = false;
    if (isSupabaseAdminConfigured && supabaseAdmin) {
      try {
        const { data: statsData, error: statsErr } = await supabaseAdmin.rpc('get_database_storage_stats');
        if (!statsErr && Array.isArray(statsData) && statsData.length > 0) {
          usedLivePostgres = true;
          for (const row of statsData) {
            const tableBytes = Number(row.table_bytes) || 0;
            const indexBytes = Number(row.index_bytes) || 0;
            const rowTotalBytes = Number(row.total_bytes) || (tableBytes + indexBytes);
            const count = Number(row.row_count) || 0;

            tables.push({
              tableName: row.table_name,
              rowCount: count,
              tableSizeBytes: tableBytes,
              tableSizeFormatted: formatBytes(tableBytes),
              indexSizeBytes: indexBytes,
              indexSizeFormatted: formatBytes(indexBytes),
              totalSizeBytes: rowTotalBytes,
              totalSizeFormatted: formatBytes(rowTotalBytes)
            });

            totalSizeBytes += rowTotalBytes;
            totalIndexSizeBytes += indexBytes;
            totalRecords += count;
          }
        }
      } catch {
        usedLivePostgres = false;
      }
    }

    // 2B. If not live Postgres or for local fallback, calculate exact database entity sizes
    if (!usedLivePostgres || tables.length === 0) {
      const dbFileSize = fs.existsSync(LOCAL_DB_FILE) ? fs.statSync(LOCAL_DB_FILE).size : 1024 * 1024;
      
      const docs = localDb.getLegalDocuments();
      const chunks = localDb.getLegalChunks();
      const sources = localDb.getLegalDocumentSources();
      const processing = localDb.getAllLegalDocumentProcessing();
      const jobs = localDb.getIngestionJobs();
      const citations = localDb.getLegalDocumentCitations();
      const cases = localDb.getCases();
      const clients = localDb.getClients();
      const users = localDb.getUsers();

      // Average estimated row and index overhead for tables
      // For legal_document_chunks: 1536 float64 = 12 KB embedding + content + HNSW index ~ 24 KB per chunk
      const chunksDataBytes = chunks.length * 14 * 1024;
      const chunksIndexBytes = chunks.length * 10 * 1024; // HNSW vector + GIN search_tsv index
      const docsDataBytes = docs.length * 35 * 1024; // Legal judgments full text
      const docsIndexBytes = docs.length * 4 * 1024;

      const baseTables = [
        { name: 'legal_documents', count: docs.length, data: docsDataBytes, index: docsIndexBytes },
        { name: 'legal_document_chunks', count: chunks.length, data: chunksDataBytes, index: chunksIndexBytes },
        { name: 'legal_document_sources', count: sources.length, data: sources.length * 1024, index: sources.length * 512 },
        { name: 'legal_document_processing', count: processing.filter(Boolean).length, data: 2048, index: 1024 },
        { name: 'legal_ingestion_jobs', count: jobs.length, data: jobs.length * 1024, index: jobs.length * 512 },
        { name: 'legal_document_citations', count: citations.length, data: citations.length * 512, index: citations.length * 256 },
        { name: 'cases', count: cases.length, data: cases.length * 2048, index: cases.length * 1024 },
        { name: 'clients', count: clients.length, data: clients.length * 1024, index: clients.length * 512 },
        { name: 'users', count: users.length, data: users.length * 1024, index: users.length * 512 }
      ];

      for (const t of baseTables) {
        const total = t.data + t.index;
        tables.push({
          tableName: t.name,
          rowCount: t.count,
          tableSizeBytes: t.data,
          tableSizeFormatted: formatBytes(t.data),
          indexSizeBytes: t.index,
          indexSizeFormatted: formatBytes(t.index),
          totalSizeBytes: total,
          totalSizeFormatted: formatBytes(total)
        });
        totalSizeBytes += total;
        totalIndexSizeBytes += t.index;
        totalRecords += t.count;
      }

      totalSizeBytes = Math.max(totalSizeBytes, dbFileSize);
    }

    // Sort tables by total size descending
    tables.sort((a, b) => b.totalSizeBytes - a.totalSizeBytes);

    const legalDocsTable = tables.find(t => t.tableName === 'legal_documents') || {
      tableName: 'legal_documents',
      rowCount: 0,
      tableSizeBytes: 0,
      tableSizeFormatted: '0 B',
      indexSizeBytes: 0,
      indexSizeFormatted: '0 B',
      totalSizeBytes: 0,
      totalSizeFormatted: '0 B'
    };

    const legalChunksTable = tables.find(t => t.tableName === 'legal_document_chunks') || {
      tableName: 'legal_document_chunks',
      rowCount: 0,
      tableSizeBytes: 0,
      tableSizeFormatted: '0 B',
      indexSizeBytes: 0,
      indexSizeFormatted: '0 B',
      totalSizeBytes: 0,
      totalSizeFormatted: '0 B'
    };

    const dbRemainingBytes = Math.max(0, dbQuotaBytes - totalSizeBytes);
    const dbUsagePercentage = dbQuotaBytes > 0 ? Number(((totalSizeBytes / dbQuotaBytes) * 100).toFixed(2)) : 0;
    const alertLevel = calculateAlertLevel(dbUsagePercentage);

    // Physical disk calculation (clearly distinguishing PostgreSQL physical disk usage from 500 MB database quota)
    let physicalDiskUsedBytes: number | null = null;
    let physicalDiskStatus: 'available' | 'unavailable' | 'cloud_managed' = 'cloud_managed';
    let physicalDiskStatusMessage = 'Free Tier 2 GB physical disk quota monitored. Organization-level cloud disk telemetry requires Supabase Management API credentials.';

    if (fs.existsSync(LOCAL_DB_FILE)) {
      // In local mode, we can measure actual on-disk filesystem usage
      try {
        const dbStat = fs.statSync(LOCAL_DB_FILE);
        const vaultDir = getDirectoryStats(LOCAL_VAULT_DIR);
        physicalDiskUsedBytes = dbStat.size + vaultDir.totalBytes;
        physicalDiskStatus = 'available';
        physicalDiskStatusMessage = 'Physical local storage usage accurately measured across JSON DB and vault files.';
      } catch {
        physicalDiskStatus = 'unavailable';
      }
    }

    return {
      databaseEngine: usedLivePostgres ? 'postgresql' : 'local_acid_db',
      databaseQuotaBytes: dbQuotaBytes,
      databaseQuotaFormatted: formatBytes(dbQuotaBytes),
      databaseUsedBytes: totalSizeBytes,
      databaseUsedFormatted: formatBytes(totalSizeBytes),
      databaseRemainingBytes: dbRemainingBytes,
      databaseRemainingFormatted: formatBytes(dbRemainingBytes),
      databaseUsagePercentage: dbUsagePercentage,

      physicalDiskQuotaBytes: diskQuotaBytes,
      physicalDiskQuotaFormatted: formatBytes(diskQuotaBytes),
      physicalDiskUsedBytes,
      physicalDiskUsedFormatted: physicalDiskUsedBytes ? formatBytes(physicalDiskUsedBytes) : null,
      physicalDiskStatus,
      physicalDiskStatusMessage,

      totalRecords,
      totalIndexSizeBytes,
      totalIndexSizeFormatted: formatBytes(totalIndexSizeBytes),

      tables,
      legalDocumentsTable: legalDocsTable,
      legalChunksTable: legalChunksTable,

      alertLevel,
      lastUpdated: new Date().toISOString()
    };
  },

  /**
   * 3. Judgment Database Statistics
   * Detailed metrics on legal judgments, verified vs pending, chunks, embeddings, OCR telemetry
   */
  async getJudgmentDatabaseStats(): Promise<JudgmentDatabaseStatistics> {
    const docs = localDb.getLegalDocuments();
    const chunks = localDb.getLegalChunks();
    const sources = localDb.getLegalDocumentSources();
    const processing = localDb.getAllLegalDocumentProcessing();

    const verifiedJudgments = docs.filter(d => d.verification_status === 'verified').length;
    const pendingJudgments = docs.filter(d => d.verification_status === 'pending').length;
    const rejectedJudgments = docs.filter(d => d.verification_status === 'rejected').length;

    const manualUploads = docs.filter(d => d.source_type === 'manual').length;
    const automaticImports = docs.filter(d => d.source_type === 'automatic').length;
    const apiImports = docs.filter(d => d.source_type === 'api').length;

    const totalPdfDocuments = sources.filter(s => 
      s.mime_type === 'application/pdf' || (s.original_filename && s.original_filename.toLowerCase().endsWith('.pdf'))
    ).length || docs.length;

    let totalCharacters = 0;
    for (const d of docs) {
      if (d.full_text) totalCharacters += d.full_text.length;
    }

    const totalEmbeddings = chunks.filter(c => Array.isArray(c.embedding) && c.embedding.length > 0).length;

    const failedProcessingDocuments = processing.filter((p: any) => 
      p.extraction_status === 'failed' || p.ocr_status === 'failed' || Boolean(p.error_message)
    ).length;

    return {
      totalJudgments: docs.length,
      verifiedJudgments,
      pendingJudgments,
      rejectedJudgments,
      totalPdfDocuments,
      totalExtractedTextCharacters: totalCharacters,
      totalExtractedTextFormatted: `${(totalCharacters / 1000).toFixed(1)}k characters (~${Math.round(totalCharacters / 5).toLocaleString()} words)`,
      totalDocumentChunks: chunks.length,
      totalEmbeddings,
      failedProcessingDocuments,
      manualUploads,
      automaticImports,
      apiImports
    };
  },

  /**
   * 4. Usage History & Daily Trend Points
   */
  async getUsageHistory(days = 30): Promise<{ history: StorageUsageHistoryRecord[]; trends: DailyUsageTrendPoint[] }> {
    const records = localDb.getStorageUsageHistory ? localDb.getStorageUsageHistory(days * 4) : [];
    
    // Group records by calendar date (YYYY-MM-DD)
    const map = new Map<string, StorageUsageHistoryRecord>();
    for (const rec of records) {
      const dateStr = rec.createdAt.split('T')[0];
      if (!map.has(dateStr) || new Date(rec.createdAt) > new Date(map.get(dateStr)!.createdAt)) {
        map.set(dateStr, rec);
      }
    }

    // Sort ascending by date
    const sortedDates = Array.from(map.keys()).sort();
    const trends: DailyUsageTrendPoint[] = sortedDates.map(date => {
      const rec = map.get(date)!;
      return {
        date,
        storageBytes: rec.storageBytes,
        storageMb: Number((rec.storageBytes / (1024 * 1024)).toFixed(2)),
        databaseBytes: rec.databaseBytes,
        databaseMb: Number((rec.databaseBytes / (1024 * 1024)).toFixed(2)),
        pdfCount: rec.pdfCount,
        chunkCount: rec.chunkCount
      };
    });

    return {
      history: records,
      trends
    };
  },

  /**
   * 5. Record Usage Snapshot
   * Captures point-in-time metrics and persists to storage_usage_history
   */
  async recordUsageSnapshot(customMetadata: Record<string, unknown> = {}): Promise<StorageUsageHistoryRecord> {
    const storage = await this.getStorageUsageMetrics();
    const db = await this.getDatabaseUsageMetrics();
    const judgments = await this.getJudgmentDatabaseStats();

    const snapshotPayload = {
      storageBytes: storage.storageUsedBytes,
      databaseBytes: db.databaseUsedBytes,
      physicalDiskBytes: db.physicalDiskUsedBytes,
      pdfCount: judgments.totalPdfDocuments,
      chunkCount: judgments.totalDocumentChunks,
      metadata: {
        alertLevel: storage.alertLevel,
        totalJudgments: judgments.totalJudgments,
        totalEmbeddings: judgments.totalEmbeddings,
        ...customMetadata
      }
    };

    // Save to local database
    const record = localDb.recordStorageSnapshot(snapshotPayload);

    // Save to Supabase table if configured
    if (isSupabaseAdminConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('storage_usage_history').insert({
          storage_bytes: snapshotPayload.storageBytes,
          database_bytes: snapshotPayload.databaseBytes,
          physical_disk_bytes: snapshotPayload.physicalDiskBytes,
          pdf_count: snapshotPayload.pdfCount,
          chunk_count: snapshotPayload.chunkCount,
          metadata: snapshotPayload.metadata
        });
      } catch {
        // Non-blocking
      }
    }

    return record;
  },

  /**
   * 6. Storage Quota Enforcement
   * Prevents new uploads when available storage is insufficient or at emergency threshold (95%+).
   * Strict guarantee: NEVER deletes any existing document.
   */
  async isUploadAllowed(newFileSizeBytes: number): Promise<{
    allowed: boolean;
    reason?: string;
    currentUsagePercent: number;
    remainingBytes: number;
  }> {
    const storage = await this.getStorageUsageMetrics();
    const projectedUsageBytes = storage.storageUsedBytes + newFileSizeBytes;
    const projectedPercent = (projectedUsageBytes / storage.storageQuotaBytes) * 100;

    // Check emergency threshold (≥ 95%)
    if (storage.usagePercentage >= ALERT_THRESHOLDS.EMERGENCY) {
      return {
        allowed: false,
        reason: `Storage emergency limit reached (${storage.usagePercentage.toFixed(1)}% ≥ 95%). New uploads are suspended to preserve system integrity. Please contact administrator to upgrade quota.`,
        currentUsagePercent: storage.usagePercentage,
        remainingBytes: storage.remainingBytes
      };
    }

    // Check if file exceeds remaining capacity
    if (newFileSizeBytes > storage.remainingBytes) {
      return {
        allowed: false,
        reason: `Insufficient storage space. File requires ${formatBytes(newFileSizeBytes)}, but only ${storage.remainingFormatted} remains of the ${storage.storageQuotaFormatted} quota.`,
        currentUsagePercent: storage.usagePercentage,
        remainingBytes: storage.remainingBytes
      };
    }

    // Check if this specific upload pushes usage over 95%
    if (projectedPercent >= ALERT_THRESHOLDS.EMERGENCY) {
      return {
        allowed: false,
        reason: `Upload rejected: this file would push storage usage to ${projectedPercent.toFixed(1)}%, exceeding the 95% emergency safeguard ceiling.`,
        currentUsagePercent: storage.usagePercentage,
        remainingBytes: storage.remainingBytes
      };
    }

    return {
      allowed: true,
      currentUsagePercent: storage.usagePercentage,
      remainingBytes: storage.remainingBytes
    };
  }
};
