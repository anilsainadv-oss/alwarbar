export type CaseStatus = 'active' | 'stayed' | 'reserved_for_order' | 'disposed' | 'archived';

export interface Client {
  id: string;
  advocate_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  confidential_notes?: string;
  created_at: string;
}

export interface CaseRecord {
  id: string;
  advocate_id: string;
  client_id?: string;
  case_title: string;
  case_number?: string;
  cnr_number?: string;
  court_name: string;
  case_type: string;
  petitioner_parties: string;
  respondent_parties: string;
  filing_date?: string;
  next_hearing_date?: string;
  stage_of_case?: string;
  status: CaseStatus;
  private_notes?: string;
  client?: Client;
  created_at: string;
  updated_at: string;
}

export interface CaseDocument {
  id: string;
  case_id: string;
  advocate_id: string;
  title: string;
  category: 'pleading' | 'evidence' | 'order' | 'bail' | 'vakalatnama' | 'other';
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  extracted_text?: string;
  page_count: number;
  ocr_status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface CaseHearing {
  id: string;
  case_id: string;
  advocate_id: string;
  hearing_date: string;
  court_room?: string;
  judge_name?: string;
  business_recorded?: string;
  previous_order_summary?: string;
  next_action?: string;
  next_hearing_date?: string;
  attended: boolean;
  case_title?: string;
  created_at: string;
}

export interface CaseTask {
  id: string;
  advocate_id: string;
  case_id?: string;
  title: string;
  due_date?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  case_title?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  advocate_id: string;
  client_id: string;
  case_id?: string;
  invoice_number: string;
  total_amount: number;
  paid_amount: number;
  status: 'paid' | 'partially_paid' | 'unpaid';
  issue_date: string;
  due_date?: string;
  notes?: string;
  client_name?: string;
  case_title?: string;
  created_at: string;
}

export interface LegalDraft {
  id: string;
  advocate_id: string;
  case_id?: string;
  draft_type: string;
  title: string;
  content_text: string;
  language: 'hi' | 'en';
  version: number;
  created_at: string;
  updated_at: string;
}

export interface PersonalLibraryItem {
  id: string;
  advocate_id: string;
  title: string;
  category: string;
  citation?: string;
  notes?: string;
  source_url?: string;
  created_at: string;
}
