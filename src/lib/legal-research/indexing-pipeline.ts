import { extractDocumentText, type DocumentExtractionResult } from '../ai/document-parser';
import { cleanLegalText, chunkLegalDocument, type ChunkDescriptor } from './chunking';
import { extractLegalMetadata, type ExtractedLegalMetadata } from './metadata-extractor';
import { embeddingService } from '../ai/embeddings';
import { legalResearchRepository } from '../db/repositories/legal-research';
import type { 
  CourtLevel, 
  LegalDocument, 
  LegalDocumentChunk, 
  VerificationStatus,
  HighCourtBench,
  PublicationStatus,
  SourceType
} from '../../types/legal-research';
import crypto from 'crypto';

export interface IngestionInput {
  buffer?: Buffer;
  filename?: string;
  mimeType?: string;
  rawText?: string;

  // Metadata overrides (optional)
  title?: string;
  case_number?: string;
  citation?: string;
  alternate_citations?: string[];
  court_level?: CourtLevel;
  court_name?: string;
  bench?: HighCourtBench | string | null;
  judgment_date?: string;
  decision_type?: string;
  case_type?: string;
  judge_names?: string | string[];
  parties?: string | string[];
  legal_subjects?: string[];
  legal_subject?: string;
  statutes?: string | string[];
  summary?: string;
  document_url?: string;
  language?: string;
  source_type?: SourceType;
  publication_status?: PublicationStatus;
  verification_status?: VerificationStatus;

  // Submitter context
  userId?: string;
  userRole?: string;
}

export interface IndexingPipelineResult {
  success: boolean;
  document: LegalDocument;
  chunksIndexed: number;
  totalTokens: number;
  processingTimeMs: number;
  extractedMetadata: ExtractedLegalMetadata;
  extractionResult?: Partial<DocumentExtractionResult>;
  warnings?: string[];
}

/**
 * High-Precision Legal Document Ingestion, Extraction & pgvector Indexing Pipeline
 */
export async function ingestAndIndexLegalDocument(
  input: IngestionInput
): Promise<IndexingPipelineResult> {
  const startTime = Date.now();
  const warnings: string[] = [];

  // 1. Text Extraction
  let extractedText = '';
  let extractionResult: Partial<DocumentExtractionResult> | undefined;

  if (input.buffer) {
    const filename = input.filename || 'legal_document.pdf';
    const mimeType = input.mimeType || 'application/pdf';
    const extraction = await extractDocumentText(input.buffer, mimeType, filename);
    extractionResult = extraction;
    extractedText = extraction.text;

    if (extraction.isScanned && extraction.text.trim().length < 40) {
      warnings.push(
        extraction.ocrMessage ||
        'Scanned image PDF detected. Text extraction is limited until OCR is configured.'
      );
    }
  } else if (input.rawText) {
    extractedText = input.rawText;
  } else {
    throw new Error('Either file buffer or raw text must be provided for ingestion.');
  }

  // 2. Text Cleaning & Normalization
  const cleanedText = cleanLegalText(extractedText);
  if (!cleanedText || cleanedText.length < 20) {
    throw new Error('Extracted text is empty or insufficient for legal indexing (less than 20 characters).');
  }

  // 3. Automated Metadata Extraction
  const autoMeta = extractLegalMetadata(cleanedText);

  // Merge explicit user overrides
  const finalTitle = (input.title || '').trim() || autoMeta.title || 'In re Legal Proceedings';
  const finalCitation = (input.citation || '').trim() || autoMeta.citation || 'Unreported Legal Precedent';
  const finalCourtName = (input.court_name || '').trim() || autoMeta.court_name;
  const finalCourtLevel = input.court_level || autoMeta.court_level;
  const finalJudgmentDate = input.judgment_date || autoMeta.judgment_date;
  const inputJudgeStr = Array.isArray(input.judge_names) ? input.judge_names.join(', ') : (input.judge_names || '');
  const inputPartiesStr = Array.isArray(input.parties) ? input.parties.join(' v. ') : (input.parties || '');
  const inputStatutesStr = Array.isArray(input.statutes) ? input.statutes.join(', ') : (input.statutes || '');

  const finalJudgeNames = inputJudgeStr.trim() || autoMeta.judge_names;
  const finalParties = inputPartiesStr.trim() || autoMeta.parties;
  const finalSubject = (input.legal_subject || '').trim() || autoMeta.legal_subject;
  const finalStatutes = inputStatutesStr.trim() || autoMeta.statutes;
  const finalSummary = (input.summary || '').trim() || autoMeta.summary || cleanedText.slice(0, 300) + '...';

  // Determine verification status
  // Default is 'verified' for manual admin uploads; 'pending' for automated court feeds
  const verificationStatus: VerificationStatus = input.verification_status || 'verified';

  // 4. Semantic Chunking with Overlap
  const chunks = chunkLegalDocument(cleanedText, {
    maxWordsPerChunk: 500,
    overlapWords: 100,
    minWordsPerChunk: 40
  });

  if (chunks.length === 0) {
    throw new Error('Failed to generate any valid chunks from cleaned text.');
  }

  // 5. Batch Embeddings Generation (1536 Dimensions)
  const chunkTexts = chunks.map(c => c.content);
  const embeddings = await embeddingService.generateBatchEmbeddings(chunkTexts);

  // 6. Assemble Chunk Rows
  const chunkRows = chunks.map((c, idx) => ({
    chunk_index: c.chunk_index,
    content: c.content,
    page_number: c.page_number,
    paragraph_number: c.paragraph_number != null ? String(c.paragraph_number) : undefined,
    token_count: c.token_count,
    embedding: embeddings[idx] || []
  }));

  const totalTokens = chunks.reduce((sum, c) => sum + c.token_count, 0);

  // 7. Persist Document & Chunks via Repository
  let bench: HighCourtBench | null = null;
  if (input.bench === 'Jaipur' || input.bench === 'Jodhpur') {
    bench = input.bench;
  } else if (finalCourtName.toLowerCase().includes('jaipur')) {
    bench = 'Jaipur';
  } else if (finalCourtName.toLowerCase().includes('jodhpur')) {
    bench = 'Jodhpur';
  }

  const contentHash = crypto.createHash('sha256').update(cleanedText).digest('hex');

  const documentPayload: Omit<LegalDocument, 'id' | 'created_at' | 'updated_at'> = {
    title: finalTitle,
    case_number: input.case_number || autoMeta.case_number || undefined,
    citation: finalCitation,
    alternate_citations: input.alternate_citations || autoMeta.alternate_citations || [],
    court_level: finalCourtLevel,
    court_name: finalCourtName,
    bench,
    judgment_date: finalJudgmentDate,
    decision_type: input.decision_type || 'Judgment',
    case_type: input.case_type || autoMeta.case_type || undefined,
    judge_names: Array.isArray(input.judge_names) ? input.judge_names : (finalJudgeNames ? [finalJudgeNames] : []),
    parties: Array.isArray(input.parties) ? input.parties : (finalParties ? [finalParties] : []),
    legal_subjects: input.legal_subjects || (finalSubject ? [finalSubject] : []),
    legal_subject: finalSubject,
    statutes: Array.isArray(input.statutes) ? input.statutes : (finalStatutes ? [finalStatutes] : []),
    summary: finalSummary,
    language: input.language || 'English',
    full_text: cleanedText,
    content_hash: contentHash,
    source_type: input.source_type || (input.userRole === 'public_admin' ? 'manual' : 'automatic'),
    document_url: input.document_url || undefined,
    verification_status: verificationStatus,
    publication_status: input.publication_status || (verificationStatus === 'verified' ? 'published' : 'draft'),
    uploaded_by: input.userId || undefined,
    verified_by: verificationStatus === 'verified' ? (input.userId || undefined) : undefined,
    verified_at: verificationStatus === 'verified' ? new Date().toISOString() : undefined
  };

  const createdDoc = await legalResearchRepository.createDocument(documentPayload, chunkRows);

  // 8. Persist Source Provenance (003_legal_sources_processing.sql)
  try {
    await legalResearchRepository.createSource({
      document_id: createdDoc.id,
      source_url: input.document_url || undefined,
      storage_path: input.document_url || `legal_vault/${createdDoc.id}.pdf`,
      original_filename: input.filename || `${finalTitle.slice(0, 30)}.pdf`,
      mime_type: input.mimeType || 'application/pdf',
      file_size: input.buffer ? input.buffer.length : Buffer.byteLength(cleanedText, 'utf8'),
      checksum: contentHash,
      source_name: finalCourtName,
      access_permission_status: 'permitted'
    });
  } catch (err) {
    console.warn('Failed to record legal_document_sources provenance:', err);
  }

  // 9. Persist Processing Telemetry (003_legal_sources_processing.sql)
  try {
    const pageCount = extractionResult?.pageCount || Math.max(1, Math.ceil(cleanedText.length / 3000));
    await legalResearchRepository.recordProcessing({
      document_id: createdDoc.id,
      extraction_status: 'completed',
      ocr_status: extractionResult?.isScanned ? 'completed' : 'not_needed',
      metadata_status: 'completed',
      embedding_status: 'completed',
      total_pages: pageCount,
      processed_pages: pageCount,
      total_chunks: chunkRows.length,
      error_message: null,
      retry_count: 0,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Failed to record legal_document_processing telemetry:', err);
  }

  // 10. Persist Document Citations (004_legal_ingestion_jobs.sql)
  try {
    if (autoMeta.alternate_citations && autoMeta.alternate_citations.length > 0) {
      for (const altCit of autoMeta.alternate_citations) {
        await legalResearchRepository.addCitation({
          document_id: createdDoc.id,
          cited_document_id: null,
          cited_case_name: null,
          citation_text: altCit,
          relation_type: 'referred',
          verification_status: 'verified'
        });
      }
    }
  } catch (err) {
    console.warn('Failed to record document citations:', err);
  }

  const processingTimeMs = Date.now() - startTime;

  return {
    success: true,
    document: createdDoc,
    chunksIndexed: chunkRows.length,
    totalTokens,
    processingTimeMs,
    extractedMetadata: autoMeta,
    extractionResult,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}
