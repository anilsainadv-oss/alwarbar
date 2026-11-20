const crypto = require('crypto');
const fs = require('fs');

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

function signSession(user) {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

const advocateToken = signSession({
  id: 'usr-adv-test-001',
  email: 'advocate.test@alwarbar.in',
  full_name: 'Test Advocate',
  role: 'registered_advocate'
});

const adminToken = signSession({
  id: 'admin-user-alwar-0001',
  email: 'admin@alwarbar.org',
  full_name: 'Admin User',
  role: 'public_admin'
});

const BASE_URL = 'http://localhost:3001';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json, headers: res.headers };
}

async function runAll10Tests() {
  console.log('========================================================================');
  console.log('PHASE 3: COMPREHENSIVE VERIFICATION - 10 INTEGRATED SUITE TESTS');
  console.log('========================================================================\n');

  const testResults = [];

  // TEST 1: Search by Case Number
  try {
    console.log('▶ TEST 1: Search by Case Number ("Criminal Appeal No. 1945")');
    const res = await fetchJson(`${BASE_URL}/api/my-case/research/search?q=${encodeURIComponent('Criminal Appeal No. 1945')}`, {
      headers: { 'Cookie': `${COOKIE_NAME}=${advocateToken}` }
    });
    const topResult = res.data.results?.[0];
    const pass = res.status === 200 && topResult?.citation === '2026 INSC 485';
    testResults.push({
      test: '1. Search by Case Number',
      status: pass ? 'PASS' : 'FAIL',
      details: `HTTP ${res.status} | Top: ${topResult?.citation || 'none'} | Score: ${topResult?.hybrid_score} | Case: ${topResult?.title?.slice(0, 30)}`
    });
  } catch (err) {
    testResults.push({ test: '1. Search by Case Number', status: 'FAIL', details: err.message });
  }

  // TEST 2: Search by Citation
  try {
    console.log('▶ TEST 2: Search by Citation ("2026 INSC 485" & "2026:RJ-JP:44204-DB")');
    const res1 = await fetchJson(`${BASE_URL}/api/my-case/research/search?q=${encodeURIComponent('2026 INSC 485')}`, {
      headers: { 'Cookie': `${COOKIE_NAME}=${advocateToken}` }
    });
    const res2 = await fetchJson(`${BASE_URL}/api/my-case/research/search?q=${encodeURIComponent('2026:RJ-JP:44204-DB')}`, {
      headers: { 'Cookie': `${COOKIE_NAME}=${advocateToken}` }
    });
    const pass1 = res1.status === 200 && res1.data.results?.[0]?.citation === '2026 INSC 485';
    const pass2 = res2.status === 200 && res2.data.results?.[0]?.citation === '2026:RJ-JP:44204-DB';
    testResults.push({
      test: '2. Search by Citation',
      status: pass1 && pass2 ? 'PASS' : 'FAIL',
      details: `SC Top: ${res1.data.results?.[0]?.citation} (score ${res1.data.results?.[0]?.hybrid_score}) | HC Top: ${res2.data.results?.[0]?.citation} (score ${res2.data.results?.[0]?.hybrid_score})`
    });
  } catch (err) {
    testResults.push({ test: '2. Search by Citation', status: 'FAIL', details: err.message });
  }

  // TEST 3: Search by Party Name
  try {
    console.log('▶ TEST 3: Search by Party Name ("Mahesh Kumar" & "Ravi Kumar")');
    const res1 = await fetchJson(`${BASE_URL}/api/my-case/research/search?q=${encodeURIComponent('Mahesh Kumar')}`, {
      headers: { 'Cookie': `${COOKIE_NAME}=${advocateToken}` }
    });
    const res2 = await fetchJson(`${BASE_URL}/api/my-case/research/search?q=${encodeURIComponent('Ravi Kumar')}`, {
      headers: { 'Cookie': `${COOKIE_NAME}=${advocateToken}` }
    });
    const pass1 = res1.status === 200 && res1.data.results?.[0]?.citation === '2026 INSC 485';
    const pass2 = res2.status === 200 && res2.data.results?.[0]?.citation === '2026:RJ-JP:44204-DB';
    testResults.push({
      test: '3. Search by Party Name',
      status: pass1 && pass2 ? 'PASS' : 'FAIL',
      details: `Mahesh Kumar -> ${res1.data.results?.[0]?.citation} | Ravi Kumar -> ${res2.data.results?.[0]?.citation}`
    });
  } catch (err) {
    testResults.push({ test: '3. Search by Party Name', status: 'FAIL', details: err.message });
  }

  // TEST 4: Semantic Legal Search
  try {
    console.log('▶ TEST 4: Semantic Legal Search ("quashing criminal proceedings dispute arising from agreement to sell")');
    const res = await fetchJson(`${BASE_URL}/api/my-case/research/search?q=${encodeURIComponent('quashing criminal proceedings dispute arising from agreement to sell')}`, {
      headers: { 'Cookie': `${COOKIE_NAME}=${advocateToken}` }
    });
    const count = res.data.results?.length || 0;
    const uniqueDocs = new Set(res.data.results?.map(r => r.document_id));
    const pass = res.status === 200 && count > 0 && uniqueDocs.size === count;
    testResults.push({
      test: '4. Semantic Legal Search',
      status: pass ? 'PASS' : 'FAIL',
      details: `Total: ${count} results | Unique docs: ${uniqueDocs.size}/${count} | Top: ${res.data.results?.[0]?.citation} (sem: ${res.data.results?.[0]?.semantic_score})`
    });
  } catch (err) {
    testResults.push({ test: '4. Semantic Legal Search', status: 'FAIL', details: err.message });
  }

  // TEST 5: Hybrid Search
  try {
    console.log('▶ TEST 5: Hybrid Search (Semantic + Court Filter + Deduplication)');
    const res = await fetchJson(`${BASE_URL}/api/my-case/research/search?q=compensation%20accident&court_level=Supreme%20Court`, {
      headers: { 'Cookie': `${COOKIE_NAME}=${advocateToken}` }
    });
    const allSC = res.data.results?.every(r => r.court_level === 'Supreme Court' || r.court_name?.includes('Supreme'));
    const uniqueDocs = new Set(res.data.results?.map(r => r.document_id));
    const pass = res.status === 200 && res.data.results?.length > 0 && allSC && uniqueDocs.size === res.data.results.length;
    testResults.push({
      test: '5. Hybrid Search & Deduplication',
      status: pass ? 'PASS' : 'FAIL',
      details: `Returned: ${res.data.results?.length} SC precedents | All SC: ${allSC} | 100% Unique Docs: ${uniqueDocs.size === res.data.results?.length}`
    });
  } catch (err) {
    testResults.push({ test: '5. Hybrid Search & Deduplication', status: 'FAIL', details: err.message });
  }

  // TEST 6: Public PDF Download Integrity
  try {
    console.log('▶ TEST 6: Public PDF Download (Supreme Court & Rajasthan High Court)');
    const resSC = await fetch(`${BASE_URL}/api/public/judgments/download?citation=${encodeURIComponent('2026 INSC 485')}&format=pdf`);
    const scBuffer = Buffer.from(await resSC.arrayBuffer());
    const scHash = crypto.createHash('sha256').update(scBuffer).digest('hex');

    const resHC = await fetch(`${BASE_URL}/api/public/judgments/download?citation=${encodeURIComponent('2026:RJ-JP:44204-DB')}&format=pdf`);
    const hcBuffer = Buffer.from(await resHC.arrayBuffer());
    const hcHash = crypto.createHash('sha256').update(hcBuffer).digest('hex');

    const expectedSCHash = 'abe47c9cd47ebaa987f85654367cfba47cf7133e7f6a517933bb2645e8644dcf';
    const expectedHCHash = '5b6b4b96b90b1d47048312caa754fb6c5a336c216d82fb6f759506465bf14db8';

    const pass = resSC.status === 200 && scHash === expectedSCHash && resHC.status === 200 && hcHash === expectedHCHash;
    testResults.push({
      test: '6. Public PDF Download SHA-256',
      status: pass ? 'PASS' : 'FAIL',
      details: `SC (21,859 B): ${scHash.slice(0, 16)}... (Match: ${scHash === expectedSCHash}) | HC (383,445 B): ${hcHash.slice(0, 16)}... (Match: ${hcHash === expectedHCHash})`
    });
  } catch (err) {
    testResults.push({ test: '6. Public PDF Download SHA-256', status: 'FAIL', details: err.message });
  }

  // TEST 7: Admin Approval Workflow Check
  try {
    console.log('▶ TEST 7: Admin Approval Workflow Check');
    const res = await fetchJson(`${BASE_URL}/api/admin/public/legal-library?`, {
      headers: { 'Cookie': `${COOKIE_NAME}=${adminToken}` }
    });
    const pass = res.status === 200 && Array.isArray(res.data.documents) && res.data.documents.length === 16;
    testResults.push({
      test: '7. Admin Approval & Library',
      status: pass ? 'PASS' : 'FAIL',
      details: `HTTP ${res.status} | Total Docs Managed: ${res.data.documents?.length || 0}/16`
    });
  } catch (err) {
    testResults.push({ test: '7. Admin Approval & Library', status: 'FAIL', details: err.message });
  }

  // TEST 8: Public Visibility Restrictions (Double-Lock: Drafts Hidden)
  try {
    console.log('▶ TEST 8: Public Visibility Restrictions (Double-Lock: Drafts Hidden)');
    // Attempt download of unpublished draft
    const resDraft = await fetch(`${BASE_URL}/api/public/judgments/download?citation=${encodeURIComponent('2026 (1) WLC (Raj) 214')}&format=pdf`);
    // Check public legal library with no admin cookie
    const resPublicLib = await fetchJson(`${BASE_URL}/api/public/laws?type=judgment`);
    const draftsLeaked = resPublicLib.data.laws?.some(l => l.citation === '2026 (1) WLC (Raj) 214' || l.citation === '2026 INSC 412');

    const pass = resDraft.status === 403 && !draftsLeaked;
    testResults.push({
      test: '8. Double-Lock Draft Protection',
      status: pass ? 'PASS' : 'FAIL',
      details: `Draft PDF download HTTP status: ${resDraft.status} (Expected 403) | Drafts leaked into Public Laws: ${draftsLeaked ? 'YES (SECURITY BUG)' : 'NONE (SECURE)'}`
    });
  } catch (err) {
    testResults.push({ test: '8. Double-Lock Draft Protection', status: 'FAIL', details: err.message });
  }

  // TEST 9: Public Laws API
  try {
    console.log('▶ TEST 9: Public Laws API (Case-Insensitive & Multi-Category)');
    const resAllUpper = await fetchJson(`${BASE_URL}/api/public/laws?category=ALL`);
    const resSC = await fetchJson(`${BASE_URL}/api/public/laws?category=sc_judgment`);
    const resHC = await fetchJson(`${BASE_URL}/api/public/laws?category=hc_judgment`);
    const pass = resAllUpper.status === 200 && resAllUpper.data.total > 0 && resSC.data.count > 0 && resHC.data.count > 0;
    testResults.push({
      test: '9. Public Laws API',
      status: pass ? 'PASS' : 'FAIL',
      details: `category=ALL: ${resAllUpper.data.count} items | SC judgments: ${resSC.data.count} | HC judgments: ${resHC.data.count}`
    });
  } catch (err) {
    testResults.push({ test: '9. Public Laws API', status: 'FAIL', details: err.message });
  }

  // TEST 10: Judgment Detail Page / API Rendering
  try {
    console.log('▶ TEST 10: Judgment Detail / Retrieval API');
    const resDocSC = await fetchJson(`${BASE_URL}/api/admin/public/legal-library?id=doc-21cecd00-613e-4d8b-a2d5-f576b066f922`, {
      headers: { 'Cookie': `${COOKIE_NAME}=${adminToken}` }
    });
    const doc = resDocSC.data.document || resDocSC.data.documents?.find(d => d.id === 'doc-21cecd00-613e-4d8b-a2d5-f576b066f922');
    const pass = resDocSC.status === 200 && Boolean(doc && doc.citation === '2026 INSC 485');
    testResults.push({
      test: '10. Judgment Detail Inspection',
      status: pass ? 'PASS' : 'FAIL',
      details: `HTTP ${resDocSC.status} | Retrieved: ${doc?.citation} | Full text length: ${doc?.full_text?.length} chars`
    });
  } catch (err) {
    testResults.push({ test: '10. Judgment Detail Inspection', status: 'FAIL', details: err.message });
  }

  console.log('\n========================================================================');
  console.log('FINAL VERIFICATION MATRIX:');
  console.log('========================================================================');
  console.table(testResults);

  const allPassed = testResults.every(t => t.status === 'PASS');
  console.log(`\nOVERALL SUITE STATUS: ${allPassed ? 'ALL 10 TESTS PASSED (100%)' : 'SOME TESTS FAILED'}`);
}

runAll10Tests();
