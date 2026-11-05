export type UserRole = 
  | 'public_visitor'
  | 'registered_advocate'
  | 'forum_moderator'
  | 'public_admin'
  | 'case_admin';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdvocateProfile {
  id: string;
  user_id: string;
  bar_council_enrollment_no: string;
  bar_association_name: string;
  chamber_address?: string;
  court_practice_complex: string;
  practice_areas: string[];
  experience_years: number;
  bio_hindi?: string;
  bio_english?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  is_publicly_listed: boolean;
  user?: User;
}

export interface WelfareScheme {
  id: string;
  title_en: string;
  title_hi: string;
  issuing_authority: string;
  official_source_url?: string;
  eligibility_criteria: string;
  benefits_summary: string;
  application_process: string;
  document_checklist: string[];
  deadline?: string;
  last_verified_date: string;
  is_published: boolean;
  created_by?: string;
  created_at: string;
  category?: 'retirement' | 'medical' | 'stipend' | 'disability' | 'emergency' | 'maternity' | 'local_benevolent';
  max_benefit_amount?: string;
  form_download_url?: string;
  status_badge?: string;
}

export interface WelfareBulletin {
  id: string;
  title_en: string;
  title_hi: string;
  date: string;
  authority: string;
  summary_en: string;
  summary_hi: string;
  category: 'circular' | 'deadline' | 'disbursement' | 'stamp_rate';
  important: boolean;
  official_link?: string;
}

export type LegalCategory = 
  | 'central_law'
  | 'rajasthan_act'
  | 'sc_judgment'
  | 'hc_judgment'
  | 'court_circular';

export interface LegalUpdate {
  id: string;
  title_en: string;
  title_hi: string;
  category: LegalCategory;
  act_or_case_name: string;
  citation?: string;
  court_name?: string;
  decision_or_commencement_date?: string;
  summary_en: string;
  summary_hi: string;
  key_sections: string[];
  official_source_url?: string;
  is_verified: boolean;
  last_verified_at: string;
  is_published: boolean;
  created_at: string;
}

export interface LegalForm {
  id: string;
  title_en: string;
  title_hi: string;
  category: string;
  description_en?: string;
  description_hi?: string;
  file_format: string;
  file_path: string;
  source_name: string;
  is_mandatory_prescribed: boolean;
  disclaimer?: string;
  downloads_count: number;
  created_at: string;
}

export interface NoticeEvent {
  id: string;
  title_en: string;
  title_hi: string;
  category: string;
  content_en: string;
  content_hi: string;
  event_date?: string;
  expiry_date?: string;
  venue?: string;
  organizer: string;
  official_source_url?: string;
  is_published: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_name?: string;
  actor_role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  ip_address?: string;
  details?: Record<string, unknown>;
  created_at: string;
}
