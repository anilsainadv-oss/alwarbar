export type StorageAlertLevel = 'normal' | 'info' | 'warning' | 'critical' | 'emergency';

export interface StorageBucketMetric {
  name: string;
  id: string;
  fileCount: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  isPublic: boolean;
  createdAt: string;
}

export interface LargestUploadedPdf {
  id: string;
  filename: string;
  storagePath: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  mimeType: string;
  documentId?: string;
  caseId?: string;
  documentTitle?: string;
  citation?: string;
  courtName?: string;
  createdAt: string;
}

export interface StorageUsageMetrics {
  storageEngine: 'supabase_storage' | 'local_encrypted_vault' | 'hybrid';
  storageQuotaBytes: number;
  storageQuotaFormatted: string;
  storageUsedBytes: number;
  storageUsedFormatted: string;
  remainingBytes: number;
  remainingFormatted: string;
  usagePercentage: number;
  totalFiles: number;
  alertLevel: StorageAlertLevel;
  alertMessage?: string;
  buckets: StorageBucketMetric[];
  largestPdfs: LargestUploadedPdf[];
  quotaIsConfigurable: boolean;
  isUploadAllowed: boolean;
  lastUpdated: string;
}

export interface TableStorageMetric {
  tableName: string;
  rowCount: number;
  tableSizeBytes: number;
  tableSizeFormatted: string;
  indexSizeBytes: number;
  indexSizeFormatted: string;
  totalSizeBytes: number;
  totalSizeFormatted: string;
}

export interface DatabaseUsageMetrics {
  databaseEngine: 'postgresql' | 'local_acid_db';
  databaseQuotaBytes: number;
  databaseQuotaFormatted: string;
  databaseUsedBytes: number;
  databaseUsedFormatted: string;
  databaseRemainingBytes: number;
  databaseRemainingFormatted: string;
  databaseUsagePercentage: number;
  
  // Physical disk allocation (Free plan 2GB, distinct from 500MB DB quota)
  physicalDiskQuotaBytes: number;
  physicalDiskQuotaFormatted: string;
  physicalDiskUsedBytes: number | null;
  physicalDiskUsedFormatted: string | null;
  physicalDiskStatus: 'available' | 'unavailable' | 'cloud_managed';
  physicalDiskStatusMessage: string;

  totalRecords: number;
  totalIndexSizeBytes: number;
  totalIndexSizeFormatted: string;
  
  tables: TableStorageMetric[];
  legalDocumentsTable: TableStorageMetric;
  legalChunksTable: TableStorageMetric;

  alertLevel: StorageAlertLevel;
  lastUpdated: string;
}

export interface JudgmentDatabaseStatistics {
  totalJudgments: number;
  verifiedJudgments: number;
  pendingJudgments: number;
  rejectedJudgments: number;
  totalPdfDocuments: number;
  totalExtractedTextCharacters: number;
  totalExtractedTextFormatted: string;
  totalDocumentChunks: number;
  totalEmbeddings: number;
  failedProcessingDocuments: number;
  manualUploads: number;
  automaticImports: number;
  apiImports: number;
}

export interface StorageUsageHistoryRecord {
  id: string;
  createdAt: string;
  storageBytes: number;
  databaseBytes: number;
  physicalDiskBytes: number | null;
  pdfCount: number;
  chunkCount: number;
  metadata?: Record<string, unknown>;
}

export interface DailyUsageTrendPoint {
  date: string;
  storageBytes: number;
  storageMb: number;
  databaseBytes: number;
  databaseMb: number;
  pdfCount: number;
  chunkCount: number;
}
