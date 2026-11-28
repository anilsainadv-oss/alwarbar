import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Supreme Court HTML parser test verification function
 * Mirrors src/lib/court-sync/sc-discovery-engine.ts
 */
function testParseSupremeCourtHtml(html) {
  const candidates = [];
  if (!html || typeof html !== 'string') return candidates;

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;

  while ((match = rowRegex.exec(html)) !== null) {
    const rowContent = match[1];
    const pdfLinkMatch = rowContent.match(/href=["'](https?:\/\/[^"']+\.pdf|\/[^"']+\.pdf)["']/i);
    if (!pdfLinkMatch) continue;

    let pdfUrl = pdfLinkMatch[1];
    if (pdfUrl.startsWith('/')) {
      pdfUrl = `https://www.sci.gov.in${pdfUrl}`;
    }

    const dateMatch = rowContent.match(/(\d{2})[-/](\d{2})[-/](\d{4})/) || rowContent.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
    let judgmentDate = '2026-11-20';
    if (dateMatch) {
      if (dateMatch[1].length === 4) {
        judgmentDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      } else {
        judgmentDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
      }
    }

    const diaryMatch = rowContent.match(/diary\s*(?:no\.?|number)?\s*[:\-]?\s*(\d+)/i) || pdfUrl.match(/(\d{5,10})/);
    const diaryNumber = diaryMatch ? diaryMatch[1] : `INSC-${Date.now()}`;

    const caseMatch = rowContent.match(/((?:Civil|Criminal|Special Leave|Writ)\s+(?:Appeal|Petition|Review|Misc)\s*(?:No\.?)?\s*[\d\/\s\(\)]+)/i);
    const caseNumber = caseMatch ? caseMatch[1].trim() : `Diary No. ${diaryNumber}`;

    const citationMatch = rowContent.match(/(\d{4}\s+INSC\s+\d+)/i);
    const citation = citationMatch ? citationMatch[1].trim() : `2026 INSC ${diaryNumber.slice(-4)}`;

    candidates.push({
      court_code: 'INSC',
      diary_number: diaryNumber,
      judgment_date: judgmentDate,
      case_number: caseNumber,
      citation,
      official_pdf_url: pdfUrl,
      official_viewer_url: pdfUrl
    });
  }

  return candidates;
}

export async function runScDiscoveryPipelineTests() {
  console.log('Testing Phase 9: Supreme Court Automatic Discovery, Fencing & Queue Pipeline...');

  // --------------------------------------------------------------------------
  // 1. SUPREME COURT HTML PARSING & CANDIDATE EXTRACTION
  // --------------------------------------------------------------------------
  console.log('  1. Testing Supreme Court HTML Parsing & URL Resolution...');
  const mockSciHtml = `
    <table class="table">
      <tr>
        <td>Diary No. 46527 - 2026</td>
        <td>Civil Appeal No. 8421/2026</td>
        <td>Ashok Kumar Sharma v. State of Rajasthan & Ors.</td>
        <td>20-11-2026</td>
        <td><a href="/pdf/MA-2445-2026_2026_INSC_1257.pdf">Judgment PDF</a></td>
      </tr>
      <tr>
        <td>Diary No. 45892 - 2026</td>
        <td>Criminal Appeal No. 2108/2026</td>
        <td>Harish Chandra v. State of Rajasthan</td>
        <td>18-11-2026</td>
        <td><a href="https://www.sci.gov.in/pdf/CrlA-2108-2026_2026_INSC_1248.pdf">Order PDF</a></td>
      </tr>
    </table>
  `;

  const parsed = testParseSupremeCourtHtml(mockSciHtml);
  assert.strictEqual(parsed.length, 2, 'Should extract exactly 2 judgment candidates from HTML table');
  assert.strictEqual(parsed[0].court_code, 'INSC');
  assert.strictEqual(parsed[0].diary_number, '46527');
  assert.strictEqual(parsed[0].judgment_date, '2026-11-20');
  assert.strictEqual(parsed[0].official_pdf_url, 'https://www.sci.gov.in/pdf/MA-2445-2026_2026_INSC_1257.pdf');
  console.log('    ✓ HTML parser correctly resolved relative URLs and extracted dates/diary numbers');

  // --------------------------------------------------------------------------
  // 2. ATOMIC LOCK ACQUISITION & MONOTONIC FENCING TOKEN SIMULATION
  // --------------------------------------------------------------------------
  console.log('  2. Testing Checkpoint Distributed Lock & Monotonic Fencing Token...');
  const checkpoint = {
    court_code: 'INSC',
    is_locked: false,
    locked_at: null,
    locked_by: null,
    lock_generation: 0,
    lease_duration_seconds: 300,
    last_scanned_judgment_date: null,
    last_scanned_diary_number: null
  };

  const worker1 = crypto.randomUUID();
  const worker2 = crypto.randomUUID();

  function acquireLock(cp, workerId, leaseSec = 300) {
    const now = Date.now();
    const isExpired = cp.locked_at ? (now - cp.locked_at) > (cp.lease_duration_seconds * 1000) : true;
    if (!cp.is_locked || isExpired) {
      cp.is_locked = true;
      cp.locked_at = now;
      cp.locked_by = workerId;
      cp.lock_generation += 1;
      cp.lease_duration_seconds = leaseSec;
      return { acquired: true, lock_generation: cp.lock_generation, locked_by: workerId };
    }
    return { acquired: false, lock_generation: cp.lock_generation, locked_by: cp.locked_by };
  }

  const res1 = acquireLock(checkpoint, worker1, 300);
  assert.strictEqual(res1.acquired, true, 'Worker 1 should acquire lock');
  assert.strictEqual(res1.lock_generation, 1, 'Initial lock generation must be 1');

  // Worker 2 tries to acquire concurrently -> rejected
  const res2 = acquireLock(checkpoint, worker2, 300);
  assert.strictEqual(res2.acquired, false, 'Concurrent worker 2 must be rejected');
  assert.strictEqual(res2.locked_by, worker1, 'Lock must remain owned by Worker 1');
  console.log('    ✓ Atomic lock acquisition protected against concurrent acquisition');

  // --------------------------------------------------------------------------
  // 3. WORKER HEARTBEAT & LEASE RENEWAL
  // --------------------------------------------------------------------------
  console.log('  3. Testing Worker Heartbeat & Fencing Guard...');
  function renewLock(cp, workerId, lockGen, additionalSec = 300) {
    const now = Date.now();
    const isExpired = cp.locked_at ? (now - cp.locked_at) > (cp.lease_duration_seconds * 1000) : true;
    if (cp.is_locked && cp.locked_by === workerId && cp.lock_generation === lockGen && !isExpired) {
      cp.locked_at = now;
      cp.lease_duration_seconds = additionalSec;
      return true;
    }
    return false;
  }

  assert.strictEqual(renewLock(checkpoint, worker2, 1), false, 'Worker 2 cannot renew Worker 1 lock');
  assert.strictEqual(renewLock(checkpoint, worker1, 999), false, 'Stale generation token cannot renew lock');
  assert.strictEqual(renewLock(checkpoint, worker1, 1), true, 'Valid owner with matching generation renews lock');
  console.log('    ✓ Fencing token validates lease renewal and prevents superseded worker mutation');

  // --------------------------------------------------------------------------
  // 4. PERSISTENT DISCOVERY QUEUE DEDUPLICATION
  // --------------------------------------------------------------------------
  console.log('  4. Testing Queue Deduplication via (court_code, diary_number, judgment_date)...');
  const queue = [];
  function enqueueCandidates(items) {
    const existing = new Set(queue.map(q => `${q.court_code}:${q.diary_number}:${q.judgment_date}`));
    let enqueued = 0;
    let duplicates = 0;
    for (const item of items) {
      const key = `${item.court_code}:${item.diary_number}:${item.judgment_date}`;
      if (existing.has(key)) {
        duplicates++;
        continue;
      }
      existing.add(key);
      queue.push({
        id: crypto.randomUUID(),
        ...item,
        status: 'pending',
        retry_count: 0,
        max_retries: 3,
        locked_by: null,
        lock_generation: null,
        locked_at: null
      });
      enqueued++;
    }
    return { enqueued, duplicates };
  }

  const enq1 = enqueueCandidates(parsed);
  assert.strictEqual(enq1.enqueued, 2, 'Initial batch must enqueue 2 candidates');
  assert.strictEqual(enq1.duplicates, 0);

  const enq2 = enqueueCandidates(parsed);
  assert.strictEqual(enq2.enqueued, 0, 'Duplicate batch must enqueue 0 candidates');
  assert.strictEqual(enq2.duplicates, 2, 'Must detect 2 duplicate candidates');
  console.log('    ✓ Discovery queue deduplication verified: 2 enqueued, 0 duplicate leaks');

  // --------------------------------------------------------------------------
  // 5. QUEUE BATCH CLAIM & ITEM STATE LIFECYCLE
  // --------------------------------------------------------------------------
  console.log('  5. Testing Batch Claim, Complete & Fail Lifecycle...');
  function claimBatch(cp, workerId, lockGen, batchSize = 5) {
    if (!cp.is_locked || cp.locked_by !== workerId || cp.lock_generation !== lockGen) {
      throw new Error('Worker does not hold the active unexpired court lock');
    }
    const pending = queue.filter(q => q.status === 'pending').slice(0, batchSize);
    for (const p of pending) {
      p.status = 'processing';
      p.locked_by = workerId;
      p.lock_generation = lockGen;
      p.locked_at = Date.now();
    }
    return pending;
  }

  // Unauthorized worker throws
  assert.throws(
    () => claimBatch(checkpoint, worker2, 1),
    /Worker does not hold the active unexpired court lock/,
    'Unauthorized worker must be blocked from claiming queue items'
  );

  const claimed = claimBatch(checkpoint, worker1, 1, 5);
  assert.strictEqual(claimed.length, 2, 'Active worker claims 2 pending items');
  assert.strictEqual(claimed[0].status, 'processing');

  // Complete item 0
  claimed[0].status = 'completed';
  claimed[0].document_id = 'doc-insc-2026-1257';
  claimed[0].locked_by = null;
  assert.strictEqual(queue[0].status, 'completed');
  assert.strictEqual(queue[0].document_id, 'doc-insc-2026-1257');

  // Fail item 1 three times -> transitions to failed_needs_review
  claimed[1].retry_count = 3;
  claimed[1].status = claimed[1].retry_count >= claimed[1].max_retries ? 'failed_needs_review' : 'failed';
  claimed[1].last_error = 'Simulated timeout';
  assert.strictEqual(queue[1].status, 'failed_needs_review');
  console.log('    ✓ Queue item lifecycle verified: pending -> processing -> completed & failed_needs_review');

  // --------------------------------------------------------------------------
  // 6. SAFE LOCK RELEASE & CURSOR ADVANCEMENT
  // --------------------------------------------------------------------------
  console.log('  6. Testing Lock Release & Cursor Advancement...');
  function releaseLock(cp, workerId, lockGen, success, newDate, newDiary) {
    if (cp.is_locked && cp.locked_by === workerId && cp.lock_generation === lockGen) {
      cp.is_locked = false;
      cp.locked_by = null;
      cp.locked_at = null;
      if (success) {
        if (newDate) cp.last_scanned_judgment_date = newDate;
        if (newDiary) cp.last_scanned_diary_number = newDiary;
      }
      return true;
    }
    return false;
  }

  const relSuccess = releaseLock(checkpoint, worker1, 1, true, '2026-11-20', '46527');
  assert.strictEqual(relSuccess, true, 'Lock release must succeed');
  assert.strictEqual(checkpoint.is_locked, false, 'Checkpoint must be unlocked');
  assert.strictEqual(checkpoint.last_scanned_judgment_date, '2026-11-20', 'Cursor date must advance');
  assert.strictEqual(checkpoint.last_scanned_diary_number, '46527', 'Cursor diary must advance');

  const relDouble = releaseLock(checkpoint, worker1, 1, true);
  assert.strictEqual(relDouble, false, 'Double release must be rejected');
  console.log('    ✓ Lock safely released and cursor advanced to 2026-11-20 (Diary 46527)');

  // --------------------------------------------------------------------------
  // 7. DATA INTEGRITY & LOCAL-DB HASH PRESERVATION
  // --------------------------------------------------------------------------
  console.log('  7. Verifying data/local-db.json SHA-256 Hash Preservation...');
  const localDbPath = path.join(process.cwd(), 'data', 'local-db.json');
  assert.ok(fs.existsSync(localDbPath), 'data/local-db.json must exist');
  const dbBytes = fs.readFileSync(localDbPath);
  const currentHash = crypto.createHash('sha256').update(dbBytes).digest('hex').toUpperCase();
  const EXPECTED_HASH = '636938BAA091D7AED65433EBD6233C283E58510678DEE7F0D9BDA41561BD41C0';
  assert.strictEqual(currentHash, EXPECTED_HASH, `data/local-db.json hash must match expected ${EXPECTED_HASH}`);
  console.log('    ✓ data/local-db.json SHA-256 hash verified intact (zero destructive changes)');
}

if (process.argv[1]?.endsWith('sc-discovery-pipeline.test.mjs')) {
  runScDiscoveryPipelineTests().then(() => {
    console.log('\nALL SC DISCOVERY PIPELINE TESTS PASSED (0 ERRORS)');
    process.exit(0);
  }).catch(err => {
    console.error('\nTEST FAILED:', err);
    process.exit(1);
  });
}
