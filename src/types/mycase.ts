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
  ocr_status: 'pending' | 'completed' | 'failed' | 'unsupported';
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

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tokens?: number;
  costEstimateINR?: number;
}

export interface AIChatSession {
  id: string;
  advocate_id: string;
  case_id?: string;
  title: string;
  messages: AIChatMessage[];
  total_tokens: number;
  total_cost_inr: number;
  created_at: string;
  updated_at: string;
}

// ==========================================
// AUTOMATION & NOTIFICATION TYPES (P4)
// ==========================================

export type NotificationChannel = 'email' | 'whatsapp' | 'sms' | 'in_app';
export type NotificationDeliveryStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'simulated';

export interface NotificationPreferences {
  id: string;
  advocate_id: string;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  in_app_enabled: boolean;
  daily_digest_enabled: boolean;
  daily_digest_time: string; // e.g. "08:00"
  reminder_lead_days: number[]; // e.g. [1, 2]
  client_reminders_enabled: boolean;
  client_reminder_lead_days: number; // e.g. 1
  preferred_language: 'en' | 'hi';
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string; // e.g. "21:00"
  quiet_hours_end?: string; // e.g. "07:00"
  created_at: string;
  updated_at: string;
}

export interface NotificationDeliveryRecord {
  id: string;
  advocate_id: string;
  recipient: string;
  recipient_name?: string;
  recipient_type: 'advocate' | 'client';
  channel: NotificationChannel;
  notification_type: 'hearing_reminder' | 'daily_diary_digest' | 'case_status_change' | 'cause_list_alert' | 'client_notice';
  title: string;
  content: string; // Privacy-masked content
  case_id?: string;
  case_number?: string;
  status: NotificationDeliveryStatus;
  provider: string; // e.g. "Resend (Email)", "WhatsApp Business Cloud API", "Offline Simulator"
  provider_message_id?: string;
  error_details?: string;
  idempotency_key: string;
  sent_at?: string;
  created_at: string;
}

export interface ClientCommunication {
  id: string;
  advocate_id: string;
  client_id: string;
  case_id?: string;
  channel: NotificationChannel;
  recipient: string;
  message_type: 'hearing_reminder' | 'case_status_update' | 'invoice_notice' | 'custom_message';
  subject?: string;
  content: string;
  status: NotificationDeliveryStatus;
  provider: string;
  provider_message_id?: string;
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';

export interface AutomationJob {
  id: string;
  advocate_id: string;
  job_type: 'hearing_reminder' | 'daily_digest' | 'cause_list_match' | 'status_monitor' | 'client_notice';
  payload: Record<string, any>;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  last_error?: string;
  run_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CauseListEntry {
  id: string;
  advocate_id?: string;
  court_name: string;
  judge_name?: string;
  cause_list_date: string; // YYYY-MM-DD
  item_number: number;
  case_number: string;
  cnr_number?: string;
  case_type: string;
  parties: string;
  petitioner_advocate?: string;
  respondent_advocate?: string;
  stage_or_purpose?: string;
  matched_case_id?: string;
  created_at: string;
}

// ==========================================
// SAAS SUBSCRIPTIONS & BILLING (P5)
// ==========================================

export type SubscriptionPlanId = 'starter' | 'professional' | 'chamber';
export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing' | 'expired';

export interface PlanFeatureLimits {
  max_active_cases: number;
  max_clients: number;
  max_storage_bytes: number; // in bytes (e.g. 250MB, 5GB, 50GB)
  max_monthly_ai_queries: number;
  max_team_members: number;
  has_docx_export: boolean;
  has_whatsapp_notifications: boolean;
  has_cause_list_matcher: boolean;
  has_custom_letterhead: boolean;
  has_priority_support: boolean;
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  name_hi: string;
  description: string;
  monthly_price_inr: number;
  yearly_price_inr: number; // 2 months discount
  limits: PlanFeatureLimits;
  highlight?: boolean;
}

export interface AdvocateSubscription {
  id: string;
  advocate_id: string;
  chamber_id?: string;
  plan_id: SubscriptionPlanId;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  amount_inr: number;
  currency: string; // 'INR'
  current_period_start: string;
  current_period_end: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_subscription_id?: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionInvoice {
  id: string;
  advocate_id: string;
  chamber_id?: string;
  subscription_id?: string;
  invoice_number: string; // e.g. SUB-2026-0001
  plan_id: SubscriptionPlanId;
  plan_name: string;
  billing_cycle: BillingCycle;
  amount_inr: number;
  tax_inr: number; // 18% GST (CGST 9% + SGST 9% or IGST 18%)
  total_amount_inr: number;
  status: 'paid' | 'failed' | 'refunded';
  payment_method: 'upi' | 'card' | 'netbanking' | 'test_gateway';
  razorpay_payment_id?: string;
  paid_at?: string;
  receipt_url?: string;
  created_at: string;
}

// ==========================================
// CHAMBER & TEAM MANAGEMENT (P5)
// ==========================================

export type ChamberMemberRole = 'senior_advocate' | 'associate_advocate' | 'chamber_clerk' | 'intern';
export type ChamberMemberStatus = 'active' | 'invited' | 'suspended';

export interface Chamber {
  id: string;
  name: string;
  court_complex: string;
  chamber_number?: string;
  owner_advocate_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChamberMember {
  id: string;
  chamber_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  bar_enrollment_no?: string;
  role: ChamberMemberRole;
  status: ChamberMemberStatus;
  invited_by: string;
  joined_at: string;
  created_at: string;
}

export interface ChamberInvitation {
  id: string;
  chamber_id: string;
  chamber_name: string;
  invited_by_advocate_id: string;
  invitee_email: string;
  role: ChamberMemberRole;
  token: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expires_at: string;
  created_at: string;
}

export interface ChamberUsageMetrics {
  plan_id: SubscriptionPlanId;
  plan_name: string;
  active_cases_count: number;
  max_cases: number;
  clients_count: number;
  max_clients: number;
  storage_bytes_used: number;
  max_storage_bytes: number;
  ai_queries_used: number;
  max_ai_queries: number;
  team_members_count: number;
  max_team_members: number;
}
