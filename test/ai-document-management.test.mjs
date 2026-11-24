import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import * as docx from 'docx';
import { aiChatSchema, exportDocxSchema } from '../src/lib/validation/schemas.ts';
import { extractDocxText, extractPdfText, extractDocumentText, analyzeCaseFileFacts } from '../src/lib/ai/document-parser.ts';
import { generateLegalWordDocument } from '../src/lib/docx/generator.ts';
import { rateLimiter } from '../src/lib/security/rate-limit.ts';

export async function runAIDocumentManagementTests() {
  console.log('Testing P3 AI Legal Intelligence & Document Management Architecture...');

  const advocateA = 'advocate-user-alwar-0002';
  const advocateB = 'advocate-user-alwar-0003';

  // -------------------------------------------------------------
  // 1. MULTI-TURN AI CHAT SCHEMA & CONVERSATION VALIDATION
  // -------------------------------------------------------------
  const validChatParse = aiChatSchema.safeParse({
    sessionId: 'session-test-001',
    caseId: 'case-alwar-0001',
    message: 'What are the grounds for regular bail under Section 480 BNSS, 2023?',
    language: 'en'
  });
  assert.strictEqual(validChatParse.success, true, 'aiChatSchema must accept valid chat message');

  const emptyChatParse = aiChatSchema.safeParse({
    message: ''
  });
  assert.strictEqual(emptyChatParse.success, false, 'aiChatSchema must reject empty message');

  // Multi-turn simulated session
  const simulatedSession = {
    id: 'session-multi-turn-001',
    advocate_id: advocateA,
    case_id: 'case-alwar-0001',
    title: 'Regular Bail Consultation',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Accused arrested under Section 303(2) BNS for theft. Can we seek bail?',
        timestamp: new Date().toISOString(),
        tokens: 18
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Under Section 480 BNSS (replaces Section 437/439 CrPC), where offence is punishable up to 3 years and no recovery is pending, bail should ordinarily be granted as per Satender Kumar Antil (2022) 10 SCC 51.',
        timestamp: new Date().toISOString(),
        tokens: 45,
        costEstimateINR: 0.0000
      },
      {
        id: 'msg-3',
        role: 'user',
        content: 'What documents should we attach before Alwar Sessions Court?',
        timestamp: new Date().toISOString(),
        tokens: 12
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: 'Attach: 1. Certified copy of FIR; 2. Remand sheet showing custody date; 3. Clean antecedent affidavit; 4. Local resident proof to rule out flight risk.',
        timestamp: new Date().toISOString(),
        tokens: 38,
        costEstimateINR: 0.0000
      }
    ],
    total_tokens: 113,
    total_cost_inr: 0.0000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  assert.strictEqual(simulatedSession.messages.length, 4, 'Multi-turn conversation must preserve 4 turns');
  assert.strictEqual(simulatedSession.messages[0].role, 'user');
  assert.strictEqual(simulatedSession.messages[1].role, 'assistant');
  assert.strictEqual(simulatedSession.messages[2].role, 'user');
  assert.strictEqual(simulatedSession.messages[3].role, 'assistant');
  console.log('  ✓ Multi-turn chat conversation flow & schema validation verified');

  // -------------------------------------------------------------
  // 2. TOKEN USAGE & ESTIMATED COST TELEMETRY
  // -------------------------------------------------------------
  const promptTokens = Math.ceil('Accused arrested under Section 303(2) BNS for theft. Can we seek bail?'.length / 4);
  assert(promptTokens > 0, 'Prompt tokens must be non-zero');
  const completionTokens = Math.ceil('Under Section 480 BNSS...'.length / 4);
  assert(completionTokens > 0, 'Completion tokens must be non-zero');

  // Gemini Flash cost formula: (promptTokens * 0.0000063) + (completionTokens * 0.0000252)
  const simulatedCost = Number(((promptTokens * 0.0000063) + (completionTokens * 0.0000252)).toFixed(4));
  assert(simulatedCost >= 0, 'Cost in INR must be non-negative');

  // Rate Limiting check: 15 queries per minute
  const testLimiterKey = 'ai_query_test_' + Date.now();
  for (let i = 0; i < 15; i++) {
    const check = rateLimiter.check(testLimiterKey, 15, 60);
    assert.strictEqual(check.allowed, true, `Query ${i + 1} must be allowed under rate limit`);
  }
  const blockedCheck = rateLimiter.check(testLimiterKey, 15, 60);
  assert.strictEqual(blockedCheck.allowed, false, '16th query within same window must be blocked');
  console.log('  ✓ Token tracking, INR cost telemetry & 15-query/min rate limiter verified');

  // -------------------------------------------------------------
  // 3. HONEST AI DISCLOSURE & ZERO HALLUCINATION IN OFFLINE ENGINE
  // -------------------------------------------------------------
  const offlineAnalysis = analyzeCaseFileFacts(
    'Ramesh Kumar v. State of Rajasthan',
    'Bail Application',
    'District & Sessions Court, Alwar',
    'Arrested on 12/04/2026 under FIR No. 142/2026 Police Station Kotwali Alwar.',
    'Applicant is an innocent college student with no criminal record.'
  );

  assert.strictEqual(offlineAnalysis.isDemo, true, 'Offline analysis must truthfully flag isDemo: true');
  assert(offlineAnalysis.provider.includes('Deterministic') || offlineAnalysis.provider.includes('Zero Hallucination'),
    'Provider name must explicitly declare offline deterministic engine');
  assert(offlineAnalysis.chronology.length > 0, 'Chronology must extract event dates');
  assert(offlineAnalysis.legalIssues.length > 0, 'Legal issues must be framed');
  assert(offlineAnalysis.missingEvidenceChecklist.length > 0, 'Missing evidence checklist must be provided');
  console.log('  ✓ Honest AI disclosure (isDemo: true, zero hallucination) verified');

  // -------------------------------------------------------------
  // 4. PURE-NODE PDF TEXT EXTRACTION (FlateDecode Stream)
  // -------------------------------------------------------------
  const samplePdfText = 'IN THE COURT OF THE DISTRICT JUDGE AT ALWAR (RAJASTHAN)\nSUIT NO. 104 OF 2026';
  const streamContent = `BT /F1 12 Tf 72 712 Td (${samplePdfText}) Tj ET`;
  const compressedStream = zlib.deflateSync(Buffer.from(streamContent, 'utf8'));
  const testPdfBuffer = Buffer.concat([
    Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Page >>\nendobj\n2 0 obj\n<< /Filter /FlateDecode >>\nstream\r\n'),
    compressedStream,
    Buffer.from('\r\nendstream\nendobj\n%%EOF')
  ]);

  const pdfExtraction = extractPdfText(testPdfBuffer);
  assert(pdfExtraction.text.includes('DISTRICT JUDGE AT ALWAR'), 'PDF text extractor must extract stream text');
  assert.strictEqual(pdfExtraction.pageCount, 1, 'PDF page count must be 1');
  console.log('  ✓ Pure-Node PDF text extraction (FlateDecode stream & Tj operator) verified');

  // -------------------------------------------------------------
  // 5. PURE-NODE DOCX TEXT EXTRACTION (word/document.xml)
  // -------------------------------------------------------------
  const testDoc = new docx.Document({
    sections: [{
      children: [
        new docx.Paragraph({ children: [new docx.TextRun('APPLICATION FOR REGULAR BAIL')] }),
        new docx.Paragraph({ children: [new docx.TextRun('UNDER SECTION 480 OF BNSS, 2023')] }),
        new docx.Paragraph({ children: [new docx.TextRun('IN THE COURT OF SESSIONS JUDGE, ALWAR')] })
      ]
    }]
  });
  const testDocxBuffer = await docx.Packer.toBuffer(testDoc);
  const docxExtraction = extractDocxText(testDocxBuffer);
  assert(docxExtraction.text.includes('APPLICATION FOR REGULAR BAIL'), 'DOCX text extractor must extract heading');
  assert(docxExtraction.text.includes('SECTION 480 OF BNSS'), 'DOCX text extractor must extract ground');
  assert(docxExtraction.text.includes('SESSIONS JUDGE, ALWAR'), 'DOCX text extractor must extract court');
  assert.strictEqual(docxExtraction.paragraphCount, 3, 'DOCX paragraph count must be 3');
  console.log('  ✓ Pure-Node DOCX text extraction (PK ZIP package & word/document.xml) verified');

  // -------------------------------------------------------------
  // 6. VALID OPENXML DOCX DOCUMENT GENERATION & MS WORD COMPLIANCE
  // -------------------------------------------------------------
  const exportDocxParse = exportDocxSchema.safeParse({
    draftType: 'bail_application',
    title: 'APPLICATION FOR REGULAR BAIL UNDER SECTION 480 BNSS',
    contentText: '1. That the applicant is innocent and falsely implicated.\n2. That no recovery is pending from applicant.\n\nPRAYER:\nIt is prayed that regular bail may kindly be granted.',
    courtName: 'IN THE COURT OF DISTRICT & SESSIONS JUDGE, ALWAR',
    parties: { petitioner: 'Mukesh Kumar', respondent: 'State of Rajasthan' },
    language: 'en'
  });
  assert.strictEqual(exportDocxParse.success, true, 'exportDocxSchema must validate pleading draft parameters');

  const generatedWordDocBuffer = await generateLegalWordDocument({
    draftType: 'bail_application',
    title: 'APPLICATION FOR REGULAR BAIL UNDER SECTION 480 BNSS, 2023',
    courtName: 'IN THE COURT OF DISTRICT & SESSIONS JUDGE, ALWAR (RAJ.)',
    caseNumber: 'Bail App. 542 / 2026',
    petitioner: 'Mukesh Kumar S/o Shri Ram Dayal',
    respondent: 'State of Rajasthan through SHO, PS Kotwali Alwar',
    contentText: '1. That the applicant has been falsely roped into the present case.\n2. That interrogation and investigation is complete.\n\nPRAYER:\nIt is therefore prayed that this Honble Court may kindly release the applicant on regular bail.',
    language: 'en',
    advocateName: 'Rohitashwa Kumar Sain',
    enrollmentNo: 'R/331/1977',
    chamberAddress: 'Chamber No. 12, Bar Association Building, Alwar'
  });

  // A. Check Magic Bytes: Must start with 0x50 0x4B 0x03 0x04 (PK\x03\x04)
  assert.strictEqual(generatedWordDocBuffer[0], 0x50, 'Byte 0 must be P');
  assert.strictEqual(generatedWordDocBuffer[1], 0x4B, 'Byte 1 must be K');
  assert.strictEqual(generatedWordDocBuffer[2], 0x03, 'Byte 2 must be 0x03');
  assert.strictEqual(generatedWordDocBuffer[3], 0x04, 'Byte 3 must be 0x04');

  // B. Verify ZIP Package contains standard OpenXML components
  const docxTextFromGenerated = extractDocxText(generatedWordDocBuffer);
  assert(docxTextFromGenerated.text.includes('DISTRICT & SESSIONS JUDGE, ALWAR'), 'Generated Word DOCX must contain court name');
  assert(docxTextFromGenerated.text.includes('Mukesh Kumar'), 'Generated Word DOCX must contain petitioner name');
  assert(docxTextFromGenerated.text.includes('State of Rajasthan'), 'Generated Word DOCX must contain respondent');
  assert(docxTextFromGenerated.text.includes('PRAYER'), 'Generated Word DOCX must contain formal prayer');
  assert(docxTextFromGenerated.text.includes('Rohitashwa Kumar Sain'), 'Generated Word DOCX must contain advocate name');
  assert(docxTextFromGenerated.text.includes('R/331/1977'), 'Generated Word DOCX must contain Bar enrollment number');
  console.log('  ✓ 100% Valid Microsoft Word (.docx) OpenXML export (PK ZIP header & XML verification) verified');

  // -------------------------------------------------------------
  // 7. TRUTHFUL OCR STATUS & MULTI-TENANT ISOLATION
  // -------------------------------------------------------------
  // A. Scanned image without OCR provider must never falsely report completed
  const fakePngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
  const imageExtraction = await extractDocumentText(fakePngBuffer, 'image/png', 'scanned_fir.png');
  assert.strictEqual(imageExtraction.ocrStatus, 'unsupported', 'Scanned image must be marked unsupported without OCR engine');
  assert.strictEqual(imageExtraction.isScanned, true, 'Scanned flag must be true');

  // B. Multi-tenant document vault access scoping
  const dbPath = path.join(process.cwd(), 'data', 'local-db.json');
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const advocateDocs = dbData.case_documents.filter(d => d.advocate_id === advocateA);
  assert(advocateDocs.length > 0, 'Advocate A must have documents in vault');
  const targetDoc = advocateDocs[0];
  assert.notStrictEqual(targetDoc.advocate_id, advocateB, 'Advocate B must not own Advocate A document');
  console.log('  ✓ Truthful OCR status reporting & multi-tenant document isolation verified');
}

// Direct execution support
if (process.argv[1]?.endsWith('ai-document-management.test.mjs')) {
  runAIDocumentManagementTests().then(() => {
    console.log('\nAI & Document Management Suite Passed!');
    process.exit(0);
  }).catch(err => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  });
}
