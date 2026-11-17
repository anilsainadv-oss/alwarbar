import type { StorageAlertLevel } from '@/types/storage-monitor';

/**
 * Storage and Database Quota & Alert Configuration
 * Configurable via environment variables to support Pro/Enterprise plan upgrades
 * without requiring application code changes.
 */

// Default Free Plan Storage Quota: 1 GB (1,073,741,824 bytes)
export const DEFAULT_STORAGE_QUOTA_BYTES = 1 * 1024 * 1024 * 1024;

// Default Free Plan Database Quota: 500 MB (524,288,000 bytes)
export const DEFAULT_DATABASE_QUOTA_BYTES = 500 * 1024 * 1024;

// Default Free Plan Physical Disk Allocation: 2 GB (2,147,483,648 bytes)
export const DEFAULT_PHYSICAL_DISK_QUOTA_BYTES = 2 * 1024 * 1024 * 1024;

// Configurable Quotas with fallback to Free Plan defaults
export function getStorageQuotaBytes(): number {
  const envVal = process.env.SUPABASE_STORAGE_QUOTA_BYTES || process.env.STORAGE_QUOTA_BYTES;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_STORAGE_QUOTA_BYTES;
}

export function getDatabaseQuotaBytes(): number {
  const envVal = process.env.SUPABASE_DATABASE_QUOTA_BYTES || process.env.DATABASE_QUOTA_BYTES;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_DATABASE_QUOTA_BYTES;
}

export function getPhysicalDiskQuotaBytes(): number {
  const envVal = process.env.SUPABASE_PHYSICAL_DISK_QUOTA_BYTES || process.env.PHYSICAL_DISK_QUOTA_BYTES;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_PHYSICAL_DISK_QUOTA_BYTES;
}

// Storage Alert Thresholds (Configurable)
export const ALERT_THRESHOLDS = {
  INFO: 60.0,      // 60%: Information
  WARNING: 75.0,   // 75%: Warning
  CRITICAL: 85.0,  // 85%: Critical
  EMERGENCY: 95.0  // 95%: Emergency (Block new uploads)
} as const;

/**
 * Determines alert level from percentage (0-100)
 */
export function calculateAlertLevel(percentage: number): StorageAlertLevel {
  if (percentage >= ALERT_THRESHOLDS.EMERGENCY) return 'emergency';
  if (percentage >= ALERT_THRESHOLDS.CRITICAL) return 'critical';
  if (percentage >= ALERT_THRESHOLDS.WARNING) return 'warning';
  if (percentage >= ALERT_THRESHOLDS.INFO) return 'info';
  return 'normal';
}

/**
 * Human-readable alert messaging
 */
export function getAlertMessage(level: StorageAlertLevel, percentage: number): string | undefined {
  switch (level) {
    case 'emergency':
      return `Emergency: Storage usage has reached ${percentage.toFixed(1)}% (≥ 95%). New uploads are suspended to prevent system degradation.`;
    case 'critical':
      return `Critical Alert: Storage usage has reached ${percentage.toFixed(1)}% (≥ 85%). Immediate administrative action or quota upgrade is strongly recommended.`;
    case 'warning':
      return `Warning: Storage usage has reached ${percentage.toFixed(1)}% (≥ 75%). Monitor upload volume closely.`;
    case 'info':
      return `Information: Storage usage is at ${percentage.toFixed(1)}% (≥ 60%). System healthy with moderate utilization.`;
    default:
      return undefined;
  }
}

/**
 * Formats byte values into human-readable strings (B, KB, MB, GB, TB)
 */
export function formatBytes(bytes: number | null | undefined, decimals = 2): string {
  if (bytes == null || isNaN(bytes) || bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeIndex = Math.min(i, sizes.length - 1);
  const value = bytes / Math.pow(k, safeIndex);

  return `${parseFloat(value.toFixed(dm))} ${sizes[safeIndex]}`;
}
