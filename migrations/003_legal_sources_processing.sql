-- 003_legal_sources_processing.sql

CREATE TABLE IF NOT EXISTS public.legal_document_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID NOT NULL
      REFERENCES public.legal_documents(id) ON DELETE CASCADE,

    source_url TEXT,
    storage_path TEXT NOT NULL,
    original_filename TEXT,
    mime_type TEXT DEFAULT 'application/pdf',
    file_size BIGINT,
    checksum TEXT,

    source_name TEXT,
    access_permission_status TEXT DEFAULT 'unverified'
      CHECK (access_permission_status IN (
        'unverified', 'permitted', 'restricted'
      )),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.legal_document_processing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID NOT NULL
      REFERENCES public.legal_documents(id) ON DELETE CASCADE,

    extraction_status TEXT DEFAULT 'pending',
    ocr_status TEXT DEFAULT 'pending',
    metadata_status TEXT DEFAULT 'pending',
    embedding_status TEXT DEFAULT 'pending',

    total_pages INTEGER DEFAULT 0,
    processed_pages INTEGER DEFAULT 0,
    total_chunks INTEGER DEFAULT 0,

    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processing_status
ON public.legal_document_processing(extraction_status,
                                    embedding_status);
