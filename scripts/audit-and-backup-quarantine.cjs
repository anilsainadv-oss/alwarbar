const { createClient } = require('@supabase/supabase-js');
const { S3Client, HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 1. Load environment variables from .env.local
if (fs.existsSync('.env.local')) {
  for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.substring(0, idx).trim();
      let v = trimmed.substring(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[k] = v;
    }
  }
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'alwar-advocates-judgements';

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function main() {
  console.log('========================================================================');
  console.log('PHASE A & B: COMPREHENSIVE AUDIT & SAFE BACKUP FOR QUARANTINE');
  console.log('========================================================================\n');

  // Fetch all 16 legal documents from Supabase
  const { data: docs, error: docErr } = await supabaseAdmin
    .from('legal_documents')
    .select('*')
    .order('created_at', { ascending: true });

  if (docErr) {
    console.error('Failed to fetch legal_documents:', docErr);
    process.exit(1);
  }

  console.log(`Fetched ${docs.length} legal documents from Supabase.\n`);

  // Fetch all chunks
  const { data: chunks, error: chunkErr } = await supabaseAdmin
    .from('legal_document_chunks')
    .select('*')
    .order('chunk_index', { ascending: true });

  if (chunkErr) {
    console.error('Failed to fetch legal_document_chunks:', chunkErr);
    process.exit(1);
  }

  console.log(`Fetched ${chunks.length} total vector chunks from Supabase.\n`);

  // Fetch sources and processing telemetry if tables exist
  let sources = [];
  try {
    const { data: srcData } = await supabaseAdmin.from('legal_document_sources').select('*');
    if (srcData) sources = srcData;
  } catch (e) {
    console.warn('Note: legal_document_sources query error:', e.message);
  }

  let processingLogs = [];
  try {
    const { data: procData } = await supabaseAdmin.from('legal_document_processing').select('*');
    if (procData) processingLogs = procData;
  } catch (e) {
    console.warn('Note: legal_document_processing query error:', e.message);
  }

  let ingestionJobs = [];
  try {
    const { data: jobData } = await supabaseAdmin.from('legal_ingestion_jobs').select('*');
    if (jobData) ingestionJobs = jobData;
  } catch (e) {
    console.warn('Note: legal_ingestion_jobs query error:', e.message);
  }

  // Audit each document
  const auditResults = [];

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const docChunks = chunks.filter(c => c.document_id === doc.id);
    const docSources = sources.filter(s => s.document_id === doc.id);
    const docProcessing = processingLogs.filter(p => p.document_id === doc.id);

    // Check Cloudflare R2 original PDF
    let r2Status = {
      exists: false,
      sizeBytes: 0,
      sha256: null,
      sha256Match: false,
      magicBytesValid: false,
      error: null
    };

    if (doc.storage_path) {
      try {
        const headCmd = new HeadObjectCommand({
          Bucket: BUCKET_NAME,
          Key: doc.storage_path
        });
        const headRes = await r2.send(headCmd);
        r2Status.exists = true;
        r2Status.sizeBytes = headRes.ContentLength || 0;

        // Try download first 1KB to verify magic bytes and stream for SHA-256
        const getCmd = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: doc.storage_path
        });
        const getRes = await r2.send(getCmd);
        const buf = await streamToBuffer(getRes.Body);
        const calcSha = crypto.createHash('sha256').update(buf).digest('hex');
        r2Status.sha256 = calcSha;
        r2Status.sha256Match = doc.pdf_sha256 ? calcSha.toLowerCase() === doc.pdf_sha256.toLowerCase() : false;
        r2Status.magicBytesValid = buf.subarray(0, 5).toString('ascii') === '%PDF-';
      } catch (err) {
        r2Status.error = err.name || err.message;
      }
    } else {
      r2Status.error = 'No storage_path defined on document record';
    }

    // Inspect content to determine if it is authentic or placeholder
    const fullText = doc.full_text || '';
    const textLen = fullText.length;
    
    // Check for obvious placeholders, test strings, synthetic markers
    const hasLorem = /lorem ipsum|sample text|dummy text|test judgment|placeholder|mock judgment/i.test(fullText) ||
                     /lorem ipsum|sample|test|dummy/i.test(doc.title || '');
    
    const isUltraShort = textLen < 300; // Real court judgments are rarely < 300 chars
    const hasCourtHeader = /SUPREME COURT|HIGH COURT|APPELLATE|IN THE COURT|JUDGMENT|ORDER/i.test(fullText);
    const hasCoram = Array.isArray(doc.judge_names) && doc.judge_names.length > 0;
    const hasParties = Array.isArray(doc.parties) && doc.parties.length > 0;
    const hasRealCaseNo = doc.case_number && doc.case_number.trim().length > 3 && !/test|demo/i.test(doc.case_number);

    // Determine classification
    let classification = 'AUTHENTIC';
    let incompleteReasons = [];

    if (hasLorem) {
      classification = 'PLACEHOLDER_DEMO';
      incompleteReasons.push('Contains placeholder/demo text patterns');
    }
    if (!r2Status.exists) {
      incompleteReasons.push(`Original PDF missing in Cloudflare R2 bucket (${r2Status.error || 'not found'})`);
    } else if (!r2Status.magicBytesValid) {
      incompleteReasons.push('R2 object lacks valid %PDF- magic bytes signature');
    } else if (!r2Status.sha256Match && doc.pdf_sha256) {
      incompleteReasons.push(`SHA-256 mismatch between Supabase metadata (${doc.pdf_sha256.slice(0, 10)}...) and R2 file (${r2Status.sha256?.slice(0, 10)}...)`);
    }

    if (isUltraShort) {
      incompleteReasons.push(`Extracted text is extremely short (${textLen} characters)`);
    }
    if (!doc.citation || doc.citation.trim() === '' || /pending|none|tbd/i.test(doc.citation)) {
      incompleteReasons.push('Missing or invalid formal legal citation');
    }

    // Evaluate authenticity vs placeholder
    if (hasLorem || (isUltraShort && !r2Status.exists)) {
      classification = 'INCOMPLETE_OR_PLACEHOLDER';
    } else if (incompleteReasons.length > 0 && !hasLorem) {
      classification = 'AUTHENTIC_BUT_INCOMPLETE_EXTRACTION';
    }

    auditResults.push({
      index: i + 1,
      id: doc.id,
      title: doc.title,
      citation: doc.citation,
      court_name: doc.court_name,
      court_level: doc.court_level,
      court_code: doc.court_code,
      bench: doc.bench,
      case_number: doc.case_number,
      judgment_date: doc.judgment_date,
      publication_status: doc.publication_status,
      approval_status: doc.approval_status || doc.verification_status,
      approved_by: doc.approved_by,
      approved_at: doc.approved_at,
      published_at: doc.published_at,
      storage_path: doc.storage_path,
      original_source_url: doc.original_source_url || doc.document_url,
      pdf_sha256: doc.pdf_sha256,
      text_length: textLen,
      chunk_count: docChunks.length,
      r2_pdf_exists: r2Status.exists,
      r2_pdf_size: r2Status.sizeBytes,
      r2_pdf_sha256: r2Status.sha256,
      r2_sha256_match: r2Status.sha256Match,
      r2_magic_bytes_valid: r2Status.magicBytesValid,
      r2_error: r2Status.error,
      classification,
      incomplete_reasons: incompleteReasons,
      chunks: docChunks,
      sources: docSources,
      processing_logs: docProcessing,
      raw_doc: doc
    });
  }

  // Print summary report
  console.log('------------------------------------------------------------------------');
  console.log('RECORD-WISE AUDIT TABLE');
  console.log('------------------------------------------------------------------------');
  for (const r of auditResults) {
    console.log(`[#${r.index}] ${r.id}`);
    console.log(`  Title:       ${r.title}`);
    console.log(`  Citation:    ${r.citation || 'N/A'} | Case: ${r.case_number || 'N/A'}`);
    console.log(`  Court:       ${r.court_name} (${r.court_code || 'N/A'}) - Bench: ${r.bench || 'Principal'}`);
    console.log(`  Status:      Publication: [${r.publication_status}] | Approval: [${r.approval_status}]`);
    console.log(`  Admin Audit: ApprovedBy: ${r.approved_by || 'NONE'} | ApprovedAt: ${r.approved_at || 'NONE'} | PublishedAt: ${r.published_at || 'NONE'}`);
    console.log(`  Text & Chunks: TextLen: ${r.text_length} chars | Chunks: ${r.chunk_count}`);
    console.log(`  R2 PDF:      Exists: ${r.r2_pdf_exists} (${r.r2_pdf_size} bytes) | MagicBytes: ${r.r2_magic_bytes_valid} | SHA Match: ${r.r2_sha256_match}`);
    console.log(`  Class:       *** ${r.classification} ***`);
    if (r.incomplete_reasons.length > 0) {
      console.log(`  Issues:      ${r.incomplete_reasons.join('; ')}`);
    }
    console.log('');
  }

  // Group by publication status & classification
  const publishedDocs = auditResults.filter(r => r.publication_status === 'published');
  const draftDocs = auditResults.filter(r => r.publication_status === 'draft');
  const placeholders = auditResults.filter(r => r.classification === 'INCOMPLETE_OR_PLACEHOLDER' || r.classification === 'PLACEHOLDER_DEMO');
  const authenticDocs = auditResults.filter(r => r.classification === 'AUTHENTIC');
  const incompleteExtraction = auditResults.filter(r => r.classification === 'AUTHENTIC_BUT_INCOMPLETE_EXTRACTION');

  console.log('========================================================================');
  console.log('AGGREGATE CLASSIFICATION AUDIT SUMMARY');
  console.log('========================================================================');
  console.log(`Total Legal Documents:             ${docs.length}`);
  console.log(`Total Vector Chunks:               ${chunks.length}`);
  console.log(`Published Records:                 ${publishedDocs.length}`);
  console.log(`Draft Records:                     ${draftDocs.length}`);
  console.log(`Identified Placeholders / Demos:   ${placeholders.length}`);
  console.log(`Authentic & Complete Records:      ${authenticDocs.length}`);
  console.log(`Authentic But Incomplete Extract:  ${incompleteExtraction.length}`);
  console.log('========================================================================\n');

  // ---------------------------------------------------------------------------
  // PHASE B: CREATE COMPREHENSIVE BACKUP
  // ---------------------------------------------------------------------------
  console.log('[PHASE B] Creating Comprehensive Standalone JSON Backup...');
  const backupDir = path.join(process.cwd(), 'data', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `quarantine-audit-backup-${timestamp}.json`;
  const backupPath = path.join(backupDir, backupFilename);

  const backupData = {
    exported_at: new Date().toISOString(),
    system: 'Alwar District & Sessions Bar Association Legal Research System',
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    r2_bucket: BUCKET_NAME,
    total_documents: docs.length,
    total_chunks: chunks.length,
    total_sources: sources.length,
    total_processing_logs: processingLogs.length,
    total_ingestion_jobs: ingestionJobs.length,
    documents: docs,
    chunks: chunks,
    sources: sources,
    processing_logs: processingLogs,
    ingestion_jobs: ingestionJobs,
    audit_telemetry: auditResults.map(r => ({
      id: r.id,
      title: r.title,
      citation: r.citation,
      classification: r.classification,
      incomplete_reasons: r.incomplete_reasons,
      r2_pdf_exists: r.r2_pdf_exists,
      r2_pdf_size: r.r2_pdf_size,
      r2_pdf_sha256: r.r2_pdf_sha256,
      storage_path: r.storage_path
    }))
  };

  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`  ✓ Backup written successfully to: ${backupPath}`);
  console.log(`  ✓ Backup size: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB`);

  // Verify Backup Readability & Integrity
  console.log('[PHASE B VERIFICATION] Reading and verifying backup file...');
  const readBack = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  if (
    readBack.total_documents === 16 &&
    Array.isArray(readBack.documents) &&
    readBack.documents.length === 16 &&
    readBack.total_chunks === chunks.length &&
    Array.isArray(readBack.chunks) &&
    readBack.chunks.length === chunks.length
  ) {
    console.log('  ✓ Backup file verification SUCCEEDED (16 documents, ' + chunks.length + ' chunks verified intact and recoverable).\n');
  } else {
    console.error('  FAIL: Backup verification failed!');
    process.exit(1);
  }

  // Also write the audit report in JSON for script consumption
  const reportPath = path.join(process.cwd(), 'data', 'backups', 'latest-audit-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditResults.map(r => {
    const copy = { ...r };
    delete copy.raw_doc;
    delete copy.chunks;
    return copy;
  }), null, 2), 'utf8');

  console.log(`Saved latest audit analysis to: ${reportPath}`);
}

main().catch(err => {
  console.error('Audit and backup script failed:', err);
  process.exit(1);
});
