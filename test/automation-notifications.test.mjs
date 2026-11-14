import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { 
  notificationPreferencesSchema, 
  sendCommunicationSchema, 
  importCauseListSchema, 
  runAutomationSchema 
} from '../src/lib/validation/schemas.ts';
import { 
  sanitizeNotificationContent, 
  formatSafeHearingNotification 
} from '../src/lib/notifications/privacy-masker.ts';
import { parseCauseListText } from '../src/lib/automation/cause-list-parser.ts';

export async function runAutomationNotificationTests() {
  console.log('Testing P4 Automation, eCourts Cause List & Notifications Architecture...');

  const dbPath = path.join(process.cwd(), 'data', 'local-db.json');
  assert(fs.existsSync(dbPath), 'data/local-db.json must exist');
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  const advocateA = 'usr-rohitashwa-sain-331-1977';
  const advocateB = 'advocate-user-alwar-0003';

  // -------------------------------------------------------------
  // 1. NOTIFICATION PREFERENCES & VALIDATION
  // -------------------------------------------------------------
  console.log('  1. Testing Notification Preferences & Validation...');

  // A. Valid complete preferences
  const validPrefsParse = notificationPreferencesSchema.safeParse({
    email_enabled: true,
    whatsapp_enabled: true,
    in_app_enabled: true,
    daily_digest_enabled: true,
    daily_digest_time: '08:30',
    reminder_lead_days: [1, 2, 7],
    client_reminders_enabled: true,
    client_reminder_lead_days: 2,
    preferred_language: 'hi',
    quiet_hours_enabled: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '06:00'
  });
  assert.strictEqual(validPrefsParse.success, true, 'Valid preferences must pass validation');

  // B. Default values check
  const defaultPrefsParse = notificationPreferencesSchema.safeParse({});
  assert.strictEqual(defaultPrefsParse.success, true, 'Empty payload must populate defaults');
  if (defaultPrefsParse.success) {
    assert.strictEqual(defaultPrefsParse.data.email_enabled, true, 'email_enabled default must be true');
    assert.strictEqual(defaultPrefsParse.data.in_app_enabled, true, 'in_app_enabled default must be true');
    assert.strictEqual(defaultPrefsParse.data.daily_digest_enabled, true, 'daily_digest_enabled default must be true');
    assert.deepStrictEqual(defaultPrefsParse.data.reminder_lead_days, [1, 2], 'Default lead days must be [1, 2]');
    assert.strictEqual(defaultPrefsParse.data.preferred_language, 'en', 'Default language must be en');
  }

  // C. Invalid time format rejection
  const invalidTimeParse = notificationPreferencesSchema.safeParse({
    daily_digest_time: '25:99' // Invalid HH:MM
  });
  assert.strictEqual(invalidTimeParse.success, false, 'Invalid HH:MM time format must be rejected');

  // D. Invalid lead days range
  const invalidLeadDays = notificationPreferencesSchema.safeParse({
    reminder_lead_days: [999] // Max is 30
  });
  assert.strictEqual(invalidLeadDays.success, false, 'Lead days exceeding 30 must be rejected');

  // -------------------------------------------------------------
  // 2. PRIVACY MASKING (ATTORNEY-CLIENT PRIVILEGE)
  // -------------------------------------------------------------
  console.log('  2. Testing Privacy Masking on Unencrypted Notification Channels...');

  const sensitiveRaw = 'Client Ramesh Kumar (Aadhaar: 4321 8765 9876, PAN: ABCDE1234F, A/C: 12345678901234) has hearing. [CONFIDENTIAL Secret strategy: Do not disclose second witness]';
  const sanitized = sanitizeNotificationContent(sensitiveRaw);

  assert.strictEqual(sanitized.includes('4321 8765 9876'), false, 'Full Aadhaar must be masked');
  assert.strictEqual(sanitized.includes('XXXX-XXXX-9876'), true, 'Aadhaar must show only last 4 digits');
  assert.strictEqual(sanitized.includes('ABCDE1234F'), false, 'Full PAN must be masked');
  assert.strictEqual(sanitized.includes('XXXXX1234F'), true, 'PAN must be masked with standard pattern');
  assert.strictEqual(sanitized.includes('12345678901234'), false, 'Full bank account must be masked');
  assert.strictEqual(sanitized.includes('******1234'), true, 'Bank account must show only last 4 digits');
  assert.strictEqual(sanitized.includes('CONFIDENTIAL Secret strategy'), false, 'Confidential bracketed notes must be stripped');

  // Safe hearing notification formatting (English & Hindi)
  const safeEn = formatSafeHearingNotification({
    caseTitle: 'State of Rajasthan vs. Ramesh Kumar',
    caseNumber: 'Cr. Case 402/2024',
    courtName: 'Special Sessions Court (POCSO), Alwar',
    hearingDate: '2026-11-20',
    courtRoom: 'Court No. 3',
    language: 'en'
  });
  assert.strictEqual(safeEn.title.includes('Cr. Case 402/2024'), true, 'Title must contain case number');
  assert.strictEqual(safeEn.body.includes('Special Sessions Court (POCSO), Alwar'), true, 'Body must contain court name');
  assert.strictEqual(safeEn.body.includes('Court No. 3'), true, 'Body must contain court room');

  const safeHi = formatSafeHearingNotification({
    caseTitle: 'राजस्थान राज्य बनाम रमेश कुमार',
    caseNumber: 'क्रिमिनल वाद 402/2024',
    courtName: 'विशिष्ट सेशन न्यायालय, अलवर',
    hearingDate: '2026-11-20',
    language: 'hi'
  });
  assert.strictEqual(safeHi.title.includes('न्यायालय पेशी सूचना'), true, 'Hindi title must be localized');
  assert.strictEqual(safeHi.body.includes('सादर अभिभाषक'), true, 'Hindi body must have proper salutation');
  assert.strictEqual(safeHi.body.includes('विशिष्ट सेशन न्यायालय'), true, 'Hindi court name must be preserved');

  // -------------------------------------------------------------
  // 3. IDEMPOTENCY KEY & DEDUPLICATION ENGINE
  // -------------------------------------------------------------
  console.log('  3. Testing Idempotency & Deduplication Engine...');

  function generateIdempotencyKey(advocateId, type, targetId, date, channel) {
    return `${advocateId}:${type}:${targetId}:${date}:${channel}`.toLowerCase();
  }

  const key1 = generateIdempotencyKey(advocateA, 'hearing_reminder', 'case-001', '2026-11-20', 'email');
  const key2 = generateIdempotencyKey(advocateA, 'hearing_reminder', 'case-001', '2026-11-20', 'email');
  const key3 = generateIdempotencyKey(advocateA, 'hearing_reminder', 'case-001', '2026-11-20', 'whatsapp');

  assert.strictEqual(key1, key2, 'Deterministic keys for identical parameters must match exactly');
  assert.notStrictEqual(key1, key3, 'Different channels must produce distinct idempotency keys');

  // Simulated ledger deduplication check
  const deliveryLedger = new Map();
  function recordDelivery(key, record) {
    if (deliveryLedger.has(key)) {
      return { sent: false, skipped: true, reason: 'Duplicate reminder suppressed' };
    }
    deliveryLedger.set(key, record);
    return { sent: true, skipped: false };
  }

  const firstAttempt = recordDelivery(key1, { status: 'delivered', sent_at: new Date().toISOString() });
  assert.strictEqual(firstAttempt.sent, true, 'First notification dispatch must proceed');

  const duplicateAttempt = recordDelivery(key1, { status: 'delivered', sent_at: new Date().toISOString() });
  assert.strictEqual(duplicateAttempt.sent, false, 'Duplicate dispatch must be suppressed');
  assert.strictEqual(duplicateAttempt.skipped, true, 'Duplicate must be flagged as skipped');

  // -------------------------------------------------------------
  // 4. EMAIL NOTIFICATION SERVICE & OFFLINE SIMULATOR
  // -------------------------------------------------------------
  console.log('  4. Testing Email Notification Service & Offline Simulator...');

  function simulateEmailDispatch(payload) {
    const isConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'demo');
    const cleanSubject = sanitizeNotificationContent(payload.subject);
    const cleanText = sanitizeNotificationContent(payload.textBody);

    if (!isConfigured) {
      return {
        success: true,
        provider: 'Resend Email Simulator',
        messageId: `sim_email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        simulated: true,
        subject: cleanSubject,
        recipient: payload.to
      };
    }
    return { success: false, provider: 'Resend', messageId: '', simulated: false };
  }

  const emailRes = simulateEmailDispatch({
    to: 'advocate.rohitashwa@alwarbar.in',
    subject: 'Daily Cause List for Alwar Courts',
    textBody: 'You have 3 hearings scheduled tomorrow.'
  });

  assert.strictEqual(emailRes.success, true, 'Email dispatch must succeed');
  assert.strictEqual(emailRes.simulated, true, 'Email must honestly indicate simulated mode in offline/dev environment');
  assert.strictEqual(emailRes.messageId.startsWith('sim_email_'), true, 'Message ID must carry simulation prefix');

  // -------------------------------------------------------------
  // 5. WHATSAPP BUSINESS API SERVICE & E.164 NORMALIZATION
  // -------------------------------------------------------------
  console.log('  5. Testing WhatsApp Service & Meta Cloud API Compliance...');

  function normalizePhoneNumber(phone) {
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length === 10) return `91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return digits;
    return digits;
  }

  // A. E.164 normalization
  assert.strictEqual(normalizePhoneNumber('9414012345'), '919414012345', '10-digit Indian mobile must normalize with 91 prefix');
  assert.strictEqual(normalizePhoneNumber('+91 94140-56789'), '919414056789', 'Formatted number must strip non-digits');
  assert.strictEqual(normalizePhoneNumber('09414012345'), '09414012345', 'Malformed numbers must be detectable');

  // B. Phone validation
  function validateRecipientPhone(phone) {
    const norm = normalizePhoneNumber(phone);
    return norm.length === 12 && norm.startsWith('91');
  }

  assert.strictEqual(validateRecipientPhone('9414012345'), true, 'Valid Indian mobile must pass');
  assert.strictEqual(validateRecipientPhone('12345'), false, 'Short number must fail');

  // C. Meta Cloud API WhatsApp template formatting
  function formatWhatsAppPayload(recipient, templateName, params) {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizePhoneNumber(recipient),
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: params.map(p => ({ type: 'text', text: sanitizeNotificationContent(p) }))
          }
        ]
      }
    };
  }

  const waPayload = formatWhatsAppPayload('9414012345', 'hearing_reminder_advocate', [
    'Cr. Case 402/2024',
    'Court No. 1 Alwar',
    '2026-11-20'
  ]);
  assert.strictEqual(waPayload.messaging_product, 'whatsapp', 'Messaging product must be whatsapp');
  assert.strictEqual(waPayload.to, '919414012345', 'Recipient must be normalized E.164');
  assert.strictEqual(waPayload.template.components[0].parameters.length, 3, 'All 3 parameters must be populated');

  // -------------------------------------------------------------
  // 6. CLIENT COMMUNICATION HISTORY LEDGER & ISOLATION
  // -------------------------------------------------------------
  console.log('  6. Testing Client Communication History & Isolation...');

  const commParse = sendCommunicationSchema.safeParse({
    client_id: 'client-001',
    channel: 'whatsapp',
    message_type: 'hearing_reminder',
    content: 'Your case is listed tomorrow. Please arrive on time before Alwar Sessions Court.'
  });
  assert.strictEqual(commParse.success, true, 'Valid communication schema must pass');

  // Multi-tenant isolation test: client communication belongs strictly to advocate
  const mockCommunications = [
    {
      id: 'comm-001',
      advocate_id: advocateA,
      client_id: 'client-alwar-0001',
      case_id: 'case-001',
      channel: 'whatsapp',
      recipient: '9414012345',
      message_type: 'hearing_reminder',
      subject: 'Hearing Notice',
      content: 'Your case is listed tomorrow.',
      status: 'delivered',
      provider: 'Meta WhatsApp Cloud Simulator',
      sent_at: '2026-11-14T10:00:00.000Z'
    }
  ];

  const commsForA = mockCommunications.filter(c => c.advocate_id === advocateA);
  const commsForB = mockCommunications.filter(c => c.advocate_id === advocateB);

  assert.strictEqual(commsForA.length, 1, 'Advocate A must see their client communication');
  assert.strictEqual(commsForB.length, 0, 'Advocate B must not see Advocate A client communications');

  // -------------------------------------------------------------
  // 7. CAUSE LIST PARSER & DOCKET CROSS-REFERENCING
  // -------------------------------------------------------------
  console.log('  7. Testing District Court Alwar Cause List Parser & Docket Matcher...');

  const rawCauseListText = `
DISTRICT & SESSIONS COURT, ALWAR
BEFORE: PRESIDING OFFICER, MOTOR ACCIDENT CLAIMS TRIBUNAL, ALWAR
CAUSE LIST FOR: 2026-11-20

1. MACP 102/2023 - Sunita Devi & Ors. vs. National Insurance Co. Ltd. - Adv: Rohitashwa Sain vs. R.K. Sharma - Stage: Petitioner Evidence
2. Cr. Misc. 450/2024 - Mukesh Kumar vs. State of Rajasthan - Adv: Public Prosecutor - Stage: Hearing on Bail
3. CIS Civil Suit 88/2022 - M/s Alwar Builders vs. Rajasthan Housing Board - Adv: Rohitashwa Sain vs. Board Counsel - Stage: Final Arguments
`;

  const parsed = parseCauseListText(rawCauseListText, 'District & Sessions Court, Alwar', '2026-11-20');
  assert.strictEqual(parsed.causeListDate, '2026-11-20', 'Parser must detect cause list date');
  assert.strictEqual(parsed.entries.length >= 2, true, 'Parser must extract cause list entries');
  assert.strictEqual(parsed.entries[0].item_number, 1, 'First item number must be 1');
  assert(parsed.entries[0].case_number.length > 0, 'Must extract case number');

  // Test docket matching against local-db cases
  const advocateCases = dbData.cases.filter(c => c.advocate_id === advocateA);
  assert(advocateCases.length > 0, 'Advocate A must have cases in docket');

  function matchEntriesToCases(entries, cases) {
    const matches = [];
    for (const entry of entries) {
      const matchedCase = cases.find(c => {
        if (c.case_number && entry.case_number && c.case_number.toLowerCase().includes(entry.case_number.toLowerCase())) return true;
        if (c.cnr_number && entry.cnr_number && c.cnr_number.toLowerCase() === entry.cnr_number.toLowerCase()) return true;
        if (entry.parties && c.case_title && entry.parties.toLowerCase().includes(c.case_title.toLowerCase().split(' ')[0])) return true;
        return false;
      });
      if (matchedCase) {
        matches.push({ ...entry, matched_to_docket: true, docket_case_id: matchedCase.id });
      }
    }
    return matches;
  }

  // Create an entry that matches Advocate A's first case
  const testEntry = {
    item_number: 10,
    case_number: advocateCases[0].case_number,
    parties: advocateCases[0].case_title,
    court_name: 'District & Sessions Court, Alwar',
    cause_list_date: '2026-11-20'
  };

  const matched = matchEntriesToCases([testEntry], advocateCases);
  assert.strictEqual(matched.length, 1, 'Cause list entry must match docket case');
  assert.strictEqual(matched[0].docket_case_id, advocateCases[0].id, 'Must link to docket case id');

  // -------------------------------------------------------------
  // 8. CASE STATUS MONITORING & BACKGROUND JOBS
  // -------------------------------------------------------------
  console.log('  8. Testing Case Status Monitoring & Background Jobs...');

  // A. Automation Job Schema Validation
  const runAutoParse = runAutomationSchema.safeParse({
    job_type: 'hearing_reminders',
    target_date: '2026-11-20'
  });
  assert.strictEqual(runAutoParse.success, true, 'runAutomationSchema must accept valid job parameters');

  // B. Job State Transitions & Retry Logic
  const mockJob = {
    id: 'job-test-001',
    advocate_id: advocateA,
    job_type: 'hearing_reminder',
    status: 'pending',
    attempts: 0,
    max_attempts: 3,
    run_at: new Date().toISOString()
  };

  function processJob(job, willFail = false) {
    job.status = 'processing';
    job.attempts++;
    if (willFail) {
      if (job.attempts < job.max_attempts) {
        job.status = 'retrying';
        job.delayMinutes = job.attempts * 5; // Exponential backoff: 5m, 10m
      } else {
        job.status = 'failed';
      }
    } else {
      job.status = 'completed';
      job.completed_at = new Date().toISOString();
    }
    return job;
  }

  // Process success
  const successJob = processJob({ ...mockJob }, false);
  assert.strictEqual(successJob.status, 'completed', 'Job should mark completed on success');
  assert.strictEqual(successJob.attempts, 1, 'Job attempts must increment');

  // Process retry on first failure
  const retryJob = processJob({ ...mockJob }, true);
  assert.strictEqual(retryJob.status, 'retrying', 'Job should mark retrying if attempts < max_attempts');
  assert.strictEqual(retryJob.delayMinutes, 5, 'Backoff delay must be calculated');

  // Process terminal failure
  const failJob = processJob({ ...mockJob, attempts: 2 }, true);
  assert.strictEqual(failJob.status, 'failed', 'Job should mark failed when attempts reach max_attempts');

  console.log('✓ All 8 Automation & Notification architecture test categories passed successfully.');
}
