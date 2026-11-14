import assert from 'node:assert';

const BASE_URL = 'http://localhost:3001';

async function runLiveSecurityVerification() {
  console.log('===============================================================');
  console.log('RUNNING LIVE HTTP SECURITY VERIFICATION ON ' + BASE_URL);
  console.log('===============================================================\n');

  // -------------------------------------------------------------
  // Test 1: Unauthorized Request
  // -------------------------------------------------------------
  console.log('1. Testing Unauthorized Request (/api/my-case/cases without session)...');
  const res1 = await fetch(`${BASE_URL}/api/my-case/cases`);
  assert.strictEqual(res1.status, 401, 'Unauthenticated request must return 401 Unauthorized');
  const data1 = await res1.json();
  assert(data1.error, 'Response must contain error description');
  console.log('  ✓ Correctly rejected with 401 Unauthorized:', data1.error);

  // -------------------------------------------------------------
  // Test 2: Invalid / Tampered Session Cookie
  // -------------------------------------------------------------
  console.log('\n2. Testing Tampered Session Cookie...');
  const forgedCookie = 'alwar_law_session=eyJpZCI6IjEyMyIsInJvbGUiOiJyZWdpc3RlcmVkX2Fkdm9jYXRlIn0=.deadbeefcafebabe1234567890abcdef';
  const res2 = await fetch(`${BASE_URL}/api/my-case/cases`, {
    headers: { Cookie: forgedCookie }
  });
  assert.strictEqual(res2.status, 401, 'Tampered session cookie must return 401');
  console.log('  ✓ Tampered signature rejected with 401 Unauthorized');

  // -------------------------------------------------------------
  // Test 3: Backdoor Elimination Test
  // -------------------------------------------------------------
  console.log('\n3. Testing Backdoor Elimination (Universal Password Bypass Attempt)...');
  // Attempt to log into Anil Sain account with universal backdoor password 'Password@r1234'
  // (Anil Sain's actual password is 'Advocate@2026')
  const res3 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'anilsain.adv@gmail.com',
      password: 'Password@r1234' // Old backdoor password
    })
  });
  assert.strictEqual(res3.status, 401, 'Backdoor password MUST NOT authenticate user with different password');
  const data3 = await res3.json();
  assert(!data3.error.includes('Password@'), 'Error message must NOT leak expected passwords');
  console.log('  ✓ Backdoor login rejected with 401 and generic safe error:', data3.error);

  // -------------------------------------------------------------
  // Test 4: Valid Login with Bcrypt Password Verification
  // -------------------------------------------------------------
  console.log('\n4. Testing Legitimate Authentication with BCrypt...');
  const res4 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'rohitashwa.adv@alwarbar.in',
      password: 'Password@r1234'
    })
  });
  assert.strictEqual(res4.status, 200, 'Legitimate login must return 200 OK');
  const cookiesList = res4.headers.getSetCookie ? res4.headers.getSetCookie() : [res4.headers.get('set-cookie')];
  const setCookie = cookiesList[0] || '';
  assert(setCookie.includes('alwar_law_session='), 'Response must set alwar_law_session cookie');
  assert(/httponly/i.test(setCookie), 'Session cookie must have HttpOnly flag');
  assert(/samesite=lax/i.test(setCookie), 'Session cookie must have SameSite=lax flag');
  assert(/max-age=604800/i.test(setCookie), 'Session cookie must have 7-day expiration');
  const data4 = await res4.json();
  assert.strictEqual(data4.user.email, 'rohitashwa.adv@alwarbar.in');
  console.log('  ✓ Successfully logged in with BCrypt hash; Secure HttpOnly cookie received');

  const advocateCookie = setCookie.split(';')[0];

  // -------------------------------------------------------------
  // Test 5: Authenticated Advocate Access & Data Isolation
  // -------------------------------------------------------------
  console.log('\n5. Testing Authenticated Advocate Access & Multi-Tenant Docket...');
  const res5 = await fetch(`${BASE_URL}/api/my-case/cases`, {
    headers: { Cookie: advocateCookie }
  });
  assert.strictEqual(res5.status, 200, 'Authenticated advocate request must return 200');
  const data5 = await res5.json();
  assert(Array.isArray(data5.cases), 'Cases list must be an array');
  assert(data5.cases.length > 0, 'Advocate must see their active cases');
  // Verify all returned cases strictly belong to this advocate
  const allBelong = data5.cases.every(c => c.advocate_id === data4.user.id);
  assert(allBelong, 'All cases in docket must strictly belong to authenticated advocate');
  console.log(`  ✓ Tenant isolation verified: Retrieved ${data5.cases.length} cases strictly belonging to ${data4.user.id}`);

  // -------------------------------------------------------------
  // Test 6: Zero-Knowledge Admin Barrier Enforcement
  // -------------------------------------------------------------
  console.log('\n6. Testing Zero-Knowledge Architecture (Case Admin Cannot Access Files)...');
  // Login as Case Admin
  const resAdmin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'case.admin@alwaradvocates.org',
      password: 'CaseAdmin@2026'
    })
  });
  assert.strictEqual(resAdmin.status, 200, 'Case Admin login must succeed');
  const adminCookie = resAdmin.headers.get('set-cookie').split(';')[0];

  // Case Admin attempts to query private advocate cases
  const resAdminCases = await fetch(`${BASE_URL}/api/my-case/cases`, {
    headers: { Cookie: adminCookie }
  });
  assert.strictEqual(resAdminCases.status, 403, 'Case Admin MUST be blocked from private advocate dossiers (403)');
  const adminCasesData = await resAdminCases.json();
  console.log('  ✓ Zero-Knowledge barrier verified: Case Admin blocked from private cases:', adminCasesData.error);

  // Case Admin CAN access their own telemetry endpoint
  const resTelemetry = await fetch(`${BASE_URL}/api/admin/case/telemetry`, {
    headers: { Cookie: adminCookie }
  });
  assert.strictEqual(resTelemetry.status, 200, 'Case Admin must be able to view aggregate telemetry');
  const telemetryData = await resTelemetry.json();
  assert(telemetryData.telemetry.totalAdvocates > 0);
  console.log('  ✓ Case Admin authorized for aggregate telemetry (Total Tenants:', telemetryData.telemetry.totalAdvocates, ')');

  // -------------------------------------------------------------
  // Test 7: Zod Input Validation
  // -------------------------------------------------------------
  console.log('\n7. Testing Zod Input Validation on APIs...');
  const resInvalidCase = await fetch(`${BASE_URL}/api/my-case/cases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: advocateCookie
    },
    body: JSON.stringify({ case_title: 'X' }) // Missing court_name, case_number, case_type
  });
  assert.strictEqual(resInvalidCase.status, 400, 'Invalid input must return 400 Bad Request');
  const invalidCaseData = await resInvalidCase.json();
  console.log('  ✓ Zod validation caught malformed request (400):', invalidCaseData.error);

  console.log('\n===============================================================');
  console.log('ALL LIVE HTTP SECURITY VERIFICATIONS PASSED (0 ERRORS)');
  console.log('===============================================================');
}

runLiveSecurityVerification().catch(err => {
  console.error('\nLIVE SECURITY VERIFICATION FAILED:', err);
  process.exit(1);
});
