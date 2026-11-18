import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { Readable } from 'stream';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export interface R2UploadResult {
  key: string;
  sha256: string;
  sizeBytes: number;
  etag?: string;
  uploadedAt: string;
}

export interface R2StatusResult {
  configured: boolean;
  bucketName: string | null;
  accountId: string | null;
  missingVariables: string[];
  connectionStatus: 'connected' | 'pending_configuration' | 'error';
  errorMessage?: string;
  totalFiles?: number;
  totalStorageBytes?: number;
}

export interface R2TestResult {
  success: boolean;
  configured: boolean;
  latencyMs?: number;
  bucketName?: string;
  message: string;
  details?: Record<string, any>;
}

// -----------------------------------------------------------------------------
// Singleton S3 Client Instance for Cloudflare R2
// -----------------------------------------------------------------------------
let cachedClient: S3Client | null = null;
let lastClientKey: string = '';

export function getR2Config(): { config: R2Config | null; missing: string[] } {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() || '';
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() || '';
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim() || '';
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim() || '';

  const missing: string[] = [];
  if (!accountId) missing.push('CLOUDFLARE_ACCOUNT_ID');
  if (!accessKeyId) missing.push('CLOUDFLARE_R2_ACCESS_KEY_ID');
  if (!secretAccessKey) missing.push('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
  if (!bucketName) missing.push('CLOUDFLARE_R2_BUCKET_NAME');

  if (missing.length > 0) {
    return { config: null, missing };
  }

  return {
    config: { accountId, accessKeyId, secretAccessKey, bucketName },
    missing: []
  };
}

export function isR2Configured(): boolean {
  const { config } = getR2Config();
  return Boolean(config);
}

export function getR2Client(): S3Client {
  const { config, missing } = getR2Config();
  if (!config) {
    throw new Error(
      `Cloudflare R2 is not configured. Missing required environment variables: ${missing.join(', ')}`
    );
  }

  const clientKey = `${config.accountId}:${config.accessKeyId}`;
  if (cachedClient && lastClientKey === clientKey) {
    return cachedClient;
  }

  // Cloudflare R2 is fully S3-compatible
  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });
  lastClientKey = clientKey;

  return cachedClient;
}

// -----------------------------------------------------------------------------
// PDF Verification & Integrity Utilities
// -----------------------------------------------------------------------------
export function calculateSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function validatePdfIntegrity(
  buffer: Buffer,
  maxSizeBytes = 50 * 1024 * 1024 // 50 MB default
): { valid: boolean; error?: string; sha256: string; sizeBytes: number } {
  const sizeBytes = buffer.length;
  const sha256 = calculateSha256(buffer);

  if (sizeBytes === 0) {
    return { valid: false, error: 'Empty file buffer received (0 bytes)', sha256, sizeBytes };
  }

  if (sizeBytes > maxSizeBytes) {
    const limitMb = Math.round(maxSizeBytes / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds maximum permitted threshold (${limitMb} MB)`,
      sha256,
      sizeBytes
    };
  }

  // Magic bytes check: PDF header must start with '%PDF-'
  const header = buffer.subarray(0, 5).toString('ascii');
  if (header !== '%PDF-') {
    return {
      valid: false,
      error: `Invalid file signature: Expected %PDF- magic bytes, found '${header}'`,
      sha256,
      sizeBytes
    };
  }

  return { valid: true, sha256, sizeBytes };
}

export function generateR2StorageKey(params: {
  courtCode: string;
  year?: string | number;
  caseNumber?: string;
  sha256: string;
}): string {
  const court = (params.courtCode || 'COURT').toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
  const year = params.year || new Date().getFullYear();
  const shortSha = params.sha256.slice(0, 16);
  const cleanCase = (params.caseNumber || 'judgment')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 32);

  return `official-judgments/${court}/${year}/${cleanCase}_${shortSha}.pdf`;
}

// -----------------------------------------------------------------------------
// Core Storage Operations
// -----------------------------------------------------------------------------

/**
 * Server-side Upload of an Original PDF to Cloudflare R2
 */
export async function uploadPdfToR2(params: {
  buffer: Buffer;
  key: string;
  mimeType?: string;
  metadata?: Record<string, string>;
}): Promise<R2UploadResult> {
  const { config, missing } = getR2Config();
  if (!config) {
    throw new Error(
      `Cloudflare R2 upload blocked: Credentials not configured (${missing.join(', ')}). Set credentials in environment.`
    );
  }

  const integrity = validatePdfIntegrity(params.buffer);
  if (!integrity.valid) {
    throw new Error(`PDF validation failed: ${integrity.error}`);
  }

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: params.key,
    Body: params.buffer,
    ContentType: params.mimeType || 'application/pdf',
    Metadata: {
      sha256: integrity.sha256,
      uploaded_at: new Date().toISOString(),
      ...(params.metadata || {})
    }
  });

  const response = await client.send(command);

  return {
    key: params.key,
    sha256: integrity.sha256,
    sizeBytes: integrity.sizeBytes,
    etag: response.ETag?.replace(/"/g, ''),
    uploadedAt: new Date().toISOString()
  };
}

/**
 * Server-side Download of an Original PDF from Cloudflare R2
 */
export async function downloadPdfFromR2(key: string): Promise<{ buffer: Buffer; sha256: string }> {
  const { config, missing } = getR2Config();
  if (!config) {
    throw new Error(
      `Cloudflare R2 download blocked: Credentials not configured (${missing.join(', ')}).`
    );
  }

  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key
  });

  const response = await client.send(command);
  if (!response.Body) {
    throw new Error(`Cloudflare R2 returned empty body for key: ${key}`);
  }

  const stream = response.Body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const buffer = Buffer.concat(chunks);
  const sha256 = calculateSha256(buffer);

  return { buffer, sha256 };
}

/**
 * Generate a Secure Signed Download URL (Default: 1 Hour Expiration)
 */
export async function generateSignedDownloadUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const { config, missing } = getR2Config();
  if (!config) {
    throw new Error(
      `Cannot generate signed URL: Cloudflare R2 is not configured (${missing.join(', ')}).`
    );
  }

  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    ResponseContentDisposition: `inline; filename="${key.split('/').pop() || 'judgment.pdf'}"`
  });

  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Delete a PDF from Private Cloudflare R2 Bucket (Admin Authorization Required)
 */
export async function deletePdfFromR2(key: string): Promise<boolean> {
  const { config, missing } = getR2Config();
  if (!config) {
    throw new Error(
      `Cannot delete from R2: Cloudflare R2 is not configured (${missing.join(', ')}).`
    );
  }

  const client = getR2Client();
  const command = new DeleteObjectCommand({
    Bucket: config.bucketName,
    Key: key
  });

  await client.send(command);
  return true;
}

/**
 * Get Real R2 Storage Status and File Telemetry
 */
export async function getR2Status(): Promise<R2StatusResult> {
  const { config, missing } = getR2Config();
  if (!config) {
    return {
      configured: false,
      bucketName: null,
      accountId: null,
      missingVariables: missing,
      connectionStatus: 'pending_configuration'
    };
  }

  try {
    const client = getR2Client();
    const command = new ListObjectsV2Command({
      Bucket: config.bucketName,
      MaxKeys: 1000
    });

    const response = await client.send(command);
    const totalFiles = response.KeyCount || 0;
    const totalStorageBytes = (response.Contents || []).reduce(
      (sum, item) => sum + (item.Size || 0),
      0
    );

    return {
      configured: true,
      bucketName: config.bucketName,
      accountId: config.accountId,
      missingVariables: [],
      connectionStatus: 'connected',
      totalFiles,
      totalStorageBytes
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query R2 bucket';
    return {
      configured: true,
      bucketName: config.bucketName,
      accountId: config.accountId,
      missingVariables: [],
      connectionStatus: 'error',
      errorMessage: msg
    };
  }
}

/**
 * Real Round-Trip End-to-End Test for Cloudflare R2 Integration
 * Performs: Upload Test PDF -> Download -> Verify SHA-256 Parity -> Delete Test PDF
 */
export async function testR2Connection(): Promise<R2TestResult> {
  const { config, missing } = getR2Config();
  if (!config) {
    return {
      success: false,
      configured: false,
      message: `R2 Configuration Pending: Missing environment variables (${missing.join(', ')}). Configure these in Cloudflare Dashboard and .env.local to activate.`
    };
  }

  const startTime = Date.now();
  const testKey = `test-verifications/probe_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.pdf`;
  
  // Valid minimal 1-page PDF binary
  const minimalPdf = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n',
    'ascii'
  );

  try {
    // 1. Upload
    const uploadResult = await uploadPdfToR2({
      buffer: minimalPdf,
      key: testKey,
      metadata: { probe: 'e2e_verification_probe' }
    });

    // 2. Download
    const downloadResult = await downloadPdfFromR2(testKey);

    // 3. Verify
    if (uploadResult.sha256 !== downloadResult.sha256) {
      throw new Error(
        `Integrity mismatch: Upload SHA-256 (${uploadResult.sha256}) did not match Download SHA-256 (${downloadResult.sha256})`
      );
    }

    // 4. Generate signed URL to verify presigner
    const signedUrl = await generateSignedDownloadUrl(testKey, 300);

    // 5. Clean up
    await deletePdfFromR2(testKey);

    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      configured: true,
      latencyMs,
      bucketName: config.bucketName,
      message: `Real Cloudflare R2 round-trip upload, checksum verification, signed URL generation, and cleanup succeeded (${latencyMs}ms).`,
      details: {
        bucket: config.bucketName,
        sha256Verified: uploadResult.sha256,
        latencyMs,
        signedUrlPrefix: signedUrl.slice(0, 40) + '...'
      }
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown R2 error';
    return {
      success: false,
      configured: true,
      bucketName: config.bucketName,
      message: `Cloudflare R2 test failed: ${errorMsg}`,
      details: { error: errorMsg }
    };
  }
}
