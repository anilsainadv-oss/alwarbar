/**
 * TypeScript Data Models for AI Legal Research & Intelligent Case Law Search Engine
 * Alwar Advocates Portal & My Case AI Legal Office
 */

export type CourtLevel = 'Supreme Court' | 'High Court' | 'District Court' | 'Tribunal';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'archived';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'draft';
export type OCRStatus = 'pending' | 'completed' | 'failed' | 'not_required';
export type PublicationStatus = 'draft' | 'published' | 'archived';
export type HighCourtBench = 'Jodhpur' | 'Jaipur';
export type SourceType = 'manual' | 'automatic' | 'api';

export interface LegalDocument {
  id: string;
  title: string;
  case_number?: string;
  citation: string;
  alternate_citations?: string[];
  court_name: string;
  court_level?: CourtLevel;
  court_code?: string; // 'INSC' | 'HCRAJ-JP' | 'HCRAJ-JD'
  bench?: HighCourtBench | string | null;
  court_bench?: string | null;
  state?: string;
  diary_number?: string;
  petitioner?: string;
  respondent?: string;
  advocate_names?: string | string[];
  judge_names?: string | string[];
  judgment_date?: string; // ISO date 'YYYY-MM-DD'
  decision_type?: string;
  judgment_type?: string;
  case_type?: string;
  reportable_status?: boolean;
  legal_subjects?: string[];
  legal_subject?: string;
  statutes?: string | string[];
  parties?: string | string[];
  summary?: string;
  source_type?: SourceType;
  source_name?: string;
  source_url?: string;
  original_source_url?: string;
  document_url?: string;
  r2_storage_key?: string;
  pdf_sha256?: string;
  language?: string;
  full_text: string;
  content_hash?: string;
  ocr_status?: OCRStatus;
  verification_status: VerificationStatus;
  approval_status?: ApprovalStatus;
  publication_status?: PublicationStatus;
  uploaded_by?: string;
  verified_by?: string;
  verified_at?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}
export type JudgmentAuditAction = 
  | 'discovered'
  | 'downloaded'
  | 'extracted'
  | 'submitted_for_approval'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'saved_draft'
  | 'metadata_updated'
  | 'reprocessed'
  | 'deleted'
  | 'INGEST_LEGAL_DOCUMENT'
  | 'DELETE_LEGAL_DOCUMENT'
  | 'UPDATE_LEGAL_DOCUMENT_METADATA'
  | 'VERIFY_ALL_LEGAL_DOCUMENTS'
  | (string & {});

export interface JudgmentAuditLog {
  id: string;
  document_id: string;
  actor_id?: string;
  actor_name?: string;
  actor_role?: string;
  action: JudgmentAuditAction;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, any> | null;
  performed_by?: string;
  notes?: string | null;
  metadata_snapshot?: Record<string, any> | null;
  created_at: string;
}

export interface LegalDocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  page_number?: number;
  paragraph_number?: string | number;
  embedding?: number[]; // 1536-dimensional vector
  search_tsv?: string;
  created_at: string;
}

export interface LegalResearchHistory {
  id: string;
  user_id: string;
  query: string;
  ai_response: RAGLegalResponse | string;
  retrieved_document_ids?: string[];
  model_name?: string;
  created_at: string;
}

export interface SavedResearch {
  id: string;
  user_id: string;
  document_id: string;
  case_id?: string | null;
  notes?: string;
  created_at: string;
  // Hydrated joins
  document?: LegalDocument;
}

export type AccessPermissionStatus = 'unverified' | 'permitted' | 'restricted';
export type ProcessingStageStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'not_needed';

export interface LegalDocumentSource {
  id: string;
  document_id?: string;
  source_url?: string;
  storage_path?: string;
  original_filename?: string;
  mime_type?: string;
  file_size?: number;
  checksum?: string;
  source_name?: string;
  access_permission_status?: AccessPermissionStatus;
  publication_details?: string;
  verification_details?: string;
  created_at: string;
}

export interface LegalDocumentProcessing {
  id: string;
  document_id: string;
  extraction_status?: ProcessingStageStatus | string;
  ocr_status?: ProcessingStageStatus | string;
  metadata_status?: ProcessingStageStatus | string;
  embedding_status?: ProcessingStageStatus | string;
  total_pages?: number;
  processed_pages?: number;
  total_chunks?: number;
  error_message?: string | null;
  retry_count?: number;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export type CollectionMethod = 'manual' | 'automatic' | 'api';
export type IngestionJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface LegalIngestionJob {
  id: string;
  collection_method: CollectionMethod;
  source_name?: string | null;
  source_url?: string | null;
  status: IngestionJobStatus;
  total_documents: number;
  successful_documents: number;
  failed_documents: number;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  created_by?: string | null;
  created_at: string;
}

export type CitationRelationType = 'followed' | 'distinguished' | 'referred' | 'overruled' | 'affirmed' | string;

export interface LegalDocumentCitation {
  id: string;
  document_id: string;
  cited_document_id?: string | null;
  cited_case_name?: string | null;
  citation_text?: string | null;
  relation_type?: CitationRelationType | null;
  verification_status?: VerificationStatus | string;
  created_at: string;
}

export interface SearchFilters {
  court_level?: CourtLevel | 'ALL';
  court_name?: string;
  year?: string;
  judge_name?: string;
  case_type?: string;
  legal_subject?: string;
  statute?: string;
  language?: 'en' | 'hi' | 'ALL';
}

export interface LegalSearchResult {
  document_id: string;
  chunk_id?: string;
  title: string;
  citation: string;
  court_name: string;
  court_level: CourtLevel;
  bench?: string | null;
  judgment_date?: string;
  judge_names?: string;
  legal_subject?: string;
  legal_subjects?: string[];
  statutes?: string;
  snippet: string;
  page_number?: number;
  paragraph_number?: string | number;
  semantic_score?: number;
  keyword_score?: number;
  hybrid_score: number;
  document_url?: string;
  verification_status?: VerificationStatus;
  publication_status?: PublicationStatus;
}

export interface StatutoryReference {
  act: string;
  section: string;
  relevance: string;
}

export interface CaseCitationReference {
  id?: string;
  title: string;
  citation: string;
  court: string;
  bench?: string;
  decision_date?: string;
  ratio_decidendi: string;
  supporting_paragraph?: string;
  page_number?: number;
  is_contrary_or_distinguishable?: boolean;
  document_url?: string;
}

export interface RAGLegalResponse {
  query: string;
  direct_legal_answer: string;
  legal_principles: string[];
  applicable_statutes: StatutoryReference[];
  relevant_judgments: CaseCitationReference[];
  supporting_paragraphs: {
    citation: string;
    text: string;
    para_no?: string | number;
  }[];
  contrary_or_distinguishable_views?: string[];
  practical_considerations: string[];
  warning_disclaimer: string;
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  estimated_cost_inr?: number;
  is_offline_demo: boolean;
  provider: string;
  created_at: string;
}

export interface IngestionMetadataInput {
  title: string;
  case_number?: string;
  citation: string;
  court_name: string;
  court_level: CourtLevel;
  state?: string;
  judge_names?: string;
  judgment_date?: string;
  case_type?: string;
  legal_subject?: string;
  statutes?: string;
  source_name?: string;
  source_url?: string;
  language?: 'en' | 'hi';
}

export type CourtDiscoveryQueueStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'duplicate_skipped'
  | 'failed'
  | 'failed_needs_review'
  | 'quarantined';

export interface CourtDiscoveryQueueItem {
  id: string;
  court_code: string;
  diary_number: string;
  judgment_date: string;
  case_number?: string | null;
  citation?: string | null;
  official_pdf_url: string;
  official_viewer_url?: string | null;
  raw_metadata: Record<string, any>;
  status: CourtDiscoveryQueueStatus;
  retry_count: number;
  max_retries: number;
  last_error?: string | null;
  locked_by?: string | null;
  lock_generation?: number | null;
  locked_at?: string | null;
  document_id?: string | null;
  job_id?: string | null;
  created_at: string;
  updated_at: string;
}
export interface CourtSyncCheckpoint {
  court_code: string;
  court_name: string;
  last_sync_attempt_at?: string | null;
  last_successful_sync_at?: string | null;
  last_scanned_judgment_date?: string | null;
  last_scanned_diary_number?: string | null;
  is_locked: boolean;
  locked_at?: string | null;
  locked_by?: string | null;
  lock_generation: number;
  lease_duration_seconds: number;
  consecutive_failures: number;
  last_error_message?: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}
