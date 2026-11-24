-- 009_official_judgment_repository.sql
-- Migration for Supreme Court of India & Rajasthan High Court Official Precedent Repository
-- Adding Mandatory Approval Workflow, Cloudflare R2 Storage Keys, SHA-256 Hashes & Audit Logs

-- 1. Extend public.legal_documents with Official Repository Columns
ALTER TABLE public.legal_documents
  ADD COLUMN IF NOT EXISTS court_code TEXT,
  ADD COLUMN IF NOT EXISTS court_bench TEXT,
  ADD COLUMN IF NOT EXISTS diary_number TEXT,
  ADD COLUMN IF NOT EXISTS petitioner TEXT,
  ADD COLUMN IF NOT EXISTS respondent TEXT,
  ADD COLUMN IF NOT EXISTS advocate_names TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS judgment_type TEXT DEFAULT 'Judgment',
  ADD COLUMN IF NOT EXISTS reportable_status BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_source_url TEXT,
  ADD COLUMN IF NOT EXISTS r2_storage_key TEXT,
  ADD COLUMN IF NOT EXISTS pdf_sha256 TEXT,
  ADD COLUMN IF NOT EXISTS ocr_status TEXT DEFAULT 'pending'
    CHECK (ocr_status IN ('pending', 'completed', 'failed', 'not_required')),
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected', 'draft')),
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 2. Backfill existing records to maintain consistency
UPDATE public.legal_documents
SET approval_status = 'approved',
    published_at = COALESCE(verified_at, updated_at, NOW())
WHERE verification_status = 'verified' AND approval_status = 'pending';

UPDATE public.legal_documents
SET approval_status = 'rejected'
WHERE verification_status = 'rejected' AND approval_status = 'pending';

-- 3. Optimization Indexes for Admin Workflows and Public Filtering
CREATE INDEX IF NOT EXISTS idx_legal_docs_approval_pub
ON public.legal_documents(approval_status, publication_status);

CREATE INDEX IF NOT EXISTS idx_legal_docs_court_date
ON public.legal_documents(court_name, judgment_date DESC);

CREATE INDEX IF NOT EXISTS idx_legal_docs_r2_key
ON public.legal_documents(r2_storage_key);

CREATE INDEX IF NOT EXISTS idx_legal_docs_sha256
ON public.legal_documents(pdf_sha256);

-- 4. Judgment Audit History Table (Track discovery, download, approval, rejection, and publishing)
CREATE TABLE IF NOT EXISTS public.judgment_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL
      REFERENCES public.legal_documents(id) ON DELETE CASCADE,
    action TEXT NOT NULL
      CHECK (action IN (
        'discovered',
        'downloaded',
        'extracted',
        'submitted_for_approval',
        'approved',
        'published',
        'rejected',
        'saved_draft',
        'metadata_updated',
        'reprocessed',
        'deleted'
      )),
    performed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    metadata_snapshot JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_judgment_audit_doc
ON public.judgment_audit_logs(document_id, created_at DESC);

-- 5. Strict Row-Level Security Policies (Mandatory Double-Lock: Approved AND Published)
ALTER TABLE public.judgment_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read published verified judgments" ON public.legal_documents;
DROP POLICY IF EXISTS "Read published approved judgments" ON public.legal_documents;

CREATE POLICY "Read published approved judgments"
ON public.legal_documents
FOR SELECT TO authenticated
USING (
  (publication_status = 'published' AND approval_status = 'approved')
  OR public.is_legal_admin()
);

-- Public Anonymous Visitors can only read approved and published records
CREATE POLICY "Public read published approved judgments"
ON public.legal_documents
FOR SELECT TO anon
USING (
  publication_status = 'published' AND approval_status = 'approved'
);

CREATE POLICY "Admin audit log access"
ON public.judgment_audit_logs
FOR ALL TO authenticated
USING (public.is_legal_admin())
WITH CHECK (public.is_legal_admin());
