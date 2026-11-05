-- ==============================================================================
-- 000_supabase_complete_setup.sql
-- COMPLETE ALL-IN-ONE SUPABASE SETUP FOR ALWAR ADVOCATES PORTAL
-- Run this entire script in Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'public_visitor',
            'registered_advocate',
            'forum_moderator',
            'public_admin',
            'case_admin'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'legal_category') THEN
        CREATE TYPE legal_category AS ENUM (
            'central_law',
            'rajasthan_act',
            'sc_judgment',
            'hc_judgment',
            'court_circular'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_status') THEN
        CREATE TYPE case_status AS ENUM (
            'active',
            'stayed',
            'reserved_for_order',
            'disposed',
            'archived'
        );
    END IF;
END $$;

-- 3. CORE PUBLIC & ADVOCATE TABLES
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

CREATE TABLE IF NOT EXISTS advocate_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bar_council_enrollment_no VARCHAR(100) NOT NULL,
    bar_association_name VARCHAR(255) DEFAULT 'District & Sessions Bar Association, Alwar' NOT NULL,
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

CREATE TABLE IF NOT EXISTS legal_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_en VARCHAR(255) NOT NULL,
    title_hi VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
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

CREATE TABLE IF NOT EXISTS notices_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_en VARCHAR(255) NOT NULL,
    title_hi VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
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

-- 4. FORUM
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

-- 5. MY CASE ADVOCATE PRIVATE OFFICE
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

CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advocate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    case_title VARCHAR(300) NOT NULL,
    case_number VARCHAR(100),
    cnr_number VARCHAR(16),
    court_name VARCHAR(255) NOT NULL,
    case_type VARCHAR(100) NOT NULL,
    petitioner_parties TEXT NOT NULL,
    respondent_parties TEXT NOT NULL,
    filing_date DATE,
    next_hearing_date DATE,
    stage_of_case VARCHAR(150),
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
    category VARCHAR(100) NOT NULL,
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
    priority VARCHAR(50) DEFAULT 'medium' NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
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
    status VARCHAR(50) DEFAULT 'unpaid' NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advocate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    draft_type VARCHAR(100) NOT NULL,
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

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE advocate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE welfare_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
DROP POLICY IF EXISTS "Public can view listed advocates" ON advocate_profiles;
CREATE POLICY "Public can view listed advocates" ON advocate_profiles FOR SELECT USING (is_publicly_listed = true);

DROP POLICY IF EXISTS "Public can view published schemes" ON welfare_schemes;
CREATE POLICY "Public can view published schemes" ON welfare_schemes FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Public can view published legal updates" ON legal_updates;
CREATE POLICY "Public can view published legal updates" ON legal_updates FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Public can view legal forms" ON legal_forms;
CREATE POLICY "Public can view legal forms" ON legal_forms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view published notices" ON notices_events;
CREATE POLICY "Public can view published notices" ON notices_events FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Public can view active forum posts" ON forum_posts;
CREATE POLICY "Public can view active forum posts" ON forum_posts FOR SELECT USING (is_hidden = false);

DROP POLICY IF EXISTS "Public can view forum replies" ON forum_replies;
CREATE POLICY "Public can view forum replies" ON forum_replies FOR SELECT USING (true);

-- Advocate Private Policies
DROP POLICY IF EXISTS "Advocates own cases access" ON cases;
CREATE POLICY "Advocates own cases access" ON cases FOR ALL USING (auth.uid() = advocate_id) WITH CHECK (auth.uid() = advocate_id);

DROP POLICY IF EXISTS "Advocates own docs access" ON case_documents;
CREATE POLICY "Advocates own docs access" ON case_documents FOR ALL USING (auth.uid() = advocate_id) WITH CHECK (auth.uid() = advocate_id);

DROP POLICY IF EXISTS "Advocates own hearings access" ON case_hearings;
CREATE POLICY "Advocates own hearings access" ON case_hearings FOR ALL USING (auth.uid() = advocate_id) WITH CHECK (auth.uid() = advocate_id);

DROP POLICY IF EXISTS "Advocates own tasks access" ON tasks;
CREATE POLICY "Advocates own tasks access" ON tasks FOR ALL USING (auth.uid() = advocate_id) WITH CHECK (auth.uid() = advocate_id);

DROP POLICY IF EXISTS "Advocates own clients access" ON clients;
CREATE POLICY "Advocates own clients access" ON clients FOR ALL USING (auth.uid() = advocate_id) WITH CHECK (auth.uid() = advocate_id);

DROP POLICY IF EXISTS "Advocates own invoices access" ON invoices;
CREATE POLICY "Advocates own invoices access" ON invoices FOR ALL USING (auth.uid() = advocate_id) WITH CHECK (auth.uid() = advocate_id);

DROP POLICY IF EXISTS "Advocates own drafts access" ON drafts;
CREATE POLICY "Advocates own drafts access" ON drafts FOR ALL USING (auth.uid() = advocate_id) WITH CHECK (auth.uid() = advocate_id);

DROP POLICY IF EXISTS "Advocates own library access" ON personal_library;
CREATE POLICY "Advocates own library access" ON personal_library FOR ALL USING (auth.uid() = advocate_id) WITH CHECK (auth.uid() = advocate_id);

-- 7. INITIAL SEED DATA
INSERT INTO forum_categories (slug, name_en, name_hi, description_en, description_hi, icon, sort_order) VALUES
('civil-property', 'Civil & Property Law', 'दीवानी एवं संपत्ति कानून', 'Title suits, injunctions, specific performance, and property disputes', 'स्वामित्व वाद, निषेधाज्ञा, विशिष्ट अनुतोष एवं संपत्ति विवाद', 'scale', 1),
('criminal-practice', 'Criminal Law & Procedure', 'दांडिक विधि एवं प्रक्रिया', 'BNSS bail, trials, revisions, appeals, and police station procedures', 'बीएनएसएस जमानत, विचारण, निगरानी, अपील एवं थाना प्रक्रिया', 'gavel', 2),
('revenue-land', 'Revenue & Land Matters', 'राजस्व एवं भूमि विधि', 'Rajasthan Tenancy Act, Land Revenue Act, mutation, and partition', 'राजस्थान काश्तकारी अधिनियम, भू-राजस्व, नामांतरण एवं विभाजन', 'landmark', 3),
('family-matters', 'Family & Matrimonial Law', 'पारिवारिक एवं वैवाहिक विधि', 'Maintenance, divorce, restitution of conjugal rights, and custody', 'भरण-पोषण, विवाह-विच्छेद, दांपत्य अधिकारों का प्रत्यास्थापन', 'users', 4),
('mact-claims', 'Motor Accident Claims (MACT)', 'मोटर दुर्घटना दावा अधिकरण', 'Accident claims, insurance liability, and compensation computation', 'दुर्घटना दावे, बीमा देयता एवं प्रतिकर निर्धारण', 'car', 5),
('drafting-procedure', 'Drafting & Court Procedure', 'प्रारूपण एवं न्यायालयी प्रक्रिया', 'Format drafting, affidavits, e-filing, and certified copies procedure', 'ड्राफ्टिंग प्रारूप, शपथ पत्र, ई-फाइलिंग एवं नकल प्रक्रिया', 'file-text', 6),
('young-advocates', 'Young Advocates & Mentoring', 'नवप्रवेशी अधिवक्ता एवं मार्गदर्शन', 'Practice orientation, chamber etiquette, and senior guidance', 'वकालत प्रारंभ, चैंबर परंपराएं एवं वरिष्ठ मार्गदर्शन', 'graduation-cap', 7)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO welfare_schemes (
    title_en, title_hi, issuing_authority, official_source_url,
    eligibility_criteria, benefits_summary, application_process,
    document_checklist, deadline, last_verified_date, is_published
) VALUES
(
    'Rajasthan Advocates Welfare Fund — Retirement & Death Benefit',
    'राजस्थान अधिवक्ता कल्याण कोष — सेवानिवृत्ति एवं मृत्यु सहायता योजना',
    'Bar Council of Rajasthan (Welfare Fund Trustee Committee)',
    'http://barcouncilofrajasthan.org/welfare-fund',
    'Advocate enrolled with the Bar Council of Rajasthan, member of an affiliated Bar Association (such as Alwar District Bar), with regular purchase and affixation of Welfare Stamps.',
    'Financial lump sum support up to Rs. 10,00,000 on completion of practice or unfortunate demise, payable to designated nominees.',
    'Submit Form "A" / "D" with verification certificate from President/Secretary of Alwar Bar Association to the Secretary, Trustee Committee, High Court Premises, Jodhpur.',
    ARRAY['Enrolment Certificate Copy', 'Bar Association Continuity Certificate', 'Nomination Form', 'Affidavit of Non-Employment', 'Cancelled Cheque'],
    'Ongoing (Annual subscription by 31st March)',
    '2026-08-15',
    true
),
(
    'Advocates Group Mediclaim & Health Assistance Scheme',
    'अधिवक्ता समूह स्वास्थ्य बीमा एवं गंभीर बीमारी सहायता योजना',
    'Bar Council of Rajasthan & State Government of Rajasthan',
    'http://barcouncilofrajasthan.org',
    'Actively practicing advocates under 70 years of age whose names are on the live roll of the Bar Council of Rajasthan.',
    'Cashless hospitalization coverage up to Rs. 5,00,000 per annum across empanelled hospitals in Rajasthan including SMS Jaipur and District Hospital Alwar.',
    'Annual online enrollment through the Bar Council portal with premium subsidy supported by the Advocate Welfare Trust Fund.',
    ARRAY['Bar Council Identity Card', 'Aadhaar Card', 'Family Member Details', 'Declaration Form'],
    'Annual Renewal: 31st October',
    '2026-09-01',
    true
)
ON CONFLICT DO NOTHING;
