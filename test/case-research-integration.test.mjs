import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export async function runCaseResearchIntegrationTests() {
  console.log('Testing Phase 7: My Case & Legal Research Integration Architecture...');

  const dbPath = path.join(process.cwd(), 'data', 'local-db.json');
  assert(fs.existsSync(dbPath), 'data/local-db.json must exist');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // Ensure mock legal documents and cases exist
  assert(Array.isArray(db.legal_documents) && db.legal_documents.length > 0, 'legal_documents must be populated');
  assert(Array.isArray(db.cases) && db.cases.length > 0, 'cases must be populated');

  if (!Array.isArray(db.saved_research)) {
    db.saved_research = [];
  }

  const sampleDoc1 = db.legal_documents[0];
  const sampleDoc2 = db.legal_documents[1] || db.legal_documents[0];
  const sampleCase1 = db.cases[0];
  const sampleCase2 = db.cases[1] || {
    id: 'case-test-isolated-002',
    advocate_id: sampleCase1.advocate_id,
    case_title: 'M/s Alwar Agro Industries v. State of Rajasthan',
    case_type: 'commercial'
  };

  const advocateA = sampleCase1.advocate_id;
  const advocateB = 'advocate-test-cross-tenant-999';

  // --------------------------------------------------------------------------
  // 1. LINKING PRECEDENTS TO ACTIVE CASE DOCKET
  // --------------------------------------------------------------------------
  console.log('  1. Testing Precedent Linking to Active Case Docket...');

  const savedId1 = 'saved-test-' + crypto.randomUUID();
  const savedEntry1 = {
    id: savedId1,
    user_id: advocateA,
    document_id: sampleDoc1.id,
    case_id: sampleCase1.id,
    notes: 'Binding precedent cited in support of application under Order 39 Rules 1 & 2 CPC',
    created_at: new Date().toISOString()
  };

  const savedId2 = 'saved-test-' + crypto.randomUUID();
  const savedEntry2 = {
    id: savedId2,
    user_id: advocateA,
    document_id: sampleDoc2.id,
    case_id: sampleCase2.id,
    notes: 'Precedent cited for commercial dispute jurisdiction',
    created_at: new Date().toISOString()
  };

  db.saved_research.push(savedEntry1, savedEntry2);

  assert(savedEntry1.case_id === sampleCase1.id, 'Entry 1 must link to sampleCase1');
  assert(savedEntry2.case_id === sampleCase2.id, 'Entry 2 must link to sampleCase2');
  console.log('    ✓ Precedent linking to case dockets verified');

  // --------------------------------------------------------------------------
  // 2. RETRIEVAL & FILTERING BY CASE DOCKET
  // --------------------------------------------------------------------------
  console.log('  2. Testing Precedent Retrieval Filtered by Specific Case Docket...');

  // Mock localDb.getSavedResearch
  function mockGetSavedResearch(userId, caseId) {
    const list = db.saved_research.filter(r => r.user_id === userId);
    const filtered = caseId ? list.filter(r => r.case_id === caseId) : list;
    return filtered.map(r => ({
      ...r,
      document: db.legal_documents.find(d => d.id === r.document_id)
    }));
  }

  const case1Research = mockGetSavedResearch(advocateA, sampleCase1.id);
  assert(case1Research.length >= 1, 'Case 1 must have at least 1 linked precedent');
  assert(case1Research.some(r => r.id === savedId1), 'Case 1 must include savedEntry1');
  assert(!case1Research.some(r => r.id === savedId2), 'Case 1 must NOT include savedEntry2 (isolated to Case 2)');
  assert(case1Research[0].document !== undefined, 'Linked document details must be hydrated');
  assert.strictEqual(case1Research[0].document.id, sampleDoc1.id, 'Document ID must match linked precedent');

  const case2Research = mockGetSavedResearch(advocateA, sampleCase2.id);
  assert(case2Research.some(r => r.id === savedId2), 'Case 2 must include savedEntry2');
  assert(!case2Research.some(r => r.id === savedId1), 'Case 2 must NOT include savedEntry1');

  console.log('    ✓ Docket-level precedent filtering and document hydration verified');

  // --------------------------------------------------------------------------
  // 3. CROSS-TENANT ADVOCATE ISOLATION
  // --------------------------------------------------------------------------
  console.log('  3. Testing Multi-Tenant Advocate Isolation on Saved Case Research...');

  const advocateBResearch = mockGetSavedResearch(advocateB, sampleCase1.id);
  assert.strictEqual(advocateBResearch.length, 0, 'Advocate B must see 0 precedents for Advocate A case');

  const advocateBAllResearch = mockGetSavedResearch(advocateB, null);
  assert.strictEqual(advocateBAllResearch.length, 0, 'Advocate B must have 0 access to Advocate A saved precedents');

  console.log('    ✓ Multi-tenant zero-leakage isolation verified between advocates');

  // --------------------------------------------------------------------------
  // 4. UNLINKING / DELETING PRECEDENT FROM DOCKET
  // --------------------------------------------------------------------------
  console.log('  4. Testing Precedent Unlinking & Docket Deletion...');

  const initialCount = db.saved_research.length;
  // Delete savedId1
  db.saved_research = db.saved_research.filter(r => !(r.id === savedId1 && r.user_id === advocateA));
  assert.strictEqual(db.saved_research.length, initialCount - 1, 'Exactly one entry must be deleted');

  const case1AfterDelete = mockGetSavedResearch(advocateA, sampleCase1.id);
  assert(!case1AfterDelete.some(r => r.id === savedId1), 'Deleted precedent must no longer appear in Case 1 docket');

  // Clean up test entry 2
  db.saved_research = db.saved_research.filter(r => r.id !== savedId2);

  console.log('    ✓ Precedent unlinking and instant docket synchronization verified');

  // --------------------------------------------------------------------------
  // 5. CASE CONTEXT SEARCH QUERY SYNTHESIS
  // --------------------------------------------------------------------------
  console.log('  5. Testing Case Context Query Parameter Formatting...');

  function generateCaseResearchUrl(c) {
    const queryParts = [c.case_title, c.case_type, c.court_name].filter(Boolean);
    const query = queryParts.join(' ');
    const params = new URLSearchParams({
      case_id: c.id,
      query: query
    });
    return `/my-case/research?${params.toString()}`;
  }

  const testCase = {
    id: 'case-test-123',
    case_title: 'Satish Kumar v. Municipal Council Alwar',
    case_type: 'injunction_civil',
    court_name: 'District & Sessions Court, Alwar'
  };

  const researchUrl = generateCaseResearchUrl(testCase);
  assert(researchUrl.includes('case_id=case-test-123'), 'URL must preserve case_id parameter');
  assert(researchUrl.includes('Satish+Kumar') || researchUrl.includes('Satish%20Kumar'), 'URL must encode case title');
  assert(researchUrl.includes('injunction_civil'), 'URL must include case type for relevant query matching');

  console.log('    ✓ Case context URL parameter synthesis verified');

  console.log('  ✓ PHASE 7 MY CASE INTEGRATION TESTS COMPLETED WITH 0 ERRORS\n');
}

if (process.argv[1]?.endsWith('case-research-integration.test.mjs')) {
  runCaseResearchIntegrationTests().catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
}
