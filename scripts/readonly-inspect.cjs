/**
 * READ-ONLY Supabase + R2 Inspection Script
 * Queries production data directly - NO modifications.
 */
const { createClient } = require('@supabase/supabase-js');
const { S3Client, ListObjectsV2Command, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { loadLocalEnv } = require('./load-env.cjs');

const env = loadLocalEnv();
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_KEY;

const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY = env.R2_ACCESS_KEY;
const R2_SECRET_KEY = env.R2_SECRET_KEY;
const R2_BUCKET = env.R2_BUCKET;

async function main() {
  console.log('=== READ-ONLY PRODUCTION INSPECTION ===\n');
  console.log('Timestamp:', new Date().toISOString());

  // --- SUPABASE ---
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Count legal_documents
  const { count: docCount, error: docCountErr } = await supabase
    .from('legal_documents')
    .select('*', { count: 'exact', head: true });
  console.log('\n--- SUPABASE COUNTS ---');
  console.log('legal_documents count:', docCount, docCountErr ? `ERROR: ${docCountErr.message}` : '');

  // 2. Count legal_document_chunks
  const { count: chunkCount, error: chunkCountErr } = await supabase
    .from('legal_document_chunks')
    .select('*', { count: 'exact', head: true });
  console.log('legal_document_chunks count:', chunkCount, chunkCountErr ? `ERROR: ${chunkCountErr.message}` : '');

  // 3. All documents with details
  const { data: docs, error: docsErr } = await supabase
    .from('legal_documents')
    .select('id, citation, court_name, court_code, publication_status, approval_status, verification_status, approved_by, approved_at, r2_storage_key, pdf_sha256, source_url, full_text, created_at, updated_at')
    .order('created_at', { ascending: true });

  if (docsErr) {
    console.error('Error fetching documents:', docsErr.message);
    return;
  }

  // 4. Status breakdowns
  const statusCounts = {};
  const approvalCounts = {};
  let flaggedCount = 0;
  for (const d of docs) {
    statusCounts[d.publication_status] = (statusCounts[d.publication_status] || 0) + 1;
    approvalCounts[d.approval_status] = (approvalCounts[d.approval_status] || 0) + 1;
    if (!d.approved_by || !d.approved_at) flaggedCount++;
  }
  console.log('\n--- STATUS BREAKDOWN ---');
  console.log('Publication status:', JSON.stringify(statusCounts));
  console.log('Approval status:', JSON.stringify(approvalCounts));
  console.log('Flagged (no approved_by or approved_at):', flaggedCount);

  // 5. Get chunk counts per document
  const { data: chunkData, error: chunkErr } = await supabase
    .from('legal_document_chunks')
    .select('document_id');

  const chunkMap = {};
  if (chunkData) {
    for (const c of chunkData) {
      chunkMap[c.document_id] = (chunkMap[c.document_id] || 0) + 1;
    }
  }

  // 6. Per-document detail table
  console.log('\n--- PER-DOCUMENT DETAILS ---');
  console.log('ID | Citation | Court | Pub Status | Appr Status | Approved By | Approved At | R2 Key | SHA-256 | Text Length | Chunks');
  console.log('-'.repeat(180));

  for (const d of docs) {
    const textLen = d.full_text ? d.full_text.length : 0;
    const chunks = chunkMap[d.id] || 0;
    const r2Key = d.r2_storage_key || 'NULL';
    const sha = d.pdf_sha256 ? d.pdf_sha256.substring(0, 16) + '...' : 'NULL';
    const approvedBy = d.approved_by || 'NULL';
    const approvedAt = d.approved_at ? d.approved_at.substring(0, 19) : 'NULL';
    const citation = (d.citation || 'NO CITATION').substring(0, 50);
    const court = (d.court_name || d.court_code || 'UNKNOWN').substring(0, 25);

    console.log(`${d.id.substring(0,8)} | ${citation} | ${court} | ${d.publication_status} | ${d.approval_status} | ${approvedBy} | ${approvedAt} | ${r2Key.substring(0,40)} | ${sha} | ${textLen} | ${chunks}`);
  }

  // 7. Detailed JSON dump for each doc (without full_text)
  console.log('\n--- DETAILED DOCUMENT RECORDS (JSON) ---');
  for (let i = 0; i < docs.length; i++) {
    const d = { ...docs[i] };
    d.full_text_length = d.full_text ? d.full_text.length : 0;
    d.full_text = d.full_text ? `[${d.full_text.length} chars]` : null;
    d.chunk_count = chunkMap[d.id] || 0;
    console.log(`\nDocument ${i + 1}/${docs.length}:`);
    console.log(JSON.stringify(d, null, 2));
  }

  // --- CLOUDFLARE R2 ---
  console.log('\n\n--- CLOUDFLARE R2 INSPECTION ---');
  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY,
      secretAccessKey: R2_SECRET_KEY,
    },
  });

  try {
    const listResult = await r2.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      MaxKeys: 1000,
    }));

    const objects = listResult.Contents || [];
    console.log('Total R2 objects:', objects.length);

    for (const obj of objects) {
      console.log(`\nR2 Object: ${obj.Key}`);
      console.log(`  Size: ${obj.Size} bytes`);
      console.log(`  LastModified: ${obj.LastModified}`);
      console.log(`  ETag: ${obj.ETag}`);

      // HeadObject for content-type
      try {
        const head = await r2.send(new HeadObjectCommand({
          Bucket: R2_BUCKET,
          Key: obj.Key,
        }));
        console.log(`  ContentType: ${head.ContentType}`);
        console.log(`  ContentLength: ${head.ContentLength}`);
      } catch (e) {
        console.log(`  HeadObject error: ${e.message}`);
      }
    }

    // Cross-reference: which documents have R2 keys that exist
    console.log('\n--- R2 CROSS-REFERENCE ---');
    const r2Keys = new Set(objects.map(o => o.Key));
    for (const d of docs) {
      if (d.r2_storage_key) {
        const exists = r2Keys.has(d.r2_storage_key);
        console.log(`Doc ${d.id.substring(0,8)} (${(d.citation || 'no-citation').substring(0,40)}): R2 key "${d.r2_storage_key}" -> ${exists ? 'EXISTS' : 'MISSING'}`);
      }
    }
  } catch (e) {
    console.error('R2 error:', e.message);
  }

  // --- AUDIT LOGS ---
  console.log('\n\n--- AUDIT LOGS ---');
  const { data: auditLogs, count: auditCount, error: auditErr } = await supabase
    .from('judgment_audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: true });

  if (auditErr) {
    console.log('Audit logs table error:', auditErr.message);
  } else {
    console.log('Total audit log entries:', auditCount);
    if (auditLogs) {
      for (const log of auditLogs) {
        console.log(`  [${log.created_at}] ${log.action} on ${(log.document_id || '').substring(0,8)} by ${log.performed_by || 'system'} - ${(log.details || '').substring(0, 100)}`);
      }
    }
  }

  console.log('\n=== INSPECTION COMPLETE ===');
}

main().catch(console.error);
