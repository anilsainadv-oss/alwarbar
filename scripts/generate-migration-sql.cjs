const fs = require('fs');
const path = require('path');

const rootDir = 'C:/alwar-advocates';
const dbPath = path.join(rootDir, 'data', 'local-db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

function escapeSqlVal(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return "'{}'::text[]";
    const escapedItems = val.map(v => "'" + String(v).replace(/'/g, "''") + "'");
    return "ARRAY[" + escapedItems.join(', ') + "]::text[]";
  }
  if (typeof val === 'object') {
    return "'" + JSON.stringify(val).replace(/'/g, "''") + "'::jsonb";
  }
  return "'" + String(val).replace(/'/g, "''") + "'";
}

let sql = `-- ==============================================================================
-- 010_complete_precedent_engine_migration.sql
-- COMPLETE ALL-IN-ONE SUPABASE MIGRATION SCRIPT
-- RUN THIS IN SUPABASE DASHBOARD -> SQL EDITOR -> RUN
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
SET search_path TO public, extensions;

-- 2. CREATE HELPER FUNCTION: is_legal_admin
CREATE OR REPLACE FUNCTION public.is_legal_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin',
    false
  );
$$;

-- 3. CREATE TABLE: legal_documents
CREATE TABLE IF NOT EXISTS public.legal_documents (
    id VARCHAR(255) PRIMARY KEY,
    title TEXT NOT NULL,
    case_number TEXT,
    citation TEXT NOT NULL,
    alternate_citations TEXT[] DEFAULT '{}',
    court_name TEXT NOT NULL DEFAULT 'Rajasthan High Court',
    court_level TEXT NOT NULL DEFAULT 'High Court',
    court_code TEXT,
    bench TEXT,
    court_bench TEXT,
    diary_number TEXT,
    judgment_date DATE,
    decision_type TEXT,
    judgment_type TEXT DEFAULT 'Judgment',
    case_type TEXT,
    reportable_status BOOLEAN DEFAULT true,
    judge_names TEXT[] DEFAULT '{}',
    parties TEXT[] DEFAULT '{}',
    petitioner TEXT,
    respondent TEXT,
    advocate_names TEXT[] DEFAULT '{}',
    legal_subjects TEXT[] DEFAULT '{}',
    legal_subject TEXT,
    statutes TEXT[] DEFAULT '{}',
    summary TEXT,
    summary_hi TEXT,
    language TEXT DEFAULT 'English',
    full_text TEXT NOT NULL,
    content_hash TEXT,
    r2_storage_key TEXT,
    pdf_sha256 TEXT,
    ocr_status TEXT DEFAULT 'completed',
    approval_status TEXT NOT NULL DEFAULT 'draft',
    verification_status TEXT NOT NULL DEFAULT 'pending',
    publication_status TEXT NOT NULL DEFAULT 'draft',
    source_type TEXT DEFAULT 'manual',
    source_name TEXT DEFAULT 'Official Court Record',
    source_url TEXT,
    original_source_url TEXT,
    document_url TEXT,
    uploaded_by TEXT,
    verified_by TEXT,
    verified_at TIMESTAMPTZ,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    rejected_by TEXT,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full-Text Search tsvector column on legal_documents
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS fts_tokens tsvector
GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(citation, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(court_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(legal_subject, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(full_text, '')), 'D')
) STORED;

CREATE INDEX IF NOT EXISTS idx_legal_docs_fts ON public.legal_documents USING gin(fts_tokens);
CREATE INDEX IF NOT EXISTS idx_legal_docs_citation ON public.legal_documents(citation);
CREATE INDEX IF NOT EXISTS idx_legal_docs_court_date ON public.legal_documents(court_name, judgment_date DESC);
CREATE INDEX IF NOT EXISTS idx_legal_docs_approval_pub ON public.legal_documents(approval_status, publication_status);
CREATE INDEX IF NOT EXISTS idx_legal_docs_r2_key ON public.legal_documents(r2_storage_key);
CREATE INDEX IF NOT EXISTS idx_legal_docs_sha256 ON public.legal_documents(pdf_sha256);

-- 4. CREATE TABLE: legal_document_chunks
CREATE TABLE IF NOT EXISTS public.legal_document_chunks (
    id VARCHAR(255) PRIMARY KEY,
    document_id VARCHAR(255) NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    page_number INTEGER,
    paragraph_number TEXT,
    token_count INTEGER,
    embedding extensions.vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, chunk_index)
);

ALTER TABLE public.legal_document_chunks ADD COLUMN IF NOT EXISTS search_tsv tsvector
GENERATED ALWAYS AS (
  to_tsvector('simple'::regconfig, COALESCE(content, ''))
) STORED;

CREATE INDEX IF NOT EXISTS idx_legal_chunks_document ON public.legal_document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_legal_chunks_search ON public.legal_document_chunks USING GIN(search_tsv);
CREATE INDEX IF NOT EXISTS idx_legal_chunks_embedding ON public.legal_document_chunks USING hnsw (embedding extensions.vector_cosine_ops);

-- 5. CREATE TABLE: judgment_audit_logs
CREATE TABLE IF NOT EXISTS public.judgment_audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    document_id VARCHAR(255),
    actor_id TEXT,
    actor_name TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    entity_type TEXT DEFAULT 'legal_document',
    entity_id TEXT,
    details JSONB,
    notes TEXT,
    metadata_snapshot JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SUPPORTING TABLES
CREATE TABLE IF NOT EXISTS public.legal_research_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    query TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    retrieved_document_ids TEXT[] DEFAULT '{}',
    model_name VARCHAR(100) DEFAULT 'gpt-4o',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saved_research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    document_id VARCHAR(255) REFERENCES public.legal_documents(id) ON DELETE CASCADE,
    case_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.legal_document_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id VARCHAR(255),
    source_name TEXT NOT NULL,
    source_url TEXT,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    content_hash TEXT,
    file_size_bytes BIGINT
);

CREATE TABLE IF NOT EXISTS public.legal_document_processing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id VARCHAR(255) UNIQUE,
    ocr_status TEXT DEFAULT 'completed',
    extracted_page_count INTEGER,
    confidence_score NUMERIC,
    processing_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.legal_ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL,
    court_code TEXT,
    status TEXT DEFAULT 'completed',
    items_processed INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.legal_document_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id VARCHAR(255),
    cited_document_id VARCHAR(255),
    citation_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RPC FUNCTIONS
CREATE OR REPLACE FUNCTION match_legal_documents(
  query_embedding extensions.vector(1536),
  match_threshold float DEFAULT 0.60,
  match_count int DEFAULT 10,
  filter_criteria jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  document_id VARCHAR(255),
  chunk_id VARCHAR(255),
  similarity float,
  content text,
  page_number int,
  paragraph_number text,
  title text,
  citation text,
  court_name text,
  judgment_date date
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id AS document_id,
    c.id AS chunk_id,
    1 - (c.embedding <=> query_embedding) AS similarity,
    c.content,
    c.page_number,
    c.paragraph_number,
    d.title,
    d.citation,
    d.court_name,
    d.judgment_date
  FROM public.legal_document_chunks c
  JOIN public.legal_documents d ON c.document_id = d.id
  WHERE d.approval_status = 'approved'
    AND d.publication_status = 'published'
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION search_legal_chunks(
  query_embedding extensions.vector(1536),
  query_text text,
  match_count int DEFAULT 10,
  court_filter text DEFAULT NULL,
  bench_filter text DEFAULT NULL,
  year_filter int DEFAULT NULL
)
RETURNS TABLE (
  chunk_id VARCHAR(255),
  document_id VARCHAR(255),
  title text,
  citation text,
  court_name text,
  bench text,
  judgment_date date,
  page_number int,
  paragraph_number text,
  content text,
  relevance_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS chunk_id,
    d.id AS document_id,
    d.title,
    d.citation,
    d.court_name,
    d.bench,
    d.judgment_date,
    c.page_number,
    c.paragraph_number,
    c.content,
    (1 - (c.embedding <=> query_embedding))::float AS relevance_score
  FROM public.legal_document_chunks c
  JOIN public.legal_documents d ON c.document_id = d.id
  WHERE d.approval_status = 'approved'
    AND d.publication_status = 'published'
    AND (court_filter IS NULL OR d.court_name ILIKE '%' || court_filter || '%')
    AND (bench_filter IS NULL OR d.bench ILIKE '%' || bench_filter || '%')
    AND (year_filter IS NULL OR EXTRACT(YEAR FROM d.judgment_date) = year_filter)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 8. ROW LEVEL SECURITY (DOUBLE-LOCK GUARANTEE)
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judgment_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published approved judgments" ON public.legal_documents;
CREATE POLICY "Public read published approved judgments"
ON public.legal_documents
FOR SELECT TO anon, authenticated
USING (
  (publication_status = 'published' AND approval_status = 'approved')
  OR public.is_legal_admin()
);

DROP POLICY IF EXISTS "Public read published approved chunks" ON public.legal_document_chunks;
CREATE POLICY "Public read published approved chunks"
ON public.legal_document_chunks
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.legal_documents d
    WHERE d.id = document_id
      AND d.publication_status = 'published'
      AND d.approval_status = 'approved'
  )
  OR public.is_legal_admin()
);

-- ==============================================================================
-- 9. DATA MIGRATION: 16 JUDGMENT RECORDS
-- ==============================================================================
`;

console.log('Generating document insert statements...');
const docs = db.legal_documents || [];
const docCols = [
  'id', 'title', 'case_number', 'citation', 'alternate_citations',
  'court_name', 'court_level', 'court_code', 'bench', 'court_bench',
  'diary_number', 'judgment_date', 'decision_type', 'judgment_type',
  'case_type', 'reportable_status', 'judge_names', 'parties', 'petitioner',
  'respondent', 'advocate_names', 'legal_subjects', 'legal_subject',
  'statutes', 'summary', 'summary_hi', 'language', 'full_text',
  'content_hash', 'r2_storage_key', 'pdf_sha256', 'ocr_status',
  'approval_status', 'verification_status', 'publication_status',
  'source_type', 'source_name', 'source_url', 'original_source_url',
  'document_url', 'uploaded_by', 'verified_by', 'verified_at',
  'approved_by', 'approved_at', 'rejected_by', 'rejected_at',
  'rejection_reason', 'published_at', 'created_at', 'updated_at'
];

sql += `\n-- 16 Verified Judgments\n`;
docs.forEach(doc => {
  const vals = docCols.map(c => escapeSqlVal(doc[c]));
  sql += `INSERT INTO public.legal_documents (${docCols.join(', ')})\nVALUES (${vals.join(', ')})\nON CONFLICT (id) DO UPDATE SET\n  full_text = EXCLUDED.full_text,\n  summary = EXCLUDED.summary,\n  summary_hi = EXCLUDED.summary_hi,\n  r2_storage_key = EXCLUDED.r2_storage_key,\n  pdf_sha256 = EXCLUDED.pdf_sha256,\n  ocr_status = EXCLUDED.ocr_status,\n  approval_status = EXCLUDED.approval_status,\n  publication_status = EXCLUDED.publication_status,\n  updated_at = NOW();\n\n`;
});

// Chunks
console.log('Generating chunk insert statements...');
const chunks = db.legal_document_chunks || [];
const chunkCols = ['id', 'document_id', 'chunk_index', 'content', 'page_number', 'paragraph_number', 'token_count', 'embedding', 'created_at'];

sql += `\n-- ==============================================================================
-- 10. DATA MIGRATION: 108 AI VECTOR CHUNKS
-- ==============================================================================
`;

chunks.forEach(chunk => {
  let embeddingSql = 'NULL';
  if (Array.isArray(chunk.embedding)) {
    embeddingSql = `'[${chunk.embedding.join(',')}]'::extensions.vector(1536)`;
  }
  const vals = [
    escapeSqlVal(chunk.id),
    escapeSqlVal(chunk.document_id),
    escapeSqlVal(chunk.chunk_index),
    escapeSqlVal(chunk.content),
    escapeSqlVal(chunk.page_number),
    escapeSqlVal(chunk.paragraph_number),
    escapeSqlVal(chunk.token_count),
    embeddingSql,
    escapeSqlVal(chunk.created_at)
  ];
  sql += `INSERT INTO public.legal_document_chunks (${chunkCols.join(', ')})\nVALUES (${vals.join(', ')})\nON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding;\n`;
});

// Audit logs
console.log('Generating audit logs...');
const logs = (db.audit_logs || []).filter(l => l.entity_type === 'legal_document' || l.document_id);
if (logs.length > 0) {
  sql += `\n-- ==============================================================================
-- 11. DATA MIGRATION: ${logs.length} AUDIT LOG RECORDS
-- ==============================================================================
`;
  logs.forEach(l => {
    sql += `INSERT INTO public.judgment_audit_logs (id, document_id, actor_id, actor_name, actor_role, action, entity_type, entity_id, details, notes, metadata_snapshot, created_at)\nVALUES (${escapeSqlVal(l.id)}, ${escapeSqlVal(l.document_id || l.entity_id)}, ${escapeSqlVal(l.actor_id)}, ${escapeSqlVal(l.actor_name)}, ${escapeSqlVal(l.actor_role)}, ${escapeSqlVal(l.action)}, ${escapeSqlVal(l.entity_type)}, ${escapeSqlVal(l.entity_id)}, ${escapeSqlVal(l.details)}, ${escapeSqlVal(l.notes)}, ${escapeSqlVal(l.metadata_snapshot)}, ${escapeSqlVal(l.created_at)})\nON CONFLICT (id) DO NOTHING;\n`;
  });
}

const outputPath = path.join(rootDir, 'migrations', '010_complete_precedent_engine_migration.sql');
fs.writeFileSync(outputPath, sql, 'utf8');
console.log(`✓ Migration SQL script successfully generated at:\n  ${outputPath}`);
console.log(`  File size: ${(Buffer.byteLength(sql) / 1024).toFixed(2)} KB`);
console.log(`  Documents included: ${docs.length}`);
console.log(`  Chunks included: ${chunks.length}`);
console.log(`  Audit logs included: ${logs.length}`);
