-- 004_legal_ingestion_jobs.sql

CREATE TABLE IF NOT EXISTS public.legal_ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    collection_method TEXT NOT NULL
      CHECK (collection_method IN ('manual','automatic','api')),

    source_name TEXT,
    source_url TEXT,

    status TEXT DEFAULT 'pending'
      CHECK (status IN (
        'pending','running','completed','failed','cancelled'
      )),

    total_documents INTEGER DEFAULT 0,
    successful_documents INTEGER DEFAULT 0,
    failed_documents INTEGER DEFAULT 0,

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,

    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.legal_document_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID NOT NULL
      REFERENCES public.legal_documents(id) ON DELETE CASCADE,

    cited_document_id UUID
      REFERENCES public.legal_documents(id) ON DELETE SET NULL,

    cited_case_name TEXT,
    citation_text TEXT,
    relation_type TEXT,
    verification_status TEXT DEFAULT 'pending',

    created_at TIMESTAMPTZ DEFAULT NOW()
);
