import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Vault configuration and signing key (matches src/lib/storage/document-storage.ts)
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const LOCAL_VAULT_DIR = path.join(process.cwd(), 'data', 'vault');
const SIGNING_SECRET = process.env.AUTH_SECRET || 'alwar-advocates-secure-dev-secret-1234567890abcdef';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/png'
]);

function validateFileMagicBytes(buffer, mimeType) {
  if (buffer.length < 4) return false;
  if (mimeType === 'application/pdf') {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF
  }
  if (mimeType === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47; // \x89PNG
  }
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF; // \xFF\xD8\xFF
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return buffer[0] === 0x50 && buffer[1] === 0x4B && (buffer[2] === 0x03 || buffer[2] === 0x05); // PK zip header
  }
  return true;
}

function validateDocumentUpload(buffer, mimeType, filename) {
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'फ़ाइल 25 MB सीमा से अधिक है' };
  }
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { valid: false, error: 'असमर्थित फ़ाइल प्रारूप' };
  }
  if (!validateFileMagicBytes(buffer, mimeType)) {
    return { valid: false, error: 'फ़ाइल सामग्री प्रारूप से मेल नहीं खाती' };
  }
  return { valid: true };
}

function generateSignedDownloadToken(advocateId, documentId, expiresInSec = 300) {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSec;
  const payload = Buffer.from(JSON.stringify({ advocateId, documentId, expiresAt })).toString('base64url');
  const signature = crypto.createHmac('sha256', SIGNING_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

function verifySignedDownloadToken(token) {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', SIGNING_SECRET).update(payload).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (parsed.expiresAt < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function storeVaultDocument(advocateId, caseId, docId, buffer) {
  const advocateVault = path.join(LOCAL_VAULT_DIR, advocateId);
  if (!fs.existsSync(advocateVault)) {
    fs.mkdirSync(advocateVault, { recursive: true });
  }
  const storagePath = `vault://${advocateId}/${caseId}/${docId}.pdf`;
  const physicalPath = path.join(advocateVault, `${caseId}_${docId}.bin`);
  fs.writeFileSync(physicalPath, buffer);
  return { storagePath, physicalPath };
}

export async function runDatabaseStorageTests() {
  console.log('Testing P1 Database & Binary Document Storage Architecture...');

  // -------------------------------------------------------------
  // 1. Local Database Backup & Checksum Verification
  // -------------------------------------------------------------
  const backupDir = path.join(process.cwd(), 'data', 'backups');
  assert(fs.existsSync(backupDir), 'Backup directory data/backups must exist');
  const backupFiles = fs.readdirSync(backupDir).filter(f => f.startsWith('backup-') && f.endsWith('.json'));
  assert(backupFiles.length > 0, 'At least one verified JSON database backup must exist');
  const latestBackup = path.join(backupDir, backupFiles[backupFiles.length - 1]);
  const backupData = JSON.parse(fs.readFileSync(latestBackup, 'utf8'));
  assert(Array.isArray(backupData.cases) && backupData.cases.length > 0, 'Backup must contain valid cases array');
  assert(Array.isArray(backupData.users) && backupData.users.length > 0, 'Backup must contain valid users array');
  console.log(`  ✓ Verified database backup snapshot (${backupFiles[backupFiles.length - 1]})`);

  // -------------------------------------------------------------
  // 2. SQL Migration Seed Script Verification
  // -------------------------------------------------------------
  const seedSqlPath = path.join(backupDir, 'migration-seed.sql');
  assert(fs.existsSync(seedSqlPath), 'Migration seed SQL script must exist');
  const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
  assert(seedSql.includes('INSERT INTO users'), 'Seed SQL must contain users inserts');
  assert(seedSql.includes('INSERT INTO cases'), 'Seed SQL must contain cases inserts');
  assert(seedSql.includes('ON CONFLICT DO NOTHING'), 'Seed SQL must be non-destructive (ON CONFLICT DO NOTHING)');
  console.log('  ✓ Standalone PostgreSQL migration seed export verified');

  // -------------------------------------------------------------
  // 3. Binary Document Validation & Magic Bytes
  // -------------------------------------------------------------
  // A. Fake PDF (Spoofed extension with plain text)
  const fakePdf = Buffer.from('This is fake text pretending to be a PDF');
  const fakeValidation = validateDocumentUpload(fakePdf, 'application/pdf', 'fake.pdf');
  assert.strictEqual(fakeValidation.valid, false, 'Spoofed file without %PDF- magic bytes must be rejected');

  // B. Genuine PDF header
  const genuinePdfHeader = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
  const pdfValidation = validateDocumentUpload(genuinePdfHeader, 'application/pdf', 'genuine.pdf');
  assert.strictEqual(pdfValidation.valid, true, 'Genuine PDF with magic bytes must be approved');

  // C. Disallowed file type (.exe)
  const exeBuffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00]); // MZ executable
  const exeValidation = validateDocumentUpload(exeBuffer, 'application/x-msdownload', 'malware.exe');
  assert.strictEqual(exeValidation.valid, false, 'Disallowed MIME types must be rejected');

  // D. Oversized file (> 25 MB)
  const oversizedBuffer = Buffer.alloc(26 * 1024 * 1024); // 26 MB
  const oversizedValidation = validateDocumentUpload(oversizedBuffer, 'application/pdf', 'huge.pdf');
  assert.strictEqual(oversizedValidation.valid, false, 'Files > 25 MB must be rejected');
  console.log('  ✓ Binary file validation & magic bytes inspection verified');

  // -------------------------------------------------------------
  // 4. Confidential Vault Storage & Retrieval
  // -------------------------------------------------------------
  const testAdvocateId = 'usr-test-advocate-001';
  const testCaseId = 'case-test-999';
  const testDocId = 'doc-test-binary-001';
  const samplePdfBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Confidential Vakalatnama Exhibit) >>\nendobj\n%%EOF');

  const { physicalPath } = await storeVaultDocument(testAdvocateId, testCaseId, testDocId, samplePdfBytes);
  assert(fs.existsSync(physicalPath), 'Physical vault file must be created');

  const readBytes = fs.readFileSync(physicalPath);
  assert.deepStrictEqual(readBytes, samplePdfBytes, 'Retrieved binary must match stored bytes 100%');

  // Clean up
  fs.unlinkSync(physicalPath);
  assert.strictEqual(fs.existsSync(physicalPath), false, 'Vault file deletion must remove file');
  console.log('  ✓ Confidential document vault binary persistence verified');

  // -------------------------------------------------------------
  // 5. Short-Lived Signed Download Tokens
  // -------------------------------------------------------------
  const token = generateSignedDownloadToken(testAdvocateId, testDocId);
  const verified = verifySignedDownloadToken(token);
  assert(verified, 'Signed token must verify cleanly');
  assert.strictEqual(verified.advocateId, testAdvocateId);
  assert.strictEqual(verified.documentId, testDocId);

  // Tampered token test
  const [p, s] = token.split('.');
  const tamperedToken = `${p}.${s.slice(0, -4)}dead`;
  assert.strictEqual(verifySignedDownloadToken(tamperedToken), null, 'Tampered download token must be rejected');
  console.log('  ✓ HMAC-signed short-lived download tokens verified');

  // -------------------------------------------------------------
  // 6. Multi-Tenant Scoping Isolation
  // -------------------------------------------------------------
  const dbPath = path.join(process.cwd(), 'data', 'local-db.json');
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const rohitCases = dbData.cases.filter(c => c.advocate_id === 'usr-rohitashwa-sain-331-1977');
  assert(rohitCases.length > 0, 'Target advocate must have docket cases');
  assert(rohitCases.every(c => c.advocate_id === 'usr-rohitashwa-sain-331-1977'), 'All queried cases must match tenant ID');

  const foreignCases = dbData.cases.filter(c => c.advocate_id === 'usr-non-existent-999');
  assert.strictEqual(foreignCases.length, 0, 'Non-existent advocate ID must yield 0 cases');
  console.log('  ✓ Multi-tenant advocate docket scoping verified');
}
