import { z } from 'zod';

// ==========================================
// AUTHENTICATION SCHEMAS
// ==========================================

export const loginSchema = z.object({
  email: z.string().min(1, 'Email or Enrollment Number is required').max(100),
  password: z.string().min(1, 'Password is required').max(128)
});

export const registerSchema = z.object({
  email: z.string().email('Valid email address is required').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  full_name: z.string().min(2, 'Full name is required').max(100),
  bar_council_enrollment_no: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  court_practice_complex: z.string().max(200).optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(128)
});

export const bootstrapSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(8, 'Bootstrap password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  token: z.string().min(1, 'Bootstrap token is required'),
  role: z.enum(['public_admin', 'case_admin'])
});

// ==========================================
// MY-CASE CRUD SCHEMAS
// ==========================================

export const createCaseSchema = z.object({
  case_title: z.string().min(2, 'Case title is required').max(200),
  case_number: z.string().min(1, 'Case number is required').max(100),
  court_name: z.string().min(2, 'Court name is required').max(200),
  case_type: z.string().min(1, 'Case type is required').max(100),
  petitioner_parties: z.string().max(500).optional().default(''),
  respondent_parties: z.string().max(500).optional().default(''),
  cnr_number: z.string().max(50).optional().default(''),
  stage_of_case: z.string().max(100).optional().default('Hearing'),
  next_hearing_date: z.string().max(50).optional().default(''),
  status: z.enum(['active', 'stayed', 'reserved_for_order', 'disposed', 'archived']).optional().default('active'),
  notes: z.string().max(5000).optional().default('')
});

export const updateCaseSchema = createCaseSchema.partial();

export const createClientSchema = z.object({
  full_name: z.string().min(2, 'Client name is required').max(150),
  phone: z.string().max(30).optional().default(''),
  email: z.string().max(100).optional().default(''),
  address: z.string().max(300).optional().default(''),
  confidential_notes: z.string().max(3000).optional().default('')
});

export const updateClientSchema = createClientSchema.partial();

export const createHearingSchema = z.object({
  case_id: z.string().min(1, 'Case ID is required'),
  hearing_date: z.string().min(4, 'Hearing date is required').max(50),
  court_room: z.string().max(100).optional().default(''),
  judge_name: z.string().max(150).optional().default(''),
  business_recorded: z.string().max(2000).optional().default(''),
  next_action: z.string().max(1000).optional().default(''),
  next_hearing_date: z.string().max(50).optional().default(''),
  attended: z.boolean().optional().default(false)
});

export const updateHearingSchema = createHearingSchema.partial();

export const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'Full name is required').max(100).optional(),
  phone: z.string().max(20).optional(),
  bar_council_enrollment_no: z.string().max(50).optional(),
  bar_association_name: z.string().max(150).optional(),
  court_practice_complex: z.string().max(200).optional(),
  chamber_address: z.string().max(300).optional(),
  experience_years: z.coerce.number().min(0).max(80).optional(),
  practice_areas: z.array(z.string()).optional(),
  bio_hindi: z.string().max(2000).optional(),
  bio_english: z.string().max(2000).optional(),
  is_publicly_listed: z.boolean().optional()
});

export const createDocumentSchema = z.object({
  case_id: z.string().min(1, 'Case ID is required'),
  title: z.string().min(1, 'Document title is required').max(200),
  category: z.enum(['pleading', 'evidence', 'order', 'bail', 'vakalatnama', 'other']).default('evidence'),
  file_path: z.string().max(500).optional(),
  extracted_text: z.string().max(50000).optional()
});

export const createInvoiceSchema = z.object({
  client_id: z.string().min(1, 'Client ID is required'),
  case_id: z.string().max(100).optional(),
  invoice_number: z.string().min(1, 'Invoice number is required').max(100),
  total_amount: z.coerce.number().min(0, 'Total amount must be positive'),
  paid_amount: z.coerce.number().min(0).optional().default(0),
  status: z.enum(['paid', 'unpaid', 'partially_paid']).optional().default('unpaid'),
  issue_date: z.string().max(50).optional(),
  due_date: z.string().max(50).optional(),
  notes: z.string().max(1000).optional().default('')
});

export const createDraftSchema = z.object({
  case_id: z.string().max(100).optional(),
  title: z.string().min(1, 'Draft title is required').max(200),
  draft_type: z.string().min(1, 'Draft type is required').max(100),
  content_text: z.string().min(1, 'Draft content is required').max(100000),
  language: z.enum(['en', 'hi']).optional().default('en')
});

export const createTaskSchema = z.object({
  case_id: z.string().max(100).optional(),
  title: z.string().min(1, 'Task title is required').max(200),
  due_date: z.string().max(50).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium')
});

// ==========================================
// AI REQUEST SCHEMAS
// ==========================================

export const aiDraftSchema = z.object({
  draftType: z.string().min(1, 'Draft type is required'),
  caseTitle: z.string().max(200).optional(),
  courtName: z.string().max(200).optional(),
  parties: z.any().optional(),
  facts: z.string().max(20000).optional(),
  language: z.enum(['en', 'hi']).optional().default('en')
});

export const aiAnalyzeSchema = z.object({
  facts: z.string().min(10, 'Facts must be at least 10 characters').max(20000)
});

export const aiResearchSchema = z.object({
  query: z.string().min(2, 'Search query must be at least 2 characters').max(500),
  jurisdiction: z.string().max(100).optional()
});

export const aiChatSchema = z.object({
  sessionId: z.string().max(100).optional(),
  caseId: z.string().max(100).optional(),
  message: z.string().min(1, 'Message is required').max(10000),
  language: z.enum(['en', 'hi']).optional().default('en'),
  stream: z.boolean().optional().default(false)
});

export const exportDocxSchema = z.object({
  draftId: z.string().max(100).optional(),
  draftType: z.string().min(1, 'Draft type is required').max(100),
  title: z.string().min(1, 'Title is required').max(200),
  contentText: z.string().min(1, 'Content is required').max(200000),
  courtName: z.string().max(200).optional(),
  parties: z.any().optional(),
  language: z.enum(['en', 'hi']).optional().default('en')
});

// ==========================================
// AUTOMATION & NOTIFICATIONS SCHEMAS (P4)
// ==========================================

export const notificationPreferencesSchema = z.object({
  email_enabled: z.boolean().default(true),
  whatsapp_enabled: z.boolean().default(false),
  in_app_enabled: z.boolean().default(true),
  daily_digest_enabled: z.boolean().default(true),
  daily_digest_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').default('08:00'),
  reminder_lead_days: z.array(z.number().min(0).max(30)).default([1, 2]),
  client_reminders_enabled: z.boolean().default(true),
  client_reminder_lead_days: z.number().min(0).max(14).default(1),
  preferred_language: z.enum(['en', 'hi']).default('en'),
  quiet_hours_enabled: z.boolean().default(false),
  quiet_hours_start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().default('21:00'),
  quiet_hours_end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().default('07:00')
});

export const sendCommunicationSchema = z.object({
  client_id: z.string().min(1, 'Client ID is required'),
  case_id: z.string().max(100).optional(),
  channel: z.enum(['email', 'whatsapp', 'sms', 'in_app']),
  message_type: z.enum(['hearing_reminder', 'case_status_update', 'invoice_notice', 'custom_message']),
  subject: z.string().max(200).optional(),
  content: z.string().min(1, 'Message content is required').max(2000)
});

export const importCauseListSchema = z.object({
  court_name: z.string().min(2, 'Court name is required').max(200),
  judge_name: z.string().max(150).optional(),
  cause_list_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
  raw_text: z.string().max(500000).optional(),
  entries: z.array(z.object({
    item_number: z.number().min(1),
    case_number: z.string().min(1),
    cnr_number: z.string().optional(),
    case_type: z.string().optional().default('Civil/Criminal'),
    parties: z.string().min(1),
    petitioner_advocate: z.string().optional(),
    respondent_advocate: z.string().optional(),
    stage_or_purpose: z.string().optional()
  })).optional()
});

export const runAutomationSchema = z.object({
  job_type: z.enum(['all', 'hearing_reminders', 'daily_digest', 'cause_list_sync', 'status_monitor']).optional().default('all'),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

// ==========================================
// SAAS & CHAMBER SCHEMAS (P5)
// ==========================================

export const createSubscriptionOrderSchema = z.object({
  plan_id: z.enum(['starter', 'professional', 'chamber']),
  billing_cycle: z.enum(['monthly', 'yearly'])
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
  plan_id: z.enum(['starter', 'professional', 'chamber']),
  billing_cycle: z.enum(['monthly', 'yearly'])
});

export const inviteTeamMemberSchema = z.object({
  email: z.string().email('Valid email address is required').max(150),
  role: z.enum(['senior_advocate', 'associate_advocate', 'chamber_clerk', 'intern']),
  full_name: z.string().min(2, 'Name is required').max(150).optional()
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['senior_advocate', 'associate_advocate', 'chamber_clerk', 'intern']),
  status: z.enum(['active', 'suspended']).optional()
});

export const createChamberSchema = z.object({
  name: z.string().min(2, 'Chamber name is required').max(150),
  court_complex: z.string().min(2).max(150).default('District & Sessions Court, Alwar'),
  chamber_number: z.string().max(50).optional()
});
