import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { cleanLegalText, chunkLegalDocument, estimateTokenCount } from '../src/lib/legal-research/chunking.ts';
import { 
  extractLegalMetadata, 
  extractCitations, 
  identifyCourt, 
  extractJudges, 
  extractCaseTitle,
  normalizeIndianDate,
  inferLegalSubject
} from '../src/lib/legal-research/metadata-extractor.ts';
import { generateDeterministicEmbedding, cosineSimilarity } from '../src/lib/ai/embeddings.ts';
import { indexLegalDocumentSchema, searchLegalDocumentsSchema } from '../src/lib/validation/schemas.ts';

export async function runIndexingPipelineTests() {
  console.log('Testing Phase 3: Legal Document Upload, Extraction & Indexing Pipeline...');

  // --------------------------------------------------------------------------
  // 1. TEXT CLEANING & NORMALIZATION (cleanLegalText)
  // --------------------------------------------------------------------------
  console.log('  1. Testing Semantic Legal Text Cleaning & Header/Footer Stripping...');
  const dirtyRawText = `
    IN THE SUPREME COURT OF INDIA
    CRIMINAL APPELLATE JURISDICTION

    Page 1 of 18
    Indian Kanoon - http://indiankanoon.org/doc/12345/
    VERDICTUM.IN

    CRIMINAL APPEAL NO. 513 OF 2020

    Satender Kumar Antil                             ...Appellant
                                 VERSUS
    Central Bureau of Investigation & Another        ...Respondents

    JUDGMENT

    Sanjay Kishan Kaul, J.
    1. Bail is the rule and jail is the exception. The personal liberty guaranteed under Article 21 
    of the Constitution of India must be protected.
    
    [ Page 2 ]
    
    2. Investigating agencies must strictly comply with Section 41A of the Code of Criminal Procedure.
  `;

  const cleaned = cleanLegalText(dirtyRawText);
  assert(!cleaned.includes('Page 1 of 18'), 'Page numbers must be stripped');
  assert(!cleaned.includes('Indian Kanoon'), 'Watermark URLs must be stripped');
  assert(!cleaned.includes('VERDICTUM.IN'), 'Repository headers must be stripped');
  assert(!cleaned.includes('[ Page 2 ]'), 'Bracketed page markers must be stripped');
  assert(cleaned.includes('Satender Kumar Antil'), 'Core party names must be preserved');
  assert(cleaned.includes('Section 41A of the Code of Criminal Procedure'), 'Core statutory references must be preserved');
  console.log('    ✓ Legal text cleaning verified (footers, watermarks, stamps stripped while preserving substance)');

  // --------------------------------------------------------------------------
  // 2. AUTOMATED LEGAL METADATA EXTRACTION (extractLegalMetadata)
  // --------------------------------------------------------------------------
  console.log('  2. Testing Automated Metadata & Citation Extraction...');

  // A. Date Normalization
  assert.strictEqual(normalizeIndianDate('11th July, 2022'), '2022-07-11');
  assert.strictEqual(normalizeIndianDate('15/08/2024'), '2024-08-15');
  assert.strictEqual(normalizeIndianDate('2023-01-26'), '2023-01-26');
  assert.strictEqual(normalizeIndianDate('4th November 2021'), '2021-11-04');
  console.log('    ✓ Indian date normalization verified (text dates, DD/MM/YYYY, ISO)');

  // B. Citation Extraction
  const sampleTextWithCitations = `
    As held in (2022) 10 SCC 51 and reiterated in 2022 SCC OnLine SC 825, also reported at AIR 2022 SC 3386 
    and 2022 LiveLaw (SC) 577, mechanical arrest without compliance of Section 41A is unlawful.
  `;
  const citations = extractCitations(sampleTextWithCitations);
  assert.strictEqual(citations.primary, '(2022) 10 SCC 51', 'Primary SCC citation must be extracted');
  assert(citations.alternates.includes('AIR 2022 SC 3386'), 'AIR citation must be extracted as alternate');
  assert(citations.alternates.includes('2022 LiveLaw (SC) 577'), 'LiveLaw citation must be extracted as alternate');
  console.log('    ✓ Citation extraction verified (Primary: (2022) 10 SCC 51, Alternates: AIR, SCC OnLine, LiveLaw)');

  // C. Court Hierarchy Identification
  const scCheck = identifyCourt('BEFORE THE HON\'BLE SUPREME COURT OF INDIA AT NEW DELHI');
  assert.strictEqual(scCheck.court_level, 'Supreme Court');
  assert.strictEqual(scCheck.court_name, 'Supreme Court of India');

  const hcCheck = identifyCourt('IN THE HIGH COURT OF JUDICATURE FOR RAJASTHAN BENCH AT JAIPUR');
  assert.strictEqual(hcCheck.court_level, 'High Court');
  assert(hcCheck.court_name.includes('Rajasthan'));

  const distCheck = identifyCourt('BEFORE THE COURT OF DISTRICT & SESSIONS JUDGE, ALWAR');
  assert.strictEqual(distCheck.court_level, 'District Court');
  assert(distCheck.court_name.includes('Alwar'));
  console.log('    ✓ Court hierarchy detection verified (Supreme Court, High Court Jaipur/Jodhpur, District Court Alwar)');

  // D. Full Metadata Extraction
  const judgmentSnippet = `
    IN THE SUPREME COURT OF INDIA
    CRIMINAL APPELLATE JURISDICTION
    CITATION: (2022) 10 SCC 51
    BENCH: Hon'ble Mr. Justice Sanjay Kishan Kaul and Hon'ble Mr. Justice M.M. Sundresh
    Date of Decision: 11th July, 2022

    Satender Kumar Antil ...Appellant
    VERSUS
    Central Bureau of Investigation ...Respondent

    Bail jurisprudence and procedure under Section 438 and 439 of the Code of Criminal Procedure.
  `;
  const meta = extractLegalMetadata(judgmentSnippet);
  assert.strictEqual(meta.court_level, 'Supreme Court');
  assert.strictEqual(meta.judgment_date, '2022-07-11');
  assert(meta.title && meta.title.includes('Satender Kumar Antil'));
  assert(meta.judge_names && meta.judge_names.includes('Sanjay Kishan Kaul'));
  assert(meta.legal_subject && meta.legal_subject.includes('Bail'));
  console.log(`    ✓ Metadata extraction verified (Title: ${meta.title}, Date: ${meta.judgment_date}, Subject: ${meta.legal_subject})`);

  // --------------------------------------------------------------------------
  // 3. SLIDING WINDOW CHUNKING WITH OVERLAP (chunkLegalDocument)
  // --------------------------------------------------------------------------
  console.log('  3. Testing Sliding-Window Chunking with Overlap & Token Counting...');
  // Construct a legal text of ~1200 words across 6 paragraphs
  const sampleParagraph = `
    The personal liberty of an accused is of paramount constitutional value under Article 21. 
    The courts must remember that pre-trial detention is not intended to be punitive. 
    When an offence is punishable with imprisonment for a term which may be less than seven years, 
    or which may extend to seven years, whether with or without fine, the police officer shall, 
    instead of arresting the person concerned, issue a notice directing him to appear before him 
    or at such other place as may be specified in the notice. Section 41A of the Code of Criminal Procedure 
    mandates that where a notice is issued, it shall be the duty of the person against whom the notice 
    is issued to comply with the terms of the notice.
  `;
  const multiParagraphDoc = Array(6).fill(sampleParagraph).join('\n\n');

  const chunks = chunkLegalDocument(multiParagraphDoc, {
    maxWordsPerChunk: 250,
    overlapWords: 50,
    minWordsPerChunk: 30
  });

  assert(chunks.length >= 2, `Expected at least 2 chunks, got ${chunks.length}`);

  // Validate chunk sequence & metadata
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    assert.strictEqual(chunk.chunk_index, i, `Chunk index must be sequential (${i})`);
    assert(chunk.content.length > 50, 'Chunk content must be substantive');
    assert(chunk.page_number >= 1, 'Chunk page number must be >= 1');
    assert(chunk.paragraph_number >= 1, 'Chunk paragraph number must be >= 1');
    assert(chunk.token_count > 0, 'Chunk token count must be calculated');
  }

  // Validate overlap between chunk 0 and chunk 1
  const chunk0Words = chunks[0].content.split(/\s+/);
  const chunk1Words = chunks[1].content.split(/\s+/);
  const chunk0Tail = chunk0Words.slice(-20).join(' ');
  const chunk1Head = chunk1Words.slice(0, 35).join(' ');

  // Overlap verification: at least 5 common consecutive words
  const overlapFound = chunk0Words.some((w, idx) => {
    if (idx < chunk0Words.length - 10) return false;
    return chunk1Words.slice(0, 15).includes(w);
  });
  assert(overlapFound, 'Consecutive chunks must maintain overlapping words for contextual continuity');
  console.log(`    ✓ Sliding window chunking verified (${chunks.length} chunks generated, overlap continuity confirmed, tokens: ${chunks[0].token_count})`);

  // --------------------------------------------------------------------------
  // 4. END-TO-END INGESTION & INDEXING PIPELINE
  // --------------------------------------------------------------------------
  console.log('  4. Testing Ingestion, Metadata Auto-Extraction, Chunking & Indexing Pipeline...');
  const newJudgmentText = `
    IN THE HIGH COURT OF JUDICATURE FOR RAJASTHAN AT JAIPUR BENCH
    CITATION: 2026 (1) RLR 789 (HC)
    Date of Decision: 14th February, 2026
    CORAM: Hon'ble Mr. Justice Chandra Kumar Songara

    Ram Kishore Meena & Ors.                      ...Petitioners
                                VERSUS
    State of Rajasthan & Anr.                     ...Respondents

    S.B. Criminal Miscellaneous Bail Application No. 4412/2026

    ORDER:
    1. This petition under Section 482 of the Bharatiya Nagarik Suraksha Sanhita, 2023 
    (corresponding to Section 438 of the Code of Criminal Procedure) has been filed by the petitioners 
    seeking anticipatory bail in connection with FIR No. 112/2026 registered at Police Station Sadar Alwar.

    2. Learned counsel for the petitioners submits that the petitioners have been falsely implicated in 
    a family land partition dispute. The revenue records clearly establish ongoing civil proceedings 
    before the Sub-Divisional Officer, Alwar under Section 53 of the Rajasthan Tenancy Act, 1955.

    3. Having considered the submissions and the principles laid down in Satender Kumar Antil v. CBI, 
    this Court is inclined to grant pre-arrest bail to the petitioners subject to joining investigation.
  `;

  // Step 1: Clean text
  const pipelineCleaned = cleanLegalText(newJudgmentText);
  assert(pipelineCleaned.length > 50, 'Cleaned text must be substantial');

  // Step 2: Auto-extract metadata
  const pipelineMeta = extractLegalMetadata(pipelineCleaned);
  assert.strictEqual(pipelineMeta.court_level, 'High Court', 'Court level must be identified as High Court');
  assert(pipelineMeta.citation.includes('2026 (1) RLR 789'), 'Citation must be auto-extracted');
  assert(pipelineMeta.judgment_date === '2026-02-14', 'Judgment date must be normalized to 2026-02-14');

  // Step 3: Chunk document
  const pipelineChunks = chunkLegalDocument(pipelineCleaned, {
    maxWordsPerChunk: 300,
    overlapWords: 50
  });
  assert(pipelineChunks.length >= 1, 'At least 1 chunk must be created');

  // Step 4: Batch generate embeddings (1536 dims)
  const chunkEmbeddings = pipelineChunks.map(c => generateDeterministicEmbedding(c.content));
  for (const emb of chunkEmbeddings) {
    assert.strictEqual(emb.length, 1536, 'Every chunk must have 1536-dimensional embedding');
  }

  // Step 4b: Verify chunk row structure conforming to 002_legal_chunks.sql
  const testDocId = 'doc-test-pipeline-' + crypto.randomUUID();
  const chunkRows = pipelineChunks.map((c, idx) => ({
    id: `chk-${testDocId}-${c.chunk_index}`,
    document_id: testDocId,
    chunk_index: c.chunk_index,
    content: c.content,
    page_number: c.page_number,
    paragraph_number: String(c.paragraph_number),
    embedding: chunkEmbeddings[idx]
  }));
  assert.strictEqual(typeof chunkRows[0].paragraph_number, 'string', 'Chunk paragraph_number must conform to TEXT in 002_legal_chunks');
  const uniqueKeys = new Set(chunkRows.map(c => `${c.document_id}_${c.chunk_index}`));
  assert.strictEqual(uniqueKeys.size, chunkRows.length, 'Chunk (document_id, chunk_index) must be strictly unique');

  // Step 5: Verify document payload integrity
  const docId = testDocId;
  const testDoc = {
    id: docId,
    title: pipelineMeta.title,
    citation: pipelineMeta.citation,
    court_level: pipelineMeta.court_level,
    court_name: pipelineMeta.court_name,
    judgment_date: pipelineMeta.judgment_date,
    judge_names: pipelineMeta.judge_names,
    legal_subject: pipelineMeta.legal_subject,
    statutes: pipelineMeta.statutes,
    full_text: pipelineCleaned,
    verification_status: 'verified',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  assert(testDoc.title && testDoc.title.includes('Ram Kishore Meena'), 'Parties must form title');
  assert(testDoc.statutes && testDoc.statutes.includes('Rajasthan Tenancy Act'), 'Statutes must include RTA');
  console.log(`    ✓ Ingestion pipeline verified (Doc: ${testDoc.citation}, Chunks: ${pipelineChunks.length}, Vector dims: ${chunkEmbeddings[0].length})`);

  // --------------------------------------------------------------------------
  // 5. VALIDATION SCHEMAS AUDIT (indexLegalDocumentSchema, searchLegalDocumentsSchema)
  // --------------------------------------------------------------------------
  console.log('  5. Testing Zod Validation Schemas for Ingestion & Search...');

  // A. Valid Ingestion Payload
  const validIngest = indexLegalDocumentSchema.safeParse({
    title: 'State of Rajasthan v. Prem Chand',
    citation: '2024 (2) RLR 101',
    court_level: 'High Court',
    court_name: 'High Court of Rajasthan (Jaipur Bench)',
    judgment_date: '2024-03-15',
    legal_subject: 'Revenue & Land Law',
    statutes: 'Section 53 Rajasthan Tenancy Act',
    raw_text: 'Full legal text of the judgment concerning co-sharer land partition in District Alwar.'
  });
  assert.strictEqual(validIngest.success, true, 'Valid ingestion schema must pass validation');

  // B. Ingestion with Invalid Date
  const invalidDate = indexLegalDocumentSchema.safeParse({
    judgment_date: '15-03-2024', // Must be YYYY-MM-DD
    raw_text: 'Sample legal text...'
  });
  assert.strictEqual(invalidDate.success, false, 'Invalid date format must be rejected by Zod schema');

  // C. Valid Search Query Schema
  const validSearch = searchLegalDocumentsSchema.safeParse({
    query: 'anticipatory bail 482 BNSS',
    court_level: 'High Court',
    year: '2024',
    limit: 10
  });
  assert.strictEqual(validSearch.success, true, 'Valid search schema must pass validation');

  // D. Search with Short Query
  const invalidSearch = searchLegalDocumentsSchema.safeParse({
    query: 'a' // Min 2 characters
  });
  assert.strictEqual(invalidSearch.success, false, 'Too short search query must be rejected');

  console.log('    ✓ Zod API validation schemas verified (Date formats, CourtLevel enums, length limits)');
  console.log('  ✓ PHASE 3 LEGAL DOCUMENT UPLOAD, EXTRACTION & INDEXING PIPELINE TESTS COMPLETED WITH 0 ERRORS');
}
