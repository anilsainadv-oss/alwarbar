-- ==============================================================================
-- 005_ai_legal_research_pgvector.sql
-- AI Legal Research & Intelligent Case Law Search Engine
-- Supabase PostgreSQL + pgvector Extension + Hybrid Search RPC
-- ==============================================================================

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Ensure vector extension types are in search path
SET search_path TO public, extensions;

-- 2. TABLE: legal_documents
-- Master record for certified court judgments, orders, and precedents
CREATE TABLE IF NOT EXISTS legal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    case_number VARCHAR(150),
    citation VARCHAR(150) NOT NULL,
    court_name VARCHAR(255) NOT NULL,
    court_level VARCHAR(50) NOT NULL DEFAULT 'High Court', -- 'Supreme Court', 'High Court', 'District Court', 'Tribunal'
    state VARCHAR(100) DEFAULT 'Rajasthan' NOT NULL,
    judge_names TEXT,
    judgment_date DATE,
    case_type VARCHAR(100), -- 'Criminal Appeal', 'Bail Application', 'Civil Writ', etc.
    legal_subject VARCHAR(150), -- 'Bail Jurisprudence', 'Injunction', 'Tenancy Law', etc.
    statutes TEXT, -- e.g. "Section 480 BNSS 2023, Section 439 CrPC, Article 21"
    source_name VARCHAR(255) DEFAULT 'Official Court Record' NOT NULL,
    source_url TEXT,
    document_url TEXT, -- Link to certified PDF in Supabase Storage or external repository
    language VARCHAR(10) DEFAULT 'en' NOT NULL, -- 'en' or 'hi'
    full_text TEXT NOT NULL,
    content_hash VARCHAR(64), -- SHA-256 for duplicate detection
    verification_status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending', 'verified', 'rejected', 'archived'
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Full-Text Search tsvector column (Generated automatically)
ALTER TABLE legal_documents ADD COLUMN IF NOT EXISTS fts_tokens tsvector
GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(citation, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(court_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(statutes, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(legal_subject, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(judge_names, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(full_text, '')), 'D')
) STORED;

-- Indexes for legal_documents
CREATE INDEX IF NOT EXISTS idx_legal_docs_fts ON legal_documents USING gin(fts_tokens);
CREATE INDEX IF NOT EXISTS idx_legal_docs_citation ON legal_documents(citation);
CREATE INDEX IF NOT EXISTS idx_legal_docs_court_date ON legal_documents(court_name, judgment_date DESC);
CREATE INDEX IF NOT EXISTS idx_legal_docs_level ON legal_documents(court_level);
CREATE INDEX IF NOT EXISTS idx_legal_docs_status ON legal_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_legal_docs_subject ON legal_documents(legal_subject);
CREATE INDEX IF NOT EXISTS idx_legal_docs_state ON legal_documents(state);
CREATE INDEX IF NOT EXISTS idx_legal_docs_hash ON legal_documents(content_hash);

-- 3. TABLE: legal_document_chunks
-- Semantic passages for high-dimensional vector search
CREATE TABLE IF NOT EXISTS legal_document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    page_number INTEGER,
    paragraph_number TEXT,
    embedding extensions.vector(1536), -- Compatible with OpenAI text-embedding-3-small (1536 dims)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(document_id, chunk_index)
);

-- Fast text search tsvector column on chunks (Generated automatically)
ALTER TABLE legal_document_chunks
ADD COLUMN IF NOT EXISTS search_tsv tsvector
GENERATED ALWAYS AS (
  to_tsvector('simple'::regconfig, COALESCE(content, ''))
) STORED;

CREATE INDEX IF NOT EXISTS idx_legal_chunks_search
ON legal_document_chunks
USING GIN(search_tsv);

-- HNSW Vector Similarity Index (Cosine Distance)
CREATE INDEX IF NOT EXISTS idx_legal_chunks_embedding_hnsw
ON legal_document_chunks USING hnsw (embedding extensions.vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_legal_chunks_doc_id ON legal_document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_legal_chunks_doc_idx ON legal_document_chunks(document_id, chunk_index);

-- 4. TABLE: legal_research_history
-- Multi-turn lawyer research query tracking & AI responses
CREATE TABLE IF NOT EXISTS legal_research_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    ai_response JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_legal_history_user ON legal_research_history(user_id, created_at DESC);

-- 5. TABLE: saved_research
-- Precedents and research memos pinned to advocate library or linked to specific case dossiers
CREATE TABLE IF NOT EXISTS saved_research (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_research_user ON saved_research(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_research_case ON saved_research(case_id);
CREATE INDEX IF NOT EXISTS idx_saved_research_doc ON saved_research(document_id);

-- 6. TABLE: legal_document_sources
-- Provenance, official legal gazettes, storage provenance & publishing registry
CREATE TABLE IF NOT EXISTS legal_document_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
    source_url TEXT,
    storage_path TEXT,
    original_filename TEXT,
    mime_type TEXT DEFAULT 'application/pdf',
    file_size BIGINT,
    checksum TEXT,
    source_name VARCHAR(255) NOT NULL,
    access_permission_status TEXT DEFAULT 'unverified'
      CHECK (access_permission_status IN (
        'unverified', 'permitted', 'restricted'
      )),
    publication_details TEXT,
    verification_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6.1 TABLE: legal_document_processing
-- Asynchronous ingestion, OCR, extraction and vector embedding tracking
CREATE TABLE IF NOT EXISTS legal_document_processing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
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
ON legal_document_processing(extraction_status, embedding_status);

-- 6.2 TABLE: legal_ingestion_jobs
-- Ingestion batches, crawlers, and API jobs
CREATE TABLE IF NOT EXISTS legal_ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.3 TABLE: legal_document_citations
-- Precedent citation graph linking citing judgments to cited authorities
CREATE TABLE IF NOT EXISTS legal_document_citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL
      REFERENCES legal_documents(id) ON DELETE CASCADE,
    cited_document_id UUID
      REFERENCES legal_documents(id) ON DELETE SET NULL,
    cited_case_name TEXT,
    citation_text TEXT,
    relation_type TEXT,
    verification_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_citations_doc ON legal_document_citations(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_citations_cited ON legal_document_citations(cited_document_id);

-- ==============================================================================
-- 7. RPC FUNCTIONS FOR SEMANTIC & HYBRID VECTOR SEARCH
-- ==============================================================================

-- Function 1: Pure Semantic Vector Search across Chunks
CREATE OR REPLACE FUNCTION match_legal_documents(
    query_embedding extensions.vector(1536),
    match_threshold FLOAT DEFAULT 0.65,
    match_count INT DEFAULT 10,
    filter_criteria JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
    chunk_id UUID,
    document_id UUID,
    chunk_index INT,
    content TEXT,
    page_number INT,
    paragraph_number TEXT,
    similarity FLOAT,
    title VARCHAR(255),
    citation VARCHAR(150),
    court_name VARCHAR(255),
    court_level VARCHAR(50),
    judgment_date DATE,
    legal_subject VARCHAR(150),
    document_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS chunk_id,
        c.document_id,
        c.chunk_index,
        c.content,
        c.page_number,
        c.paragraph_number,
        (1 - (c.embedding <=> query_embedding))::FLOAT AS similarity,
        d.title,
        d.citation,
        d.court_name,
        d.court_level,
        d.judgment_date,
        d.legal_subject,
        d.document_url
    FROM legal_document_chunks c
    JOIN legal_documents d ON c.document_id = d.id
    WHERE d.verification_status = 'verified'
      AND (c.embedding <=> query_embedding) < (1 - match_threshold)
      AND (filter_criteria->>'court_level' IS NULL OR d.court_level = filter_criteria->>'court_level')
      AND (filter_criteria->>'court_name' IS NULL OR d.court_name ILIKE '%' || (filter_criteria->>'court_name') || '%')
      AND (filter_criteria->>'legal_subject' IS NULL OR d.legal_subject ILIKE '%' || (filter_criteria->>'legal_subject') || '%')
      AND (filter_criteria->>'year' IS NULL OR EXTRACT(YEAR FROM d.judgment_date)::TEXT = filter_criteria->>'year')
      AND (filter_criteria->>'language' IS NULL OR d.language = filter_criteria->>'language')
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function 2: Hybrid Search combining Keyword FTS + Vector Similarity (Reciprocal Rank Fusion)
CREATE OR REPLACE FUNCTION hybrid_legal_search(
    query_text TEXT,
    query_embedding extensions.vector(1536),
    match_count INT DEFAULT 15,
    full_text_weight FLOAT DEFAULT 0.5,
    semantic_weight FLOAT DEFAULT 0.5,
    filter_criteria JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
    document_id UUID,
    chunk_id UUID,
    title VARCHAR(255),
    citation VARCHAR(150),
    court_name VARCHAR(255),
    court_level VARCHAR(50),
    judgment_date DATE,
    legal_subject VARCHAR(150),
    statutes TEXT,
    snippet TEXT,
    page_number INT,
    paragraph_number TEXT,
    semantic_score FLOAT,
    keyword_score FLOAT,
    hybrid_score FLOAT,
    document_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    clean_query TEXT := trim(query_text);
    parsed_tsquery tsquery;
BEGIN
    -- Build safe plain websearch tsquery
    BEGIN
        parsed_tsquery := websearch_to_tsquery('english', clean_query);
    EXCEPTION WHEN OTHERS THEN
        parsed_tsquery := plainto_tsquery('english', clean_query);
    END;

    RETURN QUERY
    WITH semantic_matches AS (
        SELECT
            c.id AS s_chunk_id,
            c.document_id AS s_doc_id,
            c.content AS s_content,
            c.page_number AS s_page,
            c.paragraph_number AS s_para,
            (1 - (c.embedding <=> query_embedding))::FLOAT AS s_sim,
            ROW_NUMBER() OVER (ORDER BY c.embedding <=> query_embedding) AS s_rank
        FROM legal_document_chunks c
        JOIN legal_documents d ON c.document_id = d.id
        WHERE d.verification_status = 'verified'
          AND (c.embedding <=> query_embedding) < 0.65
        LIMIT 40
    ),
    keyword_matches AS (
        SELECT
            d.id AS k_doc_id,
            ts_rank_cd(d.fts_tokens, parsed_tsquery) AS k_rank_score,
            ROW_NUMBER() OVER (ORDER BY ts_rank_cd(d.fts_tokens, parsed_tsquery) DESC) AS k_rank
        FROM legal_documents d
        WHERE d.verification_status = 'verified'
          AND d.fts_tokens @@ parsed_tsquery
        LIMIT 40
    ),
    combined_scores AS (
        SELECT
            coalesce(s.s_doc_id, k.k_doc_id) AS doc_id,
            s.s_chunk_id AS chunk_id,
            s.s_content AS chunk_snippet,
            s.s_page AS page_no,
            s.s_para AS para_no,
            coalesce(s.s_sim, 0.0)::FLOAT AS sem_score,
            coalesce(k.k_rank_score, 0.0)::FLOAT AS kw_score,
            -- Reciprocal Rank Fusion (RRF) calculation with citation boost
            (
                coalesce(semantic_weight / (60.0 + s.s_rank), 0.0) +
                coalesce(full_text_weight / (60.0 + k.k_rank), 0.0) +
                CASE WHEN d.citation ILIKE '%' || clean_query || '%' THEN 0.25 ELSE 0.0 END
            )::FLOAT AS combined_rank
        FROM legal_documents d
        LEFT JOIN semantic_matches s ON d.id = s.s_doc_id
        LEFT JOIN keyword_matches k ON d.id = k.k_doc_id
        WHERE (s.s_doc_id IS NOT NULL OR k.k_doc_id IS NOT NULL)
          AND (filter_criteria->>'court_level' IS NULL OR d.court_level = filter_criteria->>'court_level')
          AND (filter_criteria->>'court_name' IS NULL OR d.court_name ILIKE '%' || (filter_criteria->>'court_name') || '%')
          AND (filter_criteria->>'legal_subject' IS NULL OR d.legal_subject ILIKE '%' || (filter_criteria->>'legal_subject') || '%')
          AND (filter_criteria->>'year' IS NULL OR EXTRACT(YEAR FROM d.judgment_date)::TEXT = filter_criteria->>'year')
    )
    SELECT DISTINCT ON (d.id)
        d.id AS document_id,
        cs.chunk_id,
        d.title,
        d.citation,
        d.court_name,
        d.court_level,
        d.judgment_date,
        d.legal_subject,
        d.statutes,
        coalesce(cs.chunk_snippet, substring(d.full_text from 1 for 400)) AS snippet,
        cs.page_no AS page_number,
        cs.para_no AS paragraph_number,
        cs.sem_score AS semantic_score,
        cs.kw_score AS keyword_score,
        cs.combined_rank AS hybrid_score,
        d.document_url
    FROM combined_scores cs
    JOIN legal_documents d ON cs.doc_id = d.id
    ORDER BY d.id, cs.combined_rank DESC
    LIMIT match_count;
END;
$$;

-- Function 3: High-Performance Reciprocal Rank Fusion (RRF) Hybrid Search on Chunks (006_legal_hybrid_search.sql)
CREATE OR REPLACE FUNCTION search_legal_chunks(
    query_embedding extensions.vector(1536),
    query_text TEXT,
    match_count INTEGER DEFAULT 10,
    court_filter TEXT DEFAULT NULL,
    bench_filter TEXT DEFAULT NULL,
    year_filter INTEGER DEFAULT NULL
)
RETURNS TABLE (
    chunk_id UUID,
    document_id UUID,
    title TEXT,
    citation TEXT,
    court_name TEXT,
    bench TEXT,
    judgment_date DATE,
    page_number INTEGER,
    paragraph_number TEXT,
    content TEXT,
    relevance_score DOUBLE PRECISION
)
LANGUAGE SQL
STABLE
AS $$
WITH vector_results AS (
    SELECT
        c.id,
        ROW_NUMBER() OVER (
          ORDER BY c.embedding <=> query_embedding
        ) AS rank_number
    FROM public.legal_document_chunks c
    JOIN public.legal_documents d ON d.id = c.document_id
    WHERE c.embedding IS NOT NULL
      AND d.verification_status = 'verified'
      AND d.publication_status = 'published'
      AND (court_filter IS NULL OR d.court_name = court_filter)
      AND (bench_filter IS NULL OR d.bench = bench_filter)
      AND (year_filter IS NULL OR
           EXTRACT(YEAR FROM d.judgment_date) = year_filter)
    ORDER BY c.embedding <=> query_embedding
    LIMIT LEAST(GREATEST(match_count * 5, 20), 200)
),
text_results AS (
    SELECT
        c.id,
        ROW_NUMBER() OVER (
          ORDER BY ts_rank_cd(
            c.search_tsv,
            websearch_to_tsquery('simple', query_text)
          ) DESC
        ) AS rank_number
    FROM public.legal_document_chunks c
    JOIN public.legal_documents d ON d.id = c.document_id
    WHERE query_text IS NOT NULL
      AND btrim(query_text) <> ''
      AND c.search_tsv @@ websearch_to_tsquery('simple', query_text)
      AND d.verification_status = 'verified'
      AND d.publication_status = 'published'
      AND (court_filter IS NULL OR d.court_name = court_filter)
      AND (bench_filter IS NULL OR d.bench = bench_filter)
      AND (year_filter IS NULL OR
           EXTRACT(YEAR FROM d.judgment_date) = year_filter)
    ORDER BY ts_rank_cd(
      c.search_tsv,
      websearch_to_tsquery('simple', query_text)
    ) DESC
    LIMIT LEAST(GREATEST(match_count * 5, 20), 200)
),
combined AS (
    SELECT id, 1.0 / (60 + rank_number) AS score
    FROM vector_results

    UNION ALL

    SELECT id, 1.0 / (60 + rank_number) AS score
    FROM text_results
),
final_scores AS (
    SELECT id, SUM(score) AS final_score
    FROM combined
    GROUP BY id
)
SELECT
    c.id,
    d.id,
    d.title,
    d.citation,
    d.court_name,
    d.bench,
    d.judgment_date,
    c.page_number,
    c.paragraph_number,
    c.content,
    f.final_score
FROM final_scores f
JOIN public.legal_document_chunks c ON c.id = f.id
JOIN public.legal_documents d ON d.id = c.document_id
ORDER BY f.final_score DESC
LIMIT LEAST(GREATEST(match_count, 1), 50);
$$;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES & ADMINISTRATIVE HELPERS
-- ==============================================================================

-- Administrative Helper Function (007_legal_security.sql)
CREATE OR REPLACE FUNCTION public.is_legal_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'public_admin',
    false
  );
$$;

-- Enable RLS on all tables
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_research_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_document_sources ENABLE ROW LEVEL SECURITY;

-- 8.1 legal_documents Policies
-- Anyone authenticated can view verified legal documents
CREATE POLICY "Allow authenticated users to read verified legal documents"
ON legal_documents FOR SELECT
TO authenticated
USING (verification_status = 'verified' OR auth.jwt() ->> 'role' = 'public_admin');

-- Only public_admin can insert, update or delete legal documents
CREATE POLICY "Allow public_admin to manage legal documents"
ON legal_documents FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'public_admin')
WITH CHECK (auth.jwt() ->> 'role' = 'public_admin');

-- 8.2 legal_document_chunks Policies
CREATE POLICY "Allow authenticated users to read chunks of verified documents"
ON legal_document_chunks FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM legal_documents d
        WHERE d.id = legal_document_chunks.document_id
          AND (d.verification_status = 'verified' OR auth.jwt() ->> 'role' = 'public_admin')
    )
);

CREATE POLICY "Allow public_admin to manage chunks"
ON legal_document_chunks FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'public_admin')
WITH CHECK (auth.jwt() ->> 'role' = 'public_admin');

-- 8.3 legal_research_history Policies
CREATE POLICY "Advocates own their research history"
ON legal_research_history FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 8.4 saved_research Policies
CREATE POLICY "Advocates own their saved research and case notes"
ON saved_research FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 8.5 legal_document_sources Policies
CREATE POLICY "Allow authenticated users to view legal sources"
ON legal_document_sources FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Allow public_admin to manage sources"
ON legal_document_sources FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'public_admin')
WITH CHECK (auth.jwt() ->> 'role' = 'public_admin');

-- 8.6 legal_document_processing Policies
ALTER TABLE legal_document_processing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view processing status"
ON legal_document_processing FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Allow public_admin to manage document processing"
ON legal_document_processing FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'public_admin')
WITH CHECK (auth.jwt() ->> 'role' = 'public_admin');

-- 8.7 legal_ingestion_jobs Policies
ALTER TABLE legal_ingestion_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public_admin to manage ingestion jobs"
ON legal_ingestion_jobs FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'public_admin')
WITH CHECK (auth.jwt() ->> 'role' = 'public_admin');

-- 8.8 legal_document_citations Policies
ALTER TABLE legal_document_citations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read document citations"
ON legal_document_citations FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Allow public_admin to manage document citations"
ON legal_document_citations FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'public_admin')
WITH CHECK (auth.jwt() ->> 'role' = 'public_admin');
