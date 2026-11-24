/**
 * STAGE 1: COMPLETE JUDGMENT REPOSITORY BACKUP
 * READ-ONLY extraction from Supabase + R2
 * Saves everything to data/backups/final-fresh-reset-2026-11-21/
 */
const { createClient } = require('@supabase/supabase-js');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { loadLocalEnv } = require('./load-env.cjs');

const env = loadLocalEnv();
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_KEY;

const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY = env.R2_ACCESS_KEY;
const R2_SECRET_KEY = env.R2_SECRET_KEY;
const R2_BUCKET = env.R2_BUCKET;

const BACKUP_DIR = path.join('C:\\alwar-advocates', 'data', 'backups', 'final-fresh-reset-2026-11-21');
const PDF_DIR = path.join(BACKUP_DIR, 'pdfs');

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function main() {
  console.log('=== STAGE 1: COMPLETE JUDGMENT REPOSITORY BACKUP ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Backup directory:', BACKUP_DIR);

  // Create backup directories
  fs.mkdirSync(PDF_DIR, { recursive: true });
  console.log('✅ Backup directories created\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const manifest = {
    created_at: new Date().toISOString(),
    purpose: 'Complete judgment repository backup before fresh reset',
    source: { supabase_url: SUPABASE_URL, r2_bucket: R2_BUCKET },
    exports: {},
    r2_pdfs: [],
    sha256_hashes: {},
    verification: {},
  };

  // ============================================================
  // 1. EXPORT ALL 16 LEGAL DOCUMENTS (with full_text)
  // ============================================================
  console.log('--- 1. Exporting legal_documents ---');
  const { data: docs, error: docsErr } = await supabase
    .from('legal_documents')
    .select('*')
    .order('created_at', { ascending: true });

  if (docsErr) { console.error('FATAL: Cannot fetch documents:', docsErr.message); process.exit(1); }
  console.log(`  Fetched: ${docs.length} documents`);

  const docsFile = path.join(BACKUP_DIR, 'legal_documents.json');
  fs.writeFileSync(docsFile, JSON.stringify(docs, null, 2));
  const docsHash = crypto.createHash('sha256').update(fs.readFileSync(docsFile)).digest('hex');
  manifest.exports.legal_documents = {
    count: docs.length,
    file: 'legal_documents.json',
    file_size: fs.statSync(docsFile).size,
    sha256: docsHash,
  };
  console.log(`  Saved: ${docsFile} (${fs.statSync(docsFile).size} bytes, SHA-256: ${docsHash.substring(0,16)}…)`);

  // ============================================================
  // 2. EXPORT ALL 108 CHUNKS (with embeddings)
  // ============================================================
  console.log('\n--- 2. Exporting legal_document_chunks ---');
  const allChunks = [];
  let offset = 0;
  const PAGE_SIZE = 50;
  while (true) {
    const { data: batch, error: batchErr } = await supabase
      .from('legal_document_chunks')
      .select('*')
      .order('created_at', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (batchErr) { console.error('FATAL: Cannot fetch chunks:', batchErr.message); process.exit(1); }
    if (!batch || batch.length === 0) break;
    allChunks.push(...batch);
    console.log(`  Fetched batch: ${batch.length} chunks (total so far: ${allChunks.length})`);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  const chunksFile = path.join(BACKUP_DIR, 'legal_document_chunks.json');
  fs.writeFileSync(chunksFile, JSON.stringify(allChunks, null, 2));
  const chunksHash = crypto.createHash('sha256').update(fs.readFileSync(chunksFile)).digest('hex');
  manifest.exports.legal_document_chunks = {
    count: allChunks.length,
    file: 'legal_document_chunks.json',
    file_size: fs.statSync(chunksFile).size,
    sha256: chunksHash,
    has_embeddings: allChunks.filter(c => c.embedding && c.embedding.length > 0).length,
  };
  console.log(`  Saved: ${chunksFile} (${fs.statSync(chunksFile).size} bytes, SHA-256: ${chunksHash.substring(0,16)}…)`);
  console.log(`  Chunks with embeddings: ${manifest.exports.legal_document_chunks.has_embeddings}/${allChunks.length}`);

  // ============================================================
  // 3. EXPORT ALL 30 AUDIT LOGS
  // ============================================================
  console.log('\n--- 3. Exporting judgment_audit_logs ---');
  const { data: auditLogs, error: auditErr } = await supabase
    .from('judgment_audit_logs')
    .select('*')
    .order('created_at', { ascending: true });

  if (auditErr) { console.error('FATAL: Cannot fetch audit logs:', auditErr.message); process.exit(1); }

  const auditFile = path.join(BACKUP_DIR, 'judgment_audit_logs.json');
  fs.writeFileSync(auditFile, JSON.stringify(auditLogs, null, 2));
  const auditHash = crypto.createHash('sha256').update(fs.readFileSync(auditFile)).digest('hex');
  manifest.exports.judgment_audit_logs = {
    count: auditLogs.length,
    file: 'judgment_audit_logs.json',
    file_size: fs.statSync(auditFile).size,
    sha256: auditHash,
    note: 'AUDIT LOGS WILL BE PRESERVED IN DATABASE — this is an independent copy',
  };
  console.log(`  Saved: ${auditFile} (${fs.statSync(auditFile).size} bytes, SHA-256: ${auditHash.substring(0,16)}…)`);

  // ============================================================
  // 4. DOWNLOAD AND BACK UP BOTH R2 PDFs
  // ============================================================
  console.log('\n--- 4. Downloading R2 PDFs ---');
  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
  });

  const { Contents: r2Objects } = await r2.send(new ListObjectsV2Command({ Bucket: R2_BUCKET, MaxKeys: 1000 }));
  console.log(`  R2 objects found: ${(r2Objects || []).length}`);

  for (const obj of (r2Objects || [])) {
    console.log(`\n  Downloading: ${obj.Key} (${obj.Size} bytes)`);
    const getResult = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: obj.Key }));
    const buffer = await streamToBuffer(getResult.Body);

    // Verify size matches
    if (buffer.length !== obj.Size) {
      console.error(`  ❌ SIZE MISMATCH: expected ${obj.Size}, got ${buffer.length}`);
    } else {
      console.log(`  ✅ Size verified: ${buffer.length} bytes`);
    }

    // Calculate SHA-256
    const pdfHash = crypto.createHash('sha256').update(buffer).digest('hex');
    console.log(`  SHA-256: ${pdfHash}`);

    // Verify PDF magic bytes
    const magic = buffer.slice(0, 5).toString('ascii');
    console.log(`  PDF magic bytes: ${magic} (${magic === '%PDF-' ? '✅ VALID' : '❌ INVALID'})`);

    // Save PDF
    const safeName = obj.Key.replace(/\//g, '_');
    const pdfPath = path.join(PDF_DIR, safeName);
    fs.writeFileSync(pdfPath, buffer);
    console.log(`  Saved: ${pdfPath}`);

    // Verify saved file
    const savedHash = crypto.createHash('sha256').update(fs.readFileSync(pdfPath)).digest('hex');
    const writeVerified = savedHash === pdfHash;
    console.log(`  Write verification: ${writeVerified ? '✅ MATCH' : '❌ MISMATCH'}`);

    // Cross-reference with database
    const linkedDoc = docs.find(d => d.r2_storage_key === obj.Key);
    let dbHashMatch = 'N/A';
    if (linkedDoc && linkedDoc.pdf_sha256) {
      dbHashMatch = linkedDoc.pdf_sha256 === pdfHash ? '✅ MATCH' : `❌ MISMATCH (db=${linkedDoc.pdf_sha256})`;
    }

    manifest.r2_pdfs.push({
      r2_key: obj.Key,
      r2_size: obj.Size,
      r2_last_modified: obj.LastModified,
      r2_etag: obj.ETag,
      local_file: safeName,
      sha256: pdfHash,
      pdf_magic_valid: magic === '%PDF-',
      write_verified: writeVerified,
      linked_document_id: linkedDoc ? linkedDoc.id : null,
      db_sha256_match: dbHashMatch,
    });
    manifest.sha256_hashes[obj.Key] = pdfHash;
  }

  // ============================================================
  // 5. RECORD ALL SHA-256 HASHES FROM DATABASE
  // ============================================================
  console.log('\n\n--- 5. Database SHA-256 hashes ---');
  for (const doc of docs) {
    if (doc.pdf_sha256) {
      manifest.sha256_hashes[`db:${doc.id}`] = doc.pdf_sha256;
      console.log(`  ${doc.id.substring(0,8)} (${doc.citation}): ${doc.pdf_sha256}`);
    }
  }

  // ============================================================
  // 6. FOREIGN KEY DEPENDENCY CHECK
  // ============================================================
  console.log('\n\n--- 6. Foreign Key Dependency Check ---');

  // Check which chunks reference which documents
  const docIds = new Set(docs.map(d => d.id));
  const chunkDocIds = new Set(allChunks.map(c => c.document_id));
  const orphanChunks = allChunks.filter(c => !docIds.has(c.document_id));
  const docsWithoutChunks = docs.filter(d => !chunkDocIds.has(d.id));

  console.log(`  Document IDs: ${docIds.size}`);
  console.log(`  Unique document IDs referenced by chunks: ${chunkDocIds.size}`);
  console.log(`  Orphan chunks (no parent doc): ${orphanChunks.length}`);
  console.log(`  Documents without chunks: ${docsWithoutChunks.length}`);

  // Check audit log references
  const auditDocIds = new Set(auditLogs.map(l => l.document_id).filter(Boolean));
  console.log(`  Unique document IDs in audit logs: ${auditDocIds.size}`);

  // Check for any references in other tables
  console.log('\n  Checking other Supabase tables for judgment references...');
  const tablesToCheck = ['advocates', 'cases', 'welfare_records', 'laws', 'notifications', 'admin_users'];
  for (const table of tablesToCheck) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`  Table "${table}": ${error.message}`);
      } else {
        console.log(`  Table "${table}": ${count} records (no judgment FK expected)`);
      }
    } catch (e) {
      console.log(`  Table "${table}": query error - ${e.message}`);
    }
  }

  manifest.verification.foreign_keys = {
    orphan_chunks: orphanChunks.length,
    docs_without_chunks: docsWithoutChunks.length,
    deletion_order: ['1. legal_document_chunks (FK → legal_documents)', '2. legal_documents', '3. R2 objects (no FK)'],
    audit_logs: 'PRESERVED — not deleted',
  };

  // ============================================================
  // 7. CHECK LOCAL JSON FOR JUDGMENT DATA
  // ============================================================
  console.log('\n\n--- 7. Local JSON Inspection ---');
  const localDbPath = path.join('C:\\alwar-advocates', 'data', 'local-db.json');
  if (fs.existsSync(localDbPath)) {
    const localDb = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
    const localKeys = Object.keys(localDb);
    console.log(`  local-db.json keys: ${localKeys.join(', ')}`);

    // Check for judgment-related keys
    const judgmentKeys = localKeys.filter(k =>
      k.toLowerCase().includes('legal') ||
      k.toLowerCase().includes('judgment') ||
      k.toLowerCase().includes('document')
    );
    console.log(`  Judgment-related keys: ${judgmentKeys.length > 0 ? judgmentKeys.join(', ') : 'NONE'}`);

    for (const key of judgmentKeys) {
      const val = localDb[key];
      const count = Array.isArray(val) ? val.length : (typeof val === 'object' ? Object.keys(val).length : 1);
      console.log(`    "${key}": ${count} entries`);
    }

    // Also check for other keys to understand structure
    for (const key of localKeys) {
      if (!judgmentKeys.includes(key)) {
        const val = localDb[key];
        const count = Array.isArray(val) ? val.length : (typeof val === 'object' ? Object.keys(val).length : 1);
        console.log(`    "${key}": ${count} entries (non-judgment)`);
      }
    }

    manifest.verification.local_json = {
      path: localDbPath,
      keys: localKeys,
      judgment_related_keys: judgmentKeys,
      note: 'NOT MODIFIED — inspection only',
    };
  } else {
    console.log('  local-db.json not found');
    manifest.verification.local_json = { exists: false };
  }

  // ============================================================
  // 8. BACKUP INTEGRITY VERIFICATION
  // ============================================================
  console.log('\n\n--- 8. Backup Integrity Verification ---');

  // Re-read and verify every backup file
  const verifyDocs = JSON.parse(fs.readFileSync(docsFile, 'utf-8'));
  const verifyChunks = JSON.parse(fs.readFileSync(chunksFile, 'utf-8'));
  const verifyAudit = JSON.parse(fs.readFileSync(auditFile, 'utf-8'));

  const docCountMatch = verifyDocs.length === docs.length;
  const chunkCountMatch = verifyChunks.length === allChunks.length;
  const auditCountMatch = verifyAudit.length === auditLogs.length;

  // Spot-check: compare first and last document IDs
  const docIdMatch = verifyDocs[0].id === docs[0].id && verifyDocs[verifyDocs.length - 1].id === docs[docs.length - 1].id;

  // Verify full_text is preserved
  const textPreserved = verifyDocs.every(d => d.full_text && d.full_text.length > 0);

  // Verify embeddings in chunks
  const embeddingsPreserved = verifyChunks.filter(c => c.embedding && c.embedding.length > 0).length;

  console.log(`  Documents: ${docCountMatch ? '✅' : '❌'} ${verifyDocs.length}/${docs.length}`);
  console.log(`  Document IDs match: ${docIdMatch ? '✅' : '❌'}`);
  console.log(`  Full text preserved: ${textPreserved ? '✅' : '❌'} (all ${verifyDocs.length} have text)`);
  console.log(`  Chunks: ${chunkCountMatch ? '✅' : '❌'} ${verifyChunks.length}/${allChunks.length}`);
  console.log(`  Embeddings preserved: ${embeddingsPreserved}/${verifyChunks.length}`);
  console.log(`  Audit logs: ${auditCountMatch ? '✅' : '❌'} ${verifyAudit.length}/${auditLogs.length}`);

  // Verify PDFs
  for (const pdfInfo of manifest.r2_pdfs) {
    const pdfPath = path.join(PDF_DIR, pdfInfo.local_file);
    const exists = fs.existsSync(pdfPath);
    const size = exists ? fs.statSync(pdfPath).size : 0;
    const rehash = exists ? crypto.createHash('sha256').update(fs.readFileSync(pdfPath)).digest('hex') : '';
    const ok = exists && size === pdfInfo.r2_size && rehash === pdfInfo.sha256;
    console.log(`  PDF ${pdfInfo.local_file}: ${ok ? '✅' : '❌'} (${size} bytes, hash ${ok ? 'match' : 'MISMATCH'})`);
  }

  manifest.verification.integrity = {
    documents_count_match: docCountMatch,
    documents_id_match: docIdMatch,
    documents_text_preserved: textPreserved,
    chunks_count_match: chunkCountMatch,
    chunks_embeddings_preserved: embeddingsPreserved,
    audit_logs_count_match: auditCountMatch,
    pdfs_verified: manifest.r2_pdfs.every(p => p.write_verified),
    overall: docCountMatch && chunkCountMatch && auditCountMatch && docIdMatch && textPreserved,
  };

  // ============================================================
  // SAVE MANIFEST
  // ============================================================
  const manifestFile = path.join(BACKUP_DIR, 'backup-manifest.json');
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  const manifestHash = crypto.createHash('sha256').update(fs.readFileSync(manifestFile)).digest('hex');
  console.log(`\n\n=== MANIFEST SAVED ===`);
  console.log(`File: ${manifestFile}`);
  console.log(`SHA-256: ${manifestHash}`);

  // Final summary
  console.log('\n\n=== STAGE 1 BACKUP SUMMARY ===');
  console.log(`Backup location: ${BACKUP_DIR}`);
  const files = fs.readdirSync(BACKUP_DIR);
  const pdfFiles = fs.existsSync(PDF_DIR) ? fs.readdirSync(PDF_DIR) : [];
  console.log(`Files: ${files.filter(f => f !== 'pdfs').join(', ')}`);
  console.log(`PDFs: ${pdfFiles.join(', ')}`);
  let totalSize = 0;
  for (const f of files) {
    const fp = path.join(BACKUP_DIR, f);
    if (fs.statSync(fp).isFile()) totalSize += fs.statSync(fp).size;
  }
  for (const f of pdfFiles) {
    totalSize += fs.statSync(path.join(PDF_DIR, f)).size;
  }
  console.log(`Total backup size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Overall integrity: ${manifest.verification.integrity.overall ? '✅ VERIFIED' : '❌ ISSUES FOUND'}`);
  console.log('\n=== STAGE 1 COMPLETE ===');
}

main().catch(err => { console.error('FATAL ERROR:', err); process.exit(1); });
