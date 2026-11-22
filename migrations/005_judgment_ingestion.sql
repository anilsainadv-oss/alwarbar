-- Original court PDFs are private in R2 and are not public until explicit admin approval.
CREATE TABLE IF NOT EXISTS judgment_documents (
 id UUID PRIMARY KEY, court TEXT NOT NULL CHECK (court IN ('supreme_court','rajasthan_high_court')),
 case_title TEXT NOT NULL, case_number TEXT NOT NULL, citation TEXT, judgment_date DATE NOT NULL,
 official_source_url TEXT NOT NULL, original_file_name TEXT NOT NULL,
 original_mime_type TEXT NOT NULL CHECK (original_mime_type = 'application/pdf'),
 original_size_bytes BIGINT NOT NULL CHECK (original_size_bytes > 0), original_sha256 CHAR(64) NOT NULL,
 r2_key TEXT NOT NULL UNIQUE, storage_uri TEXT NOT NULL,
 verification_status TEXT NOT NULL DEFAULT 'pending_review' CHECK (verification_status IN ('pending_review','admin_verified','rejected')),
 publication_status TEXT NOT NULL DEFAULT 'pending' CHECK (publication_status IN ('pending','published','rejected')),
 uploaded_by TEXT NOT NULL, uploaded_by_name TEXT NOT NULL, approved_by TEXT, approved_by_name TEXT, approved_at TIMESTAMPTZ,
 rejected_by TEXT, rejected_at TIMESTAMPTZ, rejection_reason TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE (court, case_number, judgment_date)
);
CREATE INDEX IF NOT EXISTS idx_judgment_documents_public ON judgment_documents(publication_status, verification_status, judgment_date DESC);
CREATE INDEX IF NOT EXISTS idx_judgment_documents_court_date ON judgment_documents(court, judgment_date DESC);
ALTER TABLE judgment_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read approved judgments" ON judgment_documents;
CREATE POLICY "Public can read approved judgments" ON judgment_documents FOR SELECT USING (publication_status = 'published' AND verification_status = 'admin_verified');
-- Server write operations use SUPABASE_SERVICE_ROLE_KEY; do not expose it to the browser.
