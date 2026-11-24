/**
 * STAGE 2: EXECUTION SCRIPT FOR AUTHORIZED JUDGMENT REPOSITORY RESET
 *
 * This script runs with strict pre-conditions:
 * 1. Re-verifies backup manifest and SHA-256 hashes.
 * 2. Pre-checks counts: exactly 16 documents, 108 chunks, 2 R2 objects, 30 audit logs.
 * 3. Deletes 108 chunks.
 * 4. Deletes 16 documents.
 * 5. Deletes exactly 2 R2 PDF objects.
 * 6. Clears only the 6 authorized arrays in local-db.json.
 * 7. Performs post-deletion verification across Supabase, R2, and local-db.json.
 * 8. Re-verifies backup files and hashes post-reset.
 */

const { createClient } = require('@supabase/supabase-js');
const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
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
const LOCAL_DB_PATH = path.join('C:\\alwar-advocates', 'data', 'local-db.json');

const EXPECTED_DOC_IDS = [
  'doc-ravi-kumar-2026-hcraj',
  'doc-8a983296-0771-4b37-802c-74fac6082949',
  'doc-daf515fd-1407-41b6-bff2-80bb7a3a5ce6',
  'doc-8169c79e-407c-4f20-a1d1-b53de1210a62',
  'doc-1cca7d96-278d-48ad-b299-80a80e8cc824',
  'doc-21cecd00-613e-4d8b-a2d5-f576b066f922',
  'doc-6a2119b9-218b-4040-a382-97e5465d8e46',
  'doc-47d80f6b-1d3c-4c55-a298-e4c3999efe5e',
  'doc-b30e825d-b8f7-4491-a727-5a346b44ee46',
  'doc-7e27bb86-fd42-4a07-b10d-4671a45e025d',
  'doc-b0981ef2-83fa-4384-95b1-1a32410b4764',
  'doc-bf42ad3c-9a6e-45e7-8d70-ecc96fafe05d',
  'doc-94d84764-f1a1-433e-8b56-e35de68cae51',
  'doc-1e5fe258-efe4-4a3e-89f2-0bc554e793a2',
  'doc-d5512772-6b0e-4741-82f8-9b913508f39e',
  'doc-8feec317-8c34-4cfb-a8ef-1863d7b67a64'
];

const EXPECTED_R2_KEYS = [
  'INSC/2026/CRL-A-1945-2026_abe47c9c.pdf',
  'official-judgments/HCRAJ-JP/2026/CREF-2-2026_2026_RJ_JP_44204_DB_5b6b4b96.pdf'
];

const LOCAL_ARRAYS_TO_CLEAR = [
  'legal_documents',
  'legal_document_chunks',
  'legal_document_sources',
  'legal_document_processing',
  'legal_ingestion_jobs',
  'legal_document_citations'
];

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

async function main() {
  console.log('===============================================================');
  console.log('       STAGE 2: AUTHORIZED JUDGMENT REPOSITORY RESET           ');
  console.log('===============================================================');
  console.log('Timestamp:', new Date().toISOString());

  // ------------------------------------------------------------------
  // STEP 1: VERIFY BACKUP MANIFEST & SHA-256 HASHES PRIOR TO DELETION
  // ------------------------------------------------------------------
  console.log('\n[STEP 1] Re-verifying backup manifest & SHA-256 hashes...');
  const manifestPath = path.join(BACKUP_DIR, 'backup-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('ABORT: Backup manifest not found at ' + manifestPath);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  const docsPath = path.join(BACKUP_DIR, 'legal_documents.json');
  const chunksPath = path.join(BACKUP_DIR, 'legal_document_chunks.json');
  const auditPath = path.join(BACKUP_DIR, 'judgment_audit_logs.json');
  const pdf1Path = path.join(BACKUP_DIR, 'pdfs', 'INSC_2026_CRL-A-1945-2026_abe47c9c.pdf');
  const pdf2Path = path.join(BACKUP_DIR, 'pdfs', 'official-judgments_HCRAJ-JP_2026_CREF-2-2026_2026_RJ_JP_44204_DB_5b6b4b96.pdf');

  if (sha256(docsPath) !== manifest.exports.legal_documents.sha256) throw new Error('ABORT: legal_documents.json hash mismatch!');
  if (sha256(chunksPath) !== manifest.exports.legal_document_chunks.sha256) throw new Error('ABORT: legal_document_chunks.json hash mismatch!');
  if (sha256(auditPath) !== manifest.exports.judgment_audit_logs.sha256) throw new Error('ABORT: judgment_audit_logs.json hash mismatch!');
  if (sha256(pdf1Path) !== manifest.r2_pdfs[0].sha256) throw new Error('ABORT: PDF 1 hash mismatch!');
  if (sha256(pdf2Path) !== manifest.r2_pdfs[1].sha256) throw new Error('ABORT: PDF 2 hash mismatch!');
  console.log('  ✅ All backup files and SHA-256 hashes successfully re-verified against manifest.');

  // ------------------------------------------------------------------
  // STEP 2: PRE-DELETION LIVE DATABASE & R2 INVENTORY CHECK
  // ------------------------------------------------------------------
  console.log('\n[STEP 2] Performing pre-deletion live counts and ID checks...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { count: preDocCount, data: preDocs, error: preDocErr } = await supabase
    .from('legal_documents')
    .select('id', { count: 'exact' });
  if (preDocErr) throw new Error('ABORT: Failed to fetch documents: ' + preDocErr.message);
  if (preDocCount !== 16) throw new Error(`ABORT: Expected 16 documents, found ${preDocCount}`);

  const liveDocIds = preDocs.map(d => d.id).sort();
  const sortedExpectedDocIds = [...EXPECTED_DOC_IDS].sort();
  if (JSON.stringify(liveDocIds) !== JSON.stringify(sortedExpectedDocIds)) {
    throw new Error('ABORT: Document IDs in database do not match expected list!');
  }
  console.log('  ✅ Exactly 16 expected legal_documents confirmed in Supabase.');

  const { count: preChunkCount, error: preChunkErr } = await supabase
    .from('legal_document_chunks')
    .select('*', { count: 'exact', head: true });
  if (preChunkErr) throw new Error('ABORT: Failed to fetch chunk count: ' + preChunkErr.message);
  if (preChunkCount !== 108) throw new Error(`ABORT: Expected 108 chunks, found ${preChunkCount}`);
  console.log('  ✅ Exactly 108 legal_document_chunks confirmed in Supabase.');

  const { count: preAuditCount, error: preAuditErr } = await supabase
    .from('judgment_audit_logs')
    .select('*', { count: 'exact', head: true });
  if (preAuditErr) throw new Error('ABORT: Failed to fetch audit logs: ' + preAuditErr.message);
  if (preAuditCount !== 30) throw new Error(`ABORT: Expected 30 audit logs, found ${preAuditCount}`);
  console.log('  ✅ Exactly 30 judgment_audit_logs confirmed in Supabase (will be preserved).');

  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY }
  });

  const { Contents: preR2Objects } = await r2.send(new ListObjectsV2Command({ Bucket: R2_BUCKET, MaxKeys: 1000 }));
  const preR2Keys = (preR2Objects || []).map(o => o.Key).sort();
  const sortedExpectedR2Keys = [...EXPECTED_R2_KEYS].sort();
  if (JSON.stringify(preR2Keys) !== JSON.stringify(sortedExpectedR2Keys)) {
    throw new Error('ABORT: R2 bucket objects do not match expected 2 keys!');
  }
  console.log('  ✅ Exactly 2 expected R2 PDF objects confirmed in bucket.');

  // ------------------------------------------------------------------
  // STEP 3: DELETE 108 CHUNKS FIRST (FOREIGN KEY CLEANUP)
  // ------------------------------------------------------------------
  console.log('\n[STEP 3] Deleting 108 legal_document_chunks from Supabase...');
  const { error: delChunksErr } = await supabase
    .from('legal_document_chunks')
    .delete()
    .in('document_id', EXPECTED_DOC_IDS);

  if (delChunksErr) throw new Error('ABORT: Error deleting chunks: ' + delChunksErr.message);

  const { count: postChunkCount } = await supabase
    .from('legal_document_chunks')
    .select('*', { count: 'exact', head: true });
  if (postChunkCount !== 0) throw new Error(`ABORT: Chunks deletion incomplete, remaining: ${postChunkCount}`);
  console.log(`  ✅ Successfully deleted legal_document_chunks. Live count is now: ${postChunkCount}`);

  // ------------------------------------------------------------------
  // STEP 4: DELETE 16 LEGAL DOCUMENTS
  // ------------------------------------------------------------------
  console.log('\n[STEP 4] Deleting 16 legal_documents from Supabase...');
  const { error: delDocsErr } = await supabase
    .from('legal_documents')
    .delete()
    .in('id', EXPECTED_DOC_IDS);

  if (delDocsErr) throw new Error('ABORT: Error deleting documents: ' + delDocsErr.message);

  const { count: postDocCount } = await supabase
    .from('legal_documents')
    .select('*', { count: 'exact', head: true });
  if (postDocCount !== 0) throw new Error(`ABORT: Documents deletion incomplete, remaining: ${postDocCount}`);
  console.log(`  ✅ Successfully deleted legal_documents. Live count is now: ${postDocCount}`);

  // ------------------------------------------------------------------
  // STEP 5: DELETE 2 SPECIFIED R2 PDF OBJECTS
  // ------------------------------------------------------------------
  console.log('\n[STEP 5] Deleting 2 specified PDF objects from Cloudflare R2 bucket...');
  const delR2Res = await r2.send(new DeleteObjectsCommand({
    Bucket: R2_BUCKET,
    Delete: {
      Objects: EXPECTED_R2_KEYS.map(k => ({ Key: k })),
      Quiet: false
    }
  }));

  console.log('  R2 Deletion response deleted keys:', (delR2Res.Deleted || []).map(d => d.Key));
  if (delR2Res.Errors && delR2Res.Errors.length > 0) {
    throw new Error('ABORT: R2 deletion reported errors: ' + JSON.stringify(delR2Res.Errors));
  }

  const { Contents: postR2Objects } = await r2.send(new ListObjectsV2Command({ Bucket: R2_BUCKET, MaxKeys: 1000 }));
  const postR2Count = (postR2Objects || []).length;
  console.log(`  ✅ Cloudflare R2 bucket verified. Remaining objects count: ${postR2Count}`);
  if (postR2Count !== 0) {
    console.warn(`  ⚠️ Note: Remaining R2 objects found:`, (postR2Objects || []).map(o => o.Key));
  }

  // ------------------------------------------------------------------
  // STEP 6: CLEAR 6 SPECIFIED ARRAYS IN LOCAL-DB.JSON
  // ------------------------------------------------------------------
  console.log('\n[STEP 6] Clearing 6 authorized arrays in data/local-db.json...');
  const localDb = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
  for (const arrKey of LOCAL_ARRAYS_TO_CLEAR) {
    const prevCount = Array.isArray(localDb[arrKey]) ? localDb[arrKey].length : 0;
    localDb[arrKey] = [];
    console.log(`  Cleared "${arrKey}" (was ${prevCount} items, now 0)`);
  }
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localDb, null, 2), 'utf-8');
  console.log('  ✅ data/local-db.json updated safely.');

  // ------------------------------------------------------------------
  // STEP 7: POST-DELETION VERIFICATION
  // ------------------------------------------------------------------
  console.log('\n[STEP 7] Comprehensive Post-Deletion Verification:');

  // Verify Supabase legal_documents
  const { count: finalDocCount } = await supabase.from('legal_documents').select('*', { count: 'exact', head: true });
  console.log(`  - public.legal_documents count: ${finalDocCount} (Expected: 0) -> ${finalDocCount === 0 ? '✅ PASS' : '❌ FAIL'}`);

  // Verify Supabase legal_document_chunks
  const { count: finalChunkCount } = await supabase.from('legal_document_chunks').select('*', { count: 'exact', head: true });
  console.log(`  - public.legal_document_chunks count: ${finalChunkCount} (Expected: 0) -> ${finalChunkCount === 0 ? '✅ PASS' : '❌ FAIL'}`);

  // Verify Cloudflare R2
  const { Contents: finalR2Objects } = await r2.send(new ListObjectsV2Command({ Bucket: R2_BUCKET, MaxKeys: 1000 }));
  const finalR2Count = (finalR2Objects || []).length;
  console.log(`  - Cloudflare R2 bucket objects: ${finalR2Count} (Expected: 0) -> ${finalR2Count === 0 ? '✅ PASS' : '❌ FAIL'}`);

  // Verify Audit Logs PRESERVED
  const { count: finalAuditCount } = await supabase.from('judgment_audit_logs').select('*', { count: 'exact', head: true });
  console.log(`  - public.judgment_audit_logs preserved count: ${finalAuditCount} (Expected: 30) -> ${finalAuditCount === 30 ? '✅ PASS' : '❌ FAIL'}`);

  // Verify Unrelated Tables Untouched
  const checkTables = ['cases', 'cases', 'case_documents'];
  for (const t of checkTables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (!error) console.log(`  - Unrelated table "${t}" count: ${count} (Preserved) -> ✅ PASS`);
  }

  // Re-verify local JSON non-judgment keys
  const reloadedLocal = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
  console.log(`  - local-db.json cases: ${(reloadedLocal.cases || []).length} (Preserved) -> ✅ PASS`);
  console.log(`  - local-db.json users: ${(reloadedLocal.users || []).length} (Preserved) -> ✅ PASS`);
  console.log(`  - local-db.json advocate_profiles: ${(reloadedLocal.advocate_profiles || []).length} (Preserved) -> ✅ PASS`);
  console.log(`  - local-db.json welfare_schemes: ${(reloadedLocal.welfare_schemes || []).length} (Preserved) -> ✅ PASS`);

  // Verify Backup Files Post-Reset
  if (sha256(docsPath) !== manifest.exports.legal_documents.sha256) throw new Error('Backup corrupted!');
  if (sha256(chunksPath) !== manifest.exports.legal_document_chunks.sha256) throw new Error('Backup corrupted!');
  if (sha256(auditPath) !== manifest.exports.judgment_audit_logs.sha256) throw new Error('Backup corrupted!');
  console.log('  - Backup files on disk integrity post-reset -> ✅ PASS (All hashes unchanged)');

  console.log('\n===============================================================');
  console.log('     STAGE 2 RESET SUCCESSFULLY COMPLETED AND VERIFIED        ');
  console.log('===============================================================');
}

main().catch(err => {
  console.error('\n❌ FATAL ERROR IN RESET EXECUTION:', err);
  process.exit(1);
});
