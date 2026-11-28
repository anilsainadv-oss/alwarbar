import { ingestAndIndexLegalDocument } from './indexing-pipeline';
import { legalResearchRepository } from '../db/repositories/legal-research';
import { localDb } from '../db';
import type { CourtLevel, VerificationStatus, PublicationStatus, ApprovalStatus } from '@/types/legal-research';

export interface CourtFeedCandidate {
  title: string;
  citation: string;
  case_number: string;
  court_level: 'High Court' | 'Supreme Court';
  court_name: string;
  court_code?: string;
  bench: 'Jaipur' | 'Jodhpur' | null;
  judgment_date: string;
  judge_names: string[];
  parties: string[];
  legal_subjects: string[];
  statutes: string[];
  full_text: string;
  source_name: string;
  source_url: string;
  summary?: string;
  reportable_status?: boolean;
}

export interface IngestionSyncResult {
  success: boolean;
  jobId: string;
  sourceName: string;
  totalCandidates: number;
  newlyIngestedCount: number;
  skippedCount: number;
  totalPendingReviewCount: number;
  documents: Array<{
    id: string;
    title: string;
    citation: string;
    court: string;
    status: VerificationStatus;
  }>;
  processingTimeMs: number;
  message: string;
  captchaStatus: {
    solved: boolean;
    confidence: number;
    method: 'ai_vision_ocr' | 'algorithmic_contrast';
  };
}

/**
 * Intelligent Captcha Solver & Optical Pattern Engine
 * Automatically solves 5-6 digit alphanumeric court verification captchas used by High Court portals
 */
export async function solveCourtCaptcha(
  _captchaInput?: string | Buffer
): Promise<{ text: string; confidence: number; method: 'ai_vision_ocr' | 'algorithmic_contrast' }> {
  // DISABLED: the previous implementation did not solve any CAPTCHA (it returned a hash or
  // random text), and automated CAPTCHA bypass is not supported. Use manual PDF import.
  throw new Error('Automated CAPTCHA solving is not supported. Use manual PDF import for High Court judgments.');
}

/**
 * Generates an authentic %PDF-1.4 binary buffer for an official judgment candidate.
 * Includes court header, seal metadata, parties, coram, and ratio decidendi.
 */
export function generateOfficialCourtPdfBuffer(_candidate: CourtFeedCandidate): Buffer {
  // DISABLED: never fabricate "official" court PDFs. Only real PDFs downloaded from the
  // court (or manually imported by an admin) may be stored.
  throw new Error('Generating court PDFs locally is disabled. Only genuine court PDFs may be stored.');
}

/**
 * Authentic Live Daily Feed Candidates from Supreme Court of India (INSC)
 */
/** @deprecated Hardcoded sample feed removed. Live data comes from court-sync/live-sci-source.ts */
export const DAILY_SUPREME_COURT_FEED: CourtFeedCandidate[] = [];

/** @deprecated Hardcoded sample feed removed. */
export const DAILY_RAJASTHAN_HIGH_COURT_FEED: CourtFeedCandidate[] = [];

/**
 * Kept for compatibility. Live Supreme Court discovery is in court-sync/live-sci-source.ts
 */
export async function fetchSupremeCourtESCRJudgments(
  _options: { limit?: number } = {}
): Promise<CourtFeedCandidate[]> {
  return [];
}

/**
 * Kept for compatibility. No automatic High Court source (CAPTCHA-protected); use manual import.
 */
export async function fetchRajasthanHighCourtJudgments(
  _options: { bench?: 'Jaipur' | 'Jodhpur' | 'All'; limit?: number } = {}
): Promise<{ candidates: CourtFeedCandidate[]; captchaInfo: { solved: boolean; confidence: number; method: string } }> {
  return { candidates: [], captchaInfo: { solved: false, confidence: 0, method: 'none' } };
}

/**
 * Court Ingestion Orchestrator (compat wrapper).
 * Delegates to CourtSyncService (live sci.gov.in fetch). ALWAYS pending/draft:
 * autoPublish is ignored so nothing is ever published without admin approval.
 */
export async function runAutomatedCourtIngestion(options: {
  court?: 'all' | 'high_court' | 'supreme_court';
  autoVerify?: boolean;
  autoPublish?: boolean;
  triggeredBy?: string;
} = {}): Promise<IngestionSyncResult> {
  const { CourtSyncService } = await import('../court-sync/court-sync-service');
  const r: any = await CourtSyncService.executeSync({
    court: options.court === 'high_court' ? 'rajasthan_high_court' : (options.court || 'all'),
    triggeredBy: options.triggeredBy
  });
  const all = await legalResearchRepository.getDocuments({});
  return {
    success: r.success,
    jobId: r.jobId,
    sourceName: 'Supreme Court of India (sci.gov.in)',
    totalCandidates: r.summary.newlyIngestedCount + r.summary.skippedDuplicatesCount + r.summary.failedDownloadsCount,
    newlyIngestedCount: r.summary.newlyIngestedCount,
    skippedCount: r.summary.skippedDuplicatesCount,
    totalPendingReviewCount: all.filter(d => d.verification_status === 'pending').length,
    documents: (r.documents || []).map((d: any) => ({ ...d, status: 'pending' as VerificationStatus })),
    processingTimeMs: r.summary.durationMs,
    message: `Court sync finished: ${r.summary.newlyIngestedCount} new (pending approval), ${r.summary.skippedDuplicatesCount} duplicates, ${r.summary.failedDownloadsCount} failed.`,
    captchaStatus: { solved: false, confidence: 0, method: 'algorithmic_contrast' }
  };
}
