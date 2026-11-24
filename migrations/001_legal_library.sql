-- 001_legal_library.sql

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT NOT NULL,
    case_number TEXT,
    citation TEXT,

    court_name TEXT NOT NULL DEFAULT 'Rajasthan High Court',
    bench TEXT CHECK (
        bench IS NULL OR bench IN ('Jodhpur', 'Jaipur')
    ),

    judgment_date DATE,
    decision_type TEXT,
    case_type TEXT,
    judge_names TEXT[] DEFAULT '{}',

    legal_subjects TEXT[] DEFAULT '{}',
    statutes TEXT[] DEFAULT '{}',
    parties TEXT[] DEFAULT '{}',

    language TEXT DEFAULT 'English',
    full_text TEXT,

    content_hash TEXT UNIQUE,

    source_type TEXT CHECK (
        source_type IN ('manual', 'automatic', 'api')
    ),

    verification_status TEXT NOT NULL DEFAULT 'pending'
      CHECK (verification_status IN ('pending','verified','rejected')),

    publication_status TEXT NOT NULL DEFAULT 'draft'
      CHECK (publication_status IN ('draft','published','archived')),

    uploaded_by UUID REFERENCES auth.users(id),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CHECK (
      publication_status <> 'published'
      OR verification_status = 'verified'
    )
);

CREATE INDEX IF NOT EXISTS idx_legal_documents_court
ON public.legal_documents(court_name, bench);

CREATE INDEX IF NOT EXISTS idx_legal_documents_date
ON public.legal_documents(judgment_date DESC);

CREATE INDEX IF NOT EXISTS idx_legal_documents_case
ON public.legal_documents(case_number);

CREATE INDEX IF NOT EXISTS idx_legal_documents_citation
ON public.legal_documents(citation);

CREATE INDEX IF NOT EXISTS idx_legal_documents_subjects
ON public.legal_documents USING GIN(legal_subjects);
