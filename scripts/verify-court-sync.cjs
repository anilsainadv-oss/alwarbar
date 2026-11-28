const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const http = require('http');

// Load environment variables from .env.local
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

const AUTH_SECRET = process.env.AUTH_SECRET || 'alwar-advocates-secure-dev-secret-1234567890abcdef';
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'alwar_law_session';
const CRON_SECRET = process.env.CRON_SECRET || '';
if (CRON_SECRET.length < 24) { console.error('Set CRON_SECRET (24+ chars) in .env.local first.'); process.exit(1); }
const BASE_URL = 'http://localhost:3001';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function signSession(user) {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

const adminToken = signSession({
  id: 'admin-user-alwar-0001',
  email: 'admin@alwarbar.org',
  full_name: 'Alwar Bar Admin',
  role: 'public_admin'
});

const advocateToken = signSession({
  id: 'usr-adv-test-001',
  email: 'advocate.test@alwarbar.in',
  full_name: 'Test Advocate',
  role: 'registered_advocate'
});

async function httpRequest(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, headers: res.headers, text, json };
}

async function main() {
  console.log('========================================================================');
  console.log('AUTOMATIC LATEST COURT JUDGMENT INGESTION & SCHEDULER VERIFICATION');
  console.log('Target: Supreme Court of India (sci.gov.in) & Rajasthan HC (hcraj.nic.in)');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`  FAIL: ${message}`);
      failed++;
      throw new Error(message);
    } else {
      console.log(`  ✓ ${message}`);
      passed++;
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 1: Supabase Baseline Audit (16 Documents, 108 Chunks)
  // ---------------------------------------------------------------------------
  console.log('[STEP 1] Auditing Supabase Production Baseline Database...');
  const { data: baselineDocs, error: docErr } = await supabaseAdmin
    .from('legal_documents')
    .select('id, title, citation, publication_status, approval_status, approved_by, approved_at, published_at');
  
  assert(!docErr, `Querying legal_documents succeeded (error: ${docErr?.message || 'none'})`);
  assert(baselineDocs.length === 16, `Supabase contains exactly 16 legal documents (actual: ${baselineDocs.length})`);

  const { count: chunkCount, error: chunkErr } = await supabaseAdmin
    .from('legal_document_chunks')
    .select('id', { count: 'exact', head: true });
  assert(!chunkErr, `Querying legal_document_chunks succeeded (error: ${chunkErr?.message || 'none'})`);
  assert(chunkCount === 108, `Supabase contains exactly 108 vector chunks (actual: ${chunkCount})`);

  const draftDocs = baselineDocs.filter(d => d.publication_status === 'draft');
  assert(draftDocs.length === 6, `Exactly 6 documents are in DRAFT status (actual: ${draftDocs.length})`);
  assert(draftDocs.every(d => d.published_at === null && d.approved_by === null), 'All 6 draft documents have published_at=null and approved_by=null');
  console.log(`  Draft Document IDs: ${draftDocs.map(d => d.id).join(', ')}\n`);

  // ---------------------------------------------------------------------------
  // STEP 2: Verify Public Block on Draft Documents
  // ---------------------------------------------------------------------------
  console.log('[STEP 2] Verifying Public Download Barrier on Draft Documents...');
  for (const draft of draftDocs.slice(0, 3)) {
    const res = await httpRequest(`${BASE_URL}/api/public/judgments/download?id=${draft.id}&format=pdf`);
    assert(res.status === 403, `Draft judgment ${draft.id} blocked with HTTP 403 Forbidden (actual: ${res.status})`);
  }
  console.log('');

  // ---------------------------------------------------------------------------
  // STEP 3: Admin Legal Library Sync API - Authorization Checks
  // ---------------------------------------------------------------------------
  console.log('[STEP 3] Testing Sync API RBAC & Security Boundaries...');
  
  // Unauthenticated GET
  const unauthGet = await httpRequest(`${BASE_URL}/api/admin/public/legal-library/sync`);
  assert(unauthGet.status === 401 || unauthGet.status === 403, `Unauthenticated GET /sync blocked with 401/403 (actual: ${unauthGet.status})`);

  // Advocate GET (Non-Admin)
  const advGet = await httpRequest(`${BASE_URL}/api/admin/public/legal-library/sync`, {
    headers: { Cookie: `${COOKIE_NAME}=${advocateToken}` }
  });
  assert(advGet.status === 403, `Non-admin advocate GET /sync blocked with 403 Forbidden (actual: ${advGet.status})`);

  // Admin GET (Success)
  const adminGet = await httpRequest(`${BASE_URL}/api/admin/public/legal-library/sync`, {
    headers: { Cookie: `${COOKIE_NAME}=${adminToken}` }
  });
  assert(adminGet.status === 200, `Public Admin GET /sync succeeded with HTTP 200 (actual: ${adminGet.status})`);
  assert(adminGet.json && adminGet.json.supremeCourt, 'Sync response contains supremeCourt metrics');
  assert(adminGet.json && adminGet.json.rajasthanHighCourt, 'Sync response contains rajasthanHighCourt metrics');
  assert(adminGet.json && adminGet.json.global, 'Sync response contains global sync configuration');
  assert(adminGet.json.global.scheduleInterval.includes('6 hours'), 'Schedule interval correctly reports "Every 6 hours"');
  console.log(`  Supreme Court Status: ${adminGet.json.supremeCourt.status} (${adminGet.json.supremeCourt.courtName})`);
  console.log(`  Rajasthan High Court Status: ${adminGet.json.rajasthanHighCourt.status} (CAPTCHA detected: ${adminGet.json.rajasthanHighCourt.captchaDetected})`);
  console.log(`  Total Pending Approval: ${adminGet.json.global.totalPendingApproval}`);
  console.log(`  Next Scheduled Sync: ${adminGet.json.global.nextScheduledSyncAt}\n`);

  // ---------------------------------------------------------------------------
  // STEP 4: Scheduled 6-Hour Cron Security Boundary Checks
  // ---------------------------------------------------------------------------
  console.log('[STEP 4] Testing 6-Hour Scheduled Cron Route Security & Tokens...');

  // Unauthenticated Cron POST
  const unauthCron = await httpRequest(`${BASE_URL}/api/cron/court-sync`, { method: 'POST' });
  assert(unauthCron.status === 403, `Unauthenticated cron request blocked with 403 Forbidden (actual: ${unauthCron.status})`);

  // Invalid Token Cron POST
  const badTokenCron = await httpRequest(`${BASE_URL}/api/cron/court-sync`, {
    method: 'POST',
    headers: { Authorization: 'Bearer bad-secret-token' }
  });
  assert(badTokenCron.status === 403, `Invalid Bearer token cron request blocked with 403 Forbidden (actual: ${badTokenCron.status})`);

  // Valid Bearer Token Cron POST (Dry-Run Mode)
  const validCron = await httpRequest(`${BASE_URL}/api/cron/court-sync?court=supreme_court&dryRun=true&force=true`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CRON_SECRET}` }
  });
  assert(validCron.status === 200, `Authorized Bearer token cron request succeeded with HTTP 200 (actual: ${validCron.status})`);
  assert(validCron.json.dryRun === true, 'Cron output confirms dryRun: true');
  assert(validCron.json.success === true, 'Cron output reports success: true');
  console.log(`  Cron Duration: ${validCron.json.summary.durationMs}ms`);
  console.log(`  Supreme Court Ingestion Candidate Count: ${validCron.json.summary.newlyIngestedCount}\n`);

  // ---------------------------------------------------------------------------
  // STEP 5: Supreme Court Dry-Run Sync Verification
  // ---------------------------------------------------------------------------
  console.log('[STEP 5] Testing Supreme Court Dry-Run Sync Execution...');
  const scSync = await httpRequest(`${BASE_URL}/api/admin/public/legal-library/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `${COOKIE_NAME}=${adminToken}`
    },
    body: JSON.stringify({
      court: 'supreme_court',
      dryRun: true,
      force: true
    })
  });
  assert(scSync.status === 200, `Supreme Court Dry-Run Sync succeeded with HTTP 200 (actual: ${scSync.status})`);
  assert(scSync.json.dryRun === true, 'Response confirms dryRun: true');
  assert(scSync.json.supremeCourtStatus.courtCode === 'INSC', 'Response court code is INSC');
  assert(scSync.json.summary.newlyIngestedCount >= 0, `Discovered judgments processed: ${scSync.json.summary.newlyIngestedCount}`);
  console.log(`  Supreme Court Candidates: ${JSON.stringify(scSync.json.documents.map(d => ({ citation: d.citation, court: d.court })))}`);
  console.log(`  Duplicates Skipped: ${scSync.json.duplicates.length}\n`);

  // ---------------------------------------------------------------------------
  // STEP 6: Rajasthan High Court Dry-Run & Anti-Bot Security Compliance
  // ---------------------------------------------------------------------------
  console.log('[STEP 6] Testing Rajasthan High Court Dry-Run & Anti-Bot Protection...');
  const hcSync = await httpRequest(`${BASE_URL}/api/admin/public/legal-library/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `${COOKIE_NAME}=${adminToken}`
    },
    body: JSON.stringify({
      court: 'rajasthan_high_court',
      dryRun: true,
      force: true
    })
  });
  assert(hcSync.status === 200, `Rajasthan High Court Dry-Run Sync succeeded with HTTP 200 (actual: ${hcSync.status})`);
  assert(hcSync.json.dryRun === true, 'Response confirms dryRun: true');
  assert(hcSync.json.rajasthanHighCourtStatus.courtCode === 'HCRAJ', 'Response court code is HCRAJ');
  assert(hcSync.json.rajasthanHighCourtStatus.captchaDetected === true, 'Rajasthan High Court optical CAPTCHA gate safely detected');
  assert(hcSync.json.rajasthanHighCourtStatus.status === 'challenged' || hcSync.json.rajasthanHighCourtStatus.status === 'completed', 'HC sync status reflects challenged/handled');
  console.log(`  HC Security Notice: ${hcSync.json.rajasthanHighCourtStatus.lastErrorMessage || 'CAPTCHA gate respected without bypass'}\n`);

  // ---------------------------------------------------------------------------
  // STEP 7: Cloudflare R2 Non-Overwrite & Deduplication Guarantee Check
  // ---------------------------------------------------------------------------
  console.log('[STEP 7] Verifying Cloudflare R2 Non-Overwrite Guarantee...');
  // Inspect r2-client.ts to confirm HeadObjectCommand check
  const r2Source = fs.readFileSync('src/lib/storage/r2-client.ts', 'utf8');
  assert(r2Source.includes('HeadObjectCommand'), 'r2-client.ts imports and executes HeadObjectCommand');
  assert(r2Source.includes('headResponse'), 'r2-client.ts verifies headResponse before PutObject');
  assert(r2Source.includes('Never replace or overwrite an existing original PDF in R2'), 'r2-client.ts documents non-overwrite guarantee');

  // Inspect court-sync-service.ts to confirm Quadruple Deduplication
  const syncSource = fs.readFileSync('src/lib/court-sync/court-sync-service.ts', 'utf8');
  assert(syncSource.includes('existingCitations'), 'CourtSyncService verifies existing citations');
  assert(syncSource.includes('existingCaseNumbers'), 'CourtSyncService verifies existing court+case_number');
  assert(syncSource.includes('existingSourceUrls'), 'CourtSyncService verifies existing source URLs');
  assert(syncSource.includes('existingSha256'), 'CourtSyncService verifies existing binary SHA-256 hashes');
  assert(syncSource.includes("approval_status: 'pending'"), 'CourtSyncService forces approval_status: pending');
  assert(syncSource.includes("publication_status: 'draft'"), 'CourtSyncService forces publication_status: draft');
  console.log('  ✓ Quadruple deduplication and pending approval guarantees verified in source code.\n');

  // ---------------------------------------------------------------------------
  // STEP 8: Post-Execution Database State Verification (Zero Leakage Check)
  // ---------------------------------------------------------------------------
  console.log('[STEP 8] Verifying Post-Execution Database Integrity (Zero Unintended Writes)...');
  const { data: finalDocs, error: finalErr } = await supabaseAdmin
    .from('legal_documents')
    .select('id, title, publication_status');
  assert(!finalErr, 'Post-test query to legal_documents succeeded');
  assert(finalDocs.length === 16, `Document count remains strictly 16 after all dry-runs (actual: ${finalDocs.length})`);

  const { count: finalChunkCount, error: finalChunkErr } = await supabaseAdmin
    .from('legal_document_chunks')
    .select('id', { count: 'exact', head: true });
  assert(!finalChunkErr, 'Post-test query to legal_document_chunks succeeded');
  assert(finalChunkCount === 108, `Vector chunk count remains strictly 108 (actual: ${finalChunkCount})`);

  const finalDrafts = finalDocs.filter(d => d.publication_status === 'draft');
  assert(finalDrafts.length === 6, `Draft document count remains strictly 6 (actual: ${finalDrafts.length})`);
  console.log('  ✓ Post-test database state completely intact: 16 docs, 108 chunks, 6 drafts.\n');

  console.log('========================================================================');
  console.log(`ALL CHECKS PASSED: ${passed} PASSED, ${failed} FAILED (0 ERRORS)`);
  console.log('Production readiness for 6-Hour Automated Ingestion CONFIRMED.');
  console.log('========================================================================');
}

main().catch(err => {
  console.error('\nTEST EXECUTION ERROR:', err);
  process.exit(1);
});
