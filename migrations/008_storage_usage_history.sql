-- 008_storage_usage_history.sql
-- Storage and Database Usage Monitoring Dashboard Schema

CREATE TABLE IF NOT EXISTS public.storage_usage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    storage_bytes BIGINT NOT NULL DEFAULT 0,
    database_bytes BIGINT NOT NULL DEFAULT 0,
    physical_disk_bytes BIGINT,
    
    pdf_count INTEGER NOT NULL DEFAULT 0,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_storage_usage_history_created
ON public.storage_usage_history(created_at DESC);

-- Security: Row Level Security for Storage Usage History
ALTER TABLE public.storage_usage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages storage usage history"
ON public.storage_usage_history
FOR ALL TO authenticated
USING (public.is_legal_admin())
WITH CHECK (public.is_legal_admin());

-- RPC Helper: Safely retrieves table-level PostgreSQL sizes
CREATE OR REPLACE FUNCTION public.get_database_storage_stats()
RETURNS TABLE (
    table_name TEXT,
    row_count BIGINT,
    table_bytes BIGINT,
    index_bytes BIGINT,
    total_bytes BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT
        t.relname::TEXT AS table_name,
        COALESCE(t.n_live_tup, 0)::BIGINT AS row_count,
        pg_relation_size(t.relid)::BIGINT AS table_bytes,
        pg_indexes_size(t.relid)::BIGINT AS index_bytes,
        pg_total_relation_size(t.relid)::BIGINT AS total_bytes
    FROM pg_stat_user_tables t
    ORDER BY pg_total_relation_size(t.relid) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_database_storage_stats() TO authenticated;
