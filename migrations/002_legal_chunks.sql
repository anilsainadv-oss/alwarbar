-- 002_legal_chunks.sql

CREATE TABLE IF NOT EXISTS public.legal_document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID NOT NULL
      REFERENCES public.legal_documents(id) ON DELETE CASCADE,

    chunk_index INTEGER NOT NULL,
    page_number INTEGER,
    paragraph_number TEXT,

    content TEXT NOT NULL,

    embedding extensions.vector(1536),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_legal_chunks_document
ON public.legal_document_chunks(document_id);

CREATE INDEX IF NOT EXISTS idx_legal_chunks_embedding
ON public.legal_document_chunks
USING hnsw (embedding extensions.vector_cosine_ops);

ALTER TABLE public.legal_document_chunks
ADD COLUMN IF NOT EXISTS search_tsv tsvector
GENERATED ALWAYS AS (
  to_tsvector('simple'::regconfig, COALESCE(content, ''))
) STORED;

CREATE INDEX IF NOT EXISTS idx_legal_chunks_search
ON public.legal_document_chunks
USING GIN(search_tsv);
