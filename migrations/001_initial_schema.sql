-- ==============================================================================
-- 001_initial_schema.sql
-- Alwar Advocates Portal & My Case AI Legal Office — Database Schema
-- Compatible with PostgreSQL 15+ and Supabase
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLES
CREATE TYPE user_role AS ENUM (
    'public_visitor',
    'registered_advocate',
    'forum_moderator',
    'public_admin',
    'case_admin'
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'registered_advocate' NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. ADVOCATE PROFILES
CREATE TABLE IF NOT EXISTS advocate_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bar_council_enrollment_no VARCHAR(100) NOT NULL, -- e.g. "R/1234/2015"
    bar_association_name VARCHAR(255) DEFAULT 'Alwar District Bar Association' NOT NULL,
    chamber_address TEXT,
    court_practice_complex VARCHAR(255) DEFAULT 'District & Sessions Court, Alwar',
    practice_areas TEXT[] DEFAULT '{}',
    experience_years INTEGER DEFAULT 0,
    bio_hindi TEXT,
    bio_english TEXT,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    is_publicly_listed BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. RAJASTHAN ADVOCATE WELFARE SCHEMES
CREATE TABLE IF NOT EXISTS welfare_schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_en VARCHAR(255) NOT NULL,
    title_hi VARCHAR(255) NOT NULL,
    issuing_authority VARCHAR(255) DEFAULT 'Bar Council of Rajasthan' NOT NULL,
    official_source_url TEXT,
    eligibility_criteria TEXT NOT NULL,
    benefits_summary TEXT NOT NULL,
    application_process TEXT NOT NULL,
    document_checklist TEXT[] DEFAULT '{}',
    deadline VARCHAR(100),
    last_verified_date DATE NOT NULL,
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. LAWS, AMENDMENTS & JUDGMENTS
CREATE TYPE legal_category AS ENUM (
    'central_law',
    'rajasthan_act',
    'sc_judgment',
    'hc_judgment',
    'court_circular'
);

CREATE TABLE IF NOT EXISTS legal_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_en VARCHAR(255) NOT NULL,
    title_hi VARCHAR(255) NOT NULL,
    category legal_category NOT NULL,
    act_or_case_name VARCHAR(255) NOT NULL,
    citation VARCHAR(150),
    court_name VARCHAR(200),
    decision_or_commencement_date DATE,
    summary_en TEXT NOT NULL,
    summary_hi TEXT NOT NULL,
    key_sections TEXT[] DEFAULT '{}',
    official_source_url TEXT,
    is_verified BOOLEAN DEFAULT TRUE NOT NULL,
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. LEGAL FORMS & DOWNLOADABLE TEMPLATES
CREATE TABLE IF NOT EXISTS legal_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_en VARCHAR(255) NOT NULL,
    title_hi VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'civil', 'criminal', 'bail', 'revenue', 'affidavit'
    description_en TEXT,
    description_hi TEXT,
    file_format VARCHAR(20) DEFAULT 'docx' NOT NULL,
    file_path TEXT NOT NULL,
    source_name VARCHAR(255) DEFAULT 'Verified Court Practice Standard',
    is_mandatory_prescribed BOOLEAN DEFAULT FALSE NOT NULL,
    disclaimer TEXT,
    downloads_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. COURT RESOURCES & PRACTICE NOTICES
CREATE TABLE IF NOT EXISTS notices_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_en VARCHAR(255) NOT NULL,
    title_hi VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'court_notice', 'bar_circular', 'seminar', 'holiday'
    content_en TEXT NOT NULL,
    content_hi TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    venue VARCHAR(255),
    organizer VARCHAR(255) DEFAULT 'Alwar Bar Association',
    official_source_url TEXT,
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. FORUM DISCUSSIONS & COMMUNITY
CREATE TABLE IF NOT EXISTS forum_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name_en VARCHAR(150) NOT NULL,
    name_hi VARCHAR(150) NOT NULL,
    description_en TEXT,
    description_hi TEXT,
    icon VARCHAR(50) DEFAULT 'scale',
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'hi' NOT NULL,
    upvotes INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS forum_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_accepted_answer BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS forum_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. MY CASE: PRIVATE ADVOCATE OFFICE
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advocate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    confidential_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TYPE case_status AS ENUM ('active', 'stayed', 'reserved_for_order', 'disposed', 'archived');

CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advocate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    case_title VARCHAR(300) NOT NULL,
    case_number VARCHAR(100), -- e.g. "Civil Suit 45/2024"
    cnr_number VARCHAR(16),   -- e.g. "RJAL01-001234-2024"
    court_name VARCHAR(255) NOT NULL, -- e.g. "Commercial Court, Alwar"
    case_type VARCHAR(100) NOT NULL, -- "Bail Application", "Civil Suit", etc.
    petitioner_parties TEXT NOT NULL,
    respondent_parties TEXT NOT NULL,
    filing_date DATE,
    next_hearing_date DATE,
    stage_of_case VARCHAR(150), -- "Arguments on Charge", "Plaintiff Evidence", etc.
    status case_status DEFAULT 'active' NOT NULL,
    private_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS case_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    advocate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'pleading', 'evidence', 'order', 'bail'
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    extracted_text TEXT,
    page_count INTEGER DEFAULT 1,
    ocr_status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS case_hearings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    advocate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hearing_date DATE NOT NULL,
    court_room VARCHAR(100),
    judge_name VARCHAR(255),
    business_recorded TEXT,
    previous_order_summary TEXT,
    next_action TEXT,
    next_hearing_date DATE,
    attended BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advocate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    due_date DATE,
    priority VARCHAR(50) DEFAULT 'medium' NOT NULL, -- 'urgent', 'high', 'medium', 'low'
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,  -- 'pending', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advocate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'unpaid' NOT NULL, -- 'paid', 'partially_paid', 'unpaid'
    issue_date DATE NOT NULL,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advocate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    draft_type VARCHAR(100) NOT NULL, -- 'legal_notice', 'bail_application', 'written_statement'
    title VARCHAR(255) NOT NULL,
    content_text TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'hi' NOT NULL,
    version INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS personal_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advocate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    citation VARCHAR(150),
    notes TEXT,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 9. AUDITING & SYSTEM TELEMETRY
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    ip_address VARCHAR(50),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
