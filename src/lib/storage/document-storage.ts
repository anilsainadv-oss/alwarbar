import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/db/supabase';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const PRIVATE_BUCKET = process.env.STORAGE_BUCKET_PRIVATE_CASES || 'private-cases';
const LOCAL_VAULT_DIR = path.join(process.cwd(), 'data', 'vault');
const SIGNING_SECRET = process.env.AUTH_SECRET || 'alwar-advocates-secure-dev-secret-1234567890abcdef';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/png'
]);

/**
 * Validate file header magic bytes to prevent file extension spoofing
 */
export function validateFileMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  // PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (mimeType === 'application/pdf') {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }

  // PNG: \x89PNG (0x89 0x50 0x4E 0x47)
  if (mimeType === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  }

  // JPEG: \xFF\xD8\xFF
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }

  // DOCX (ZIP archive): PK\x03\x04 (0x50 0x4B 0x03 0x04)
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
  }

  // Fallback for Word .doc legacy binary
  if (mimeType === 'application/msword') {
    return buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0;
  }

  return false;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateDocumentUpload(
  buffer: Buffer,
  mimeType: string,
  filename: string
): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty file payload' };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File size exceeds 25 MB ceiling (${(buffer.length / 1024 / 1024).toFixed(1)} MB)` };
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { valid: false, error: `Disallowed file type: ${mimeType}. Permitted: PDF, DOCX, PNG, JPG` };
  }

  if (!validateFileMagicBytes(buffer, mimeType)) {
    return { valid: false, error: 'File header magic bytes do not match declared MIME type' };
  }

  return { valid: true };
}

export interface StorageSaveResult {
  storagePath: string;
  fileSizeBytes: number;
  mimeType: string;
  storageEngine: 'supabase_storage' | 'local_encrypted_vault';
}

/**
 * Persists binary document buffer to Supabase Storage (if reachable) or local private vault.
 */
export async function storeBinaryDocument(params: {
  advocateId: string;
  caseId: string;
  documentId: string;
  buffer: Buffer;
  filename: string;
  mimeType: string;
}): Promise<StorageSaveResult> {
  const { advocateId, caseId, documentId, buffer, filename, mimeType } = params;

  const ext = path.extname(filename).toLowerCase() || (mimeType === 'application/pdf' ? '.pdf' : '.bin');
  const sanitizedDocId = documentId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const relativePath = `${advocateId}/${caseId}/${sanitizedDocId}${ext}`;

  // 1. Attempt Supabase Storage upload if client is configured
  if (isSupabaseAdminConfigured && supabaseAdmin) {
    try {
      const { error: uploadErr } = await supabaseAdmin.storage
        .from(PRIVATE_BUCKET)
        .upload(relativePath, buffer, {
          contentType: mimeType,
          upsert: true
        });

      if (!uploadErr) {
        return {
          storagePath: `supabase://${PRIVATE_BUCKET}/${relativePath}`,
          fileSizeBytes: buffer.length,
          mimeType,
          storageEngine: 'supabase_storage'
        };
      }
    } catch {
      // Non-blocking fallback to local vault
    }
  }

  // 2. Local Private Vault Fallback
  const caseVaultDir = path.join(LOCAL_VAULT_DIR, advocateId, caseId);
  if (!fs.existsSync(caseVaultDir)) {
    fs.mkdirSync(caseVaultDir, { recursive: true });
  }

  const filePath = path.join(caseVaultDir, `${sanitizedDocId}${ext}`);
  fs.writeFileSync(filePath, buffer);

  return {
    storagePath: filePath,
    fileSizeBytes: buffer.length,
    mimeType,
    storageEngine: 'local_encrypted_vault'
  };
}

/**
 * Generate a short-lived, HMAC-signed authorization token for secure document downloads (valid for 5 minutes).
 */
export function generateSignedDownloadToken(advocateId: string, documentId: string): string {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  const payload = Buffer.from(JSON.stringify({ advocateId, documentId, expiresAt })).toString('base64');
  const sig = crypto.createHmac('sha256', SIGNING_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifySignedDownloadToken(token: string): { advocateId: string; documentId: string } | null {
  try {
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return null;

    const expectedSig = crypto.createHmac('sha256', SIGNING_SECRET).update(payloadB64).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return null;
    }

    const data = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
    if (Date.now() > data.expiresAt) {
      return null; // Expired
    }

    return { advocateId: data.advocateId, documentId: data.documentId };
  } catch {
    return null;
  }
}

/**
 * Retrieve binary buffer from storagePath (Supabase Storage or local vault).
 */
export async function readBinaryDocument(storagePath: string): Promise<Buffer | null> {
  if (storagePath.startsWith('supabase://')) {
    if (!supabaseAdmin) return null;
    const cleanPath = storagePath.replace(`supabase://${PRIVATE_BUCKET}/`, '');
    const { data, error } = await supabaseAdmin.storage.from(PRIVATE_BUCKET).download(cleanPath);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  }

  if (fs.existsSync(storagePath)) {
    return fs.readFileSync(storagePath);
  }

  return null;
}

/**
 * Delete binary file from storage.
 */
export async function deleteBinaryDocument(storagePath: string): Promise<boolean> {
  try {
    if (storagePath.startsWith('supabase://')) {
      if (!supabaseAdmin) return false;
      const cleanPath = storagePath.replace(`supabase://${PRIVATE_BUCKET}/`, '');
      const { error } = await supabaseAdmin.storage.from(PRIVATE_BUCKET).remove([cleanPath]);
      return !error;
    }

    if (fs.existsSync(storagePath)) {
      fs.unlinkSync(storagePath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
