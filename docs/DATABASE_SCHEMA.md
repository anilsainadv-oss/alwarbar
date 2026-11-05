# Database Schema Specification — Alwar Advocates Portal

## 1. Schema Design Principles
1. **Strong Isolation**: Every table in the private legal office module includes an `advocate_id` column referencing `users(id)`.
2. **PostgreSQL RLS Compliant**: All private tables have Row-Level Security enabled with policies restricting `SELECT`, `INSERT`, `UPDATE`, and `DELETE` strictly to `auth.uid() = advocate_id`.
3. **Public Content Verification**: Public resources (laws, welfare schemes, court forms) track `verification_status`, `issuing_authority`, `official_source_url`, and `last_verified_at`.
4. **Audit Trail**: Administrative actions, forum moderations, and security events are logged in an immutable `audit_logs` table.

---

## 2. Core Entities

### Authentication & Profiles
- `users`: id (UUID PK), email, password_hash, full_name, role (`public_visitor`, `registered_advocate`, `forum_moderator`, `public_admin`, `case_admin`), phone, created_at, updated_at
- `advocate_profiles`: id (UUID PK), user_id (FK -> users), bar_council_enrollment_no, bar_association_name (e.g. "Alwar District Bar Association"), chambers_address, practice_areas (text[]), experience_years, bio_hindi, bio_english, is_verified (boolean), verified_by (FK -> users), verified_at (timestamp), is_publicly_listed (boolean)

### Public Knowledge Base & Resources
- `welfare_schemes`: id (UUID PK), title_en, title_hi, issuing_authority, official_source_url, eligibility_criteria, benefits_summary, application_process, document_checklist, deadline, verified_date, is_published, created_by
- `legal_updates`: id (UUID PK), title_en, title_hi, category (`central_law`, `rajasthan_act`, `sc_judgment`, `hc_judgment`, `notification`), act_or_case_name, citation, date_of_decision, commencement_date, summary_en, summary_hi, source_url, verified_date, is_published
- `court_resources`: id (UUID PK), title_en, title_hi, resource_type (`cause_list`, `ecourts_guide`, `efiling`, `court_fees`, `holidays`), description_en, description_hi, link_url, attachment_path, is_published
- `legal_forms`: id (UUID PK), title_en, title_hi, category (`civil`, `criminal`, `revenue`, `family`, `mact`, `consumer`, `affidavit`), description_en, description_hi, file_format (`docx`, `pdf`), file_url, source_name, is_mandatory_prescribed (boolean), disclaimer, download_count
- `notices_events`: id (UUID PK), title_en, title_hi, category (`court_notice`, `bar_update`, `meeting`, `seminar`, `training`), content_en, content_hi, event_date, expiry_date, venue, organizer, source_url, is_published

### Community Forum
- `forum_categories`: id (UUID PK), slug, name_en, name_hi, description_en, description_hi, icon, sort_order
- `forum_posts`: id (UUID PK), category_id (FK), user_id (FK), title, content, language (`hi`, `en`, `mixed`), upvote_count, reply_count, is_pinned, is_locked, is_hidden, created_at
- `forum_replies`: id (UUID PK), post_id (FK), user_id (FK), parent_reply_id (nullable FK), content, is_accepted_answer, upvote_count, created_at
- `forum_reports`: id (UUID PK), post_id (nullable FK), reply_id (nullable FK), reporter_id (FK), reason, details, status (`pending`, `reviewed`, `dismissed`), reviewed_by (FK), created_at

### My Case — Private Advocate Workspace
- `cases`: id (UUID PK), advocate_id (FK -> users), case_title, case_number, cnr_number, court_name, court_complex (e.g. "District and Sessions Court, Alwar"), case_type (`Civil Suit`, `Criminal Revision`, `Bail Application`, `Revenue Appeal`, etc.), client_id (FK -> clients), petitioner_parties (text), respondent_parties (text), filing_date, next_hearing_date, stage_of_case, status (`active`, `disposed`, `appealed`, `archived`), private_notes, created_at, updated_at
- `case_documents`: id (UUID PK), case_id (FK -> cases), advocate_id (FK -> users), title, category (`pleading`, `evidence`, `order`, `affidavit`, `notice`, `vakalatnama`), file_path, file_size_bytes, mime_type, extracted_text, page_count, ocr_status (`pending`, `completed`, `failed`), created_at
- `case_hearings`: id (UUID PK), case_id (FK -> cases), advocate_id (FK -> users), hearing_date, court_room, judge_name, business_recorded, previous_order_summary, next_action, next_hearing_date, attended (boolean)
- `tasks`: id (UUID PK), advocate_id (FK -> users), case_id (nullable FK), title, description, due_date, priority (`urgent`, `high`, `medium`, `low`), status (`pending`, `completed`), created_at
- `clients`: id (UUID PK), advocate_id (FK -> users), full_name, phone, email, address, notes, created_at
- `invoices`: id (UUID PK), advocate_id (FK -> users), client_id (FK -> clients), case_id (nullable FK), invoice_number, total_amount, paid_amount, status (`unpaid`, `partially_paid`, `paid`), issue_date, due_date, notes
- `drafts`: id (UUID PK), advocate_id (FK -> users), case_id (nullable FK), draft_type (`legal_notice`, `bail_application`, `written_statement`, `affidavit`, `petition`), title, content_html, content_text, language (`hi`, `en`), version, created_at, updated_at
- `personal_library`: id (UUID PK), advocate_id (FK -> users), title, category, citation, notes, tags (text[]), source_link, created_at

### Operations & Auditing
- `audit_logs`: id (UUID PK), actor_id (FK -> users), action, entity_type, entity_id, ip_address, user_agent, details (jsonb), created_at
- `ai_usage_logs`: id (UUID PK), user_id (FK -> users), feature (`case_analyzer`, `legal_research`, `drafting`), prompt_tokens, completion_tokens, provider, created_at
- `system_settings`: key (string PK), value (jsonb), updated_at
