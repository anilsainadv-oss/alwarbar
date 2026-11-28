-- ==============================================================================
-- 011_court_sync_checkpoints.sql
-- Production Checkpoint, Discovery Queue, Fencing, Heartbeat & Stored Procedures
-- ==============================================================================

-- 1. Create Persistent Discovery Queue Table
CREATE TABLE IF NOT EXISTS public.court_discovery_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_code VARCHAR(16) NOT NULL,
    diary_number TEXT NOT NULL,
    judgment_date DATE NOT NULL,
    case_number TEXT,
    citation TEXT,
    official_pdf_url TEXT NOT NULL,
    official_viewer_url TEXT,
    raw_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'processing', 'completed', 'duplicate_skipped', 'failed', 'failed_needs_review', 'quarantined')),
      
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    last_error TEXT,
    locked_by UUID,
    lock_generation BIGINT,
    locked_at TIMESTAMPTZ,
    
    -- Foreign key to legal_documents.id (VARCHAR 255)
    document_id VARCHAR(255) REFERENCES public.legal_documents(id) ON DELETE SET NULL,
    job_id UUID REFERENCES public.legal_ingestion_jobs(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_court_diary_date UNIQUE (court_code, diary_number, judgment_date)
);

CREATE INDEX IF NOT EXISTS idx_court_queue_lookup 
ON public.court_discovery_queue(court_code, status, judgment_date ASC);

-- 2. Create Checkpoints Table with Monotonic Fencing Token
CREATE TABLE IF NOT EXISTS public.court_sync_checkpoints (
    court_code VARCHAR(16) PRIMARY KEY,
    court_name TEXT NOT NULL,
    last_sync_attempt_at TIMESTAMPTZ,
    last_successful_sync_at TIMESTAMPTZ,
    last_scanned_judgment_date DATE,
    last_scanned_diary_number TEXT,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    locked_at TIMESTAMPTZ,
    locked_by UUID,
    lock_generation BIGINT NOT NULL DEFAULT 0,
    lease_duration_seconds INT NOT NULL DEFAULT 300,
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    last_error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Row-Level Security: Strictly Service Role Only
ALTER TABLE public.court_discovery_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_sync_checkpoints ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.court_discovery_queue FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.court_sync_checkpoints FROM PUBLIC, anon, authenticated;

GRANT ALL ON public.court_discovery_queue TO service_role;
GRANT ALL ON public.court_sync_checkpoints TO service_role;

-- 4. Atomic Lock Acquisition Function with Row Initialization
CREATE OR REPLACE FUNCTION public.acquire_court_sync_lock(
    p_court_code VARCHAR(16),
    p_court_name TEXT,
    p_worker_id UUID,
    p_lease_seconds INT DEFAULT 300
)
RETURNS TABLE (
    acquired BOOLEAN,
    court_code VARCHAR(16),
    locked_at TIMESTAMPTZ,
    locked_by UUID,
    lock_generation BIGINT,
    last_scanned_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_now TIMESTAMPTZ := pg_catalog.now();
BEGIN
    IF p_court_code IS NULL OR pg_catalog.trim(p_court_code) = '' THEN
        RAISE EXCEPTION 'court_code cannot be null or blank';
    END IF;
    IF p_worker_id IS NULL THEN
        RAISE EXCEPTION 'worker_id cannot be null';
    END IF;
    IF p_lease_seconds IS NULL OR p_lease_seconds < 30 OR p_lease_seconds > 1800 THEN
        RAISE EXCEPTION 'lease_seconds must be between 30 and 1800';
    END IF;

    -- Ensure checkpoint row exists
    INSERT INTO public.court_sync_checkpoints (court_code, court_name, metadata)
    VALUES (p_court_code, COALESCE(p_court_name, p_court_code), '{}'::jsonb)
    ON CONFLICT (court_code) DO NOTHING;

    RETURN QUERY
    UPDATE public.court_sync_checkpoints c
    SET 
        is_locked = true,
        locked_at = v_now,
        locked_by = p_worker_id,
        lock_generation = c.lock_generation + 1,
        lease_duration_seconds = p_lease_seconds,
        updated_at = v_now
    WHERE c.court_code = p_court_code
      AND (
          c.is_locked = false 
          OR c.locked_at < (v_now - (c.lease_duration_seconds || ' seconds')::INTERVAL)
          OR c.locked_at IS NULL
      )
    RETURNING 
        true AS acquired,
        c.court_code,
        c.locked_at,
        c.locked_by,
        c.lock_generation,
        c.last_scanned_judgment_date;
END;
$$;

-- 5. Atomic Lock Renewal (Heartbeat) Function
CREATE OR REPLACE FUNCTION public.renew_court_sync_lock(
    p_court_code VARCHAR(16),
    p_worker_id UUID,
    p_lock_generation BIGINT,
    p_additional_seconds INT DEFAULT 300
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_now TIMESTAMPTZ := pg_catalog.now();
    v_renewed BOOLEAN;
BEGIN
    IF p_court_code IS NULL OR pg_catalog.trim(p_court_code) = '' THEN
        RAISE EXCEPTION 'court_code cannot be null or blank';
    END IF;
    IF p_worker_id IS NULL THEN
        RAISE EXCEPTION 'worker_id cannot be null';
    END IF;
    IF p_lock_generation IS NULL OR p_lock_generation <= 0 THEN
        RAISE EXCEPTION 'lock_generation must be a positive integer';
    END IF;
    IF p_additional_seconds IS NULL OR p_additional_seconds < 30 OR p_additional_seconds > 1800 THEN
        RAISE EXCEPTION 'additional lease seconds must be between 30 and 1800';
    END IF;

    UPDATE public.court_sync_checkpoints c
    SET 
        locked_at = v_now,
        lease_duration_seconds = p_additional_seconds,
        updated_at = v_now
    WHERE c.court_code = p_court_code
      AND c.locked_by = p_worker_id
      AND c.lock_generation = p_lock_generation
      AND c.is_locked = true
      AND c.locked_at >= (v_now - (c.lease_duration_seconds || ' seconds')::INTERVAL);

    v_renewed := FOUND;
    RETURN v_renewed;
END;
$$;

-- 6. Atomic Queue Batch Claim & Targeted Recovery
CREATE OR REPLACE FUNCTION public.claim_discovery_queue_batch(
    p_court_code VARCHAR(16),
    p_worker_id UUID,
    p_lock_generation BIGINT,
    p_batch_size INT DEFAULT 5,
    p_lease_seconds INT DEFAULT 300
)
RETURNS TABLE (
    id UUID,
    court_code VARCHAR(16),
    diary_number TEXT,
    judgment_date DATE,
    case_number TEXT,
    citation TEXT,
    official_pdf_url TEXT,
    official_viewer_url TEXT,
    raw_metadata JSONB,
    retry_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_now TIMESTAMPTZ := pg_catalog.now();
    v_stale_threshold TIMESTAMPTZ := v_now - (p_lease_seconds || ' seconds')::INTERVAL;
BEGIN
    IF p_court_code IS NULL OR pg_catalog.trim(p_court_code) = '' THEN
        RAISE EXCEPTION 'court_code cannot be null or blank';
    END IF;
    IF p_worker_id IS NULL THEN
        RAISE EXCEPTION 'worker_id cannot be null';
    END IF;
    IF p_lock_generation IS NULL OR p_lock_generation <= 0 THEN
        RAISE EXCEPTION 'lock_generation must be a positive integer';
    END IF;
    IF p_batch_size IS NULL OR p_batch_size < 1 OR p_batch_size > 50 THEN
        RAISE EXCEPTION 'batch_size must be between 1 and 50';
    END IF;
    IF p_lease_seconds IS NULL OR p_lease_seconds < 30 OR p_lease_seconds > 1800 THEN
        RAISE EXCEPTION 'lease_seconds must be between 30 and 1800';
    END IF;

    -- Strict Checkpoint Verification: Worker must hold active unexpired lock
    IF NOT EXISTS (
        SELECT 1 FROM public.court_sync_checkpoints c
        WHERE c.court_code = p_court_code
          AND c.locked_by = p_worker_id
          AND c.lock_generation = p_lock_generation
          AND c.is_locked = true
          AND c.locked_at >= (v_now - (c.lease_duration_seconds || ' seconds')::INTERVAL)
    ) THEN
        RAISE EXCEPTION 'Worker does not hold the active unexpired court lock';
    END IF;

    RETURN QUERY
    WITH candidate_rows AS (
        SELECT q.id
        FROM public.court_discovery_queue q
        WHERE q.court_code = p_court_code
          AND (
              q.status = 'pending'
              OR (
                  q.status = 'processing'
                  AND (
                      q.locked_at < v_stale_threshold
                      OR q.lock_generation < p_lock_generation
                  )
              )
          )
        ORDER BY q.judgment_date ASC, q.diary_number ASC
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    )
    UPDATE public.court_discovery_queue target
    SET 
        status = 'processing',
        locked_by = p_worker_id,
        lock_generation = p_lock_generation,
        locked_at = v_now,
        updated_at = v_now
    FROM candidate_rows
    WHERE target.id = candidate_rows.id
    RETURNING 
        target.id,
        target.court_code,
        target.diary_number,
        target.judgment_date,
        target.case_number,
        target.citation,
        target.official_pdf_url,
        target.official_viewer_url,
        target.raw_metadata,
        target.retry_count;
END;
$$;

-- 7. Queue Item Heartbeat Function
CREATE OR REPLACE FUNCTION public.renew_queue_item_lease(
    p_queue_id UUID,
    p_court_code VARCHAR(16),
    p_worker_id UUID,
    p_lock_generation BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_now TIMESTAMPTZ := pg_catalog.now();
    v_renewed BOOLEAN;
BEGIN
    IF p_queue_id IS NULL OR p_court_code IS NULL OR p_worker_id IS NULL OR p_lock_generation IS NULL THEN
        RAISE EXCEPTION 'Required parameter is null';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.court_sync_checkpoints c
        WHERE c.court_code = p_court_code
          AND c.locked_by = p_worker_id
          AND c.lock_generation = p_lock_generation
          AND c.is_locked = true
          AND c.locked_at >= (v_now - (c.lease_duration_seconds || ' seconds')::INTERVAL)
    ) THEN
        RETURN false;
    END IF;

    UPDATE public.court_discovery_queue q
    SET 
        locked_at = v_now,
        updated_at = v_now
    WHERE q.id = p_queue_id
      AND q.status = 'processing'
      AND q.locked_by = p_worker_id
      AND q.lock_generation = p_lock_generation;

    v_renewed := FOUND;
    RETURN v_renewed;
END;
$$;

-- 8. Complete Queue Item
CREATE OR REPLACE FUNCTION public.complete_queue_item(
    p_queue_id UUID,
    p_court_code VARCHAR(16),
    p_worker_id UUID,
    p_lock_generation BIGINT,
    p_document_id VARCHAR(255)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_now TIMESTAMPTZ := pg_catalog.now();
    v_updated BOOLEAN;
BEGIN
    IF p_queue_id IS NULL OR p_court_code IS NULL OR p_worker_id IS NULL OR p_lock_generation IS NULL OR p_document_id IS NULL THEN
        RAISE EXCEPTION 'Required parameter is null';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.court_sync_checkpoints c
        WHERE c.court_code = p_court_code
          AND c.locked_by = p_worker_id
          AND c.lock_generation = p_lock_generation
          AND c.is_locked = true
          AND c.locked_at >= (v_now - (c.lease_duration_seconds || ' seconds')::INTERVAL)
    ) THEN
        RETURN false;
    END IF;

    UPDATE public.court_discovery_queue q
    SET 
        status = 'completed',
        document_id = p_document_id,
        locked_by = NULL,
        lock_generation = NULL,
        locked_at = NULL,
        updated_at = v_now
    WHERE q.id = p_queue_id
      AND q.status = 'processing'
      AND q.locked_by = p_worker_id
      AND q.lock_generation = p_lock_generation;

    v_updated := FOUND;
    RETURN v_updated;
END;
$$;

-- 9. Fail Queue Item
CREATE OR REPLACE FUNCTION public.fail_queue_item(
    p_queue_id UUID,
    p_court_code VARCHAR(16),
    p_worker_id UUID,
    p_lock_generation BIGINT,
    p_error TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_now TIMESTAMPTZ := pg_catalog.now();
    v_new_status TEXT;
BEGIN
    IF p_queue_id IS NULL OR p_court_code IS NULL OR p_worker_id IS NULL OR p_lock_generation IS NULL THEN
        RAISE EXCEPTION 'Required parameter is null';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.court_sync_checkpoints c
        WHERE c.court_code = p_court_code
          AND c.locked_by = p_worker_id
          AND c.lock_generation = p_lock_generation
          AND c.is_locked = true
          AND c.locked_at >= (v_now - (c.lease_duration_seconds || ' seconds')::INTERVAL)
    ) THEN
        RETURN 'lease_expired';
    END IF;

    UPDATE public.court_discovery_queue q
    SET 
        retry_count = q.retry_count + 1,
        status = CASE 
            WHEN q.retry_count + 1 >= q.max_retries THEN 'failed_needs_review'
            ELSE 'failed'
        END,
        last_error = p_error,
        locked_by = NULL,
        lock_generation = NULL,
        locked_at = NULL,
        updated_at = v_now
    WHERE q.id = p_queue_id
      AND q.status = 'processing'
      AND q.locked_by = p_worker_id
      AND q.lock_generation = p_lock_generation
    RETURNING q.status INTO v_new_status;

    RETURN v_new_status;
END;
$$;

-- 10. Atomic Lock Release Function
CREATE OR REPLACE FUNCTION public.release_court_sync_lock(
    p_court_code VARCHAR(16),
    p_worker_id UUID,
    p_lock_generation BIGINT,
    p_success BOOLEAN,
    p_new_judgment_date DATE DEFAULT NULL,
    p_new_diary_no TEXT DEFAULT NULL,
    p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_now TIMESTAMPTZ := pg_catalog.now();
    v_released BOOLEAN;
BEGIN
    IF p_court_code IS NULL OR p_worker_id IS NULL OR p_lock_generation IS NULL OR p_success IS NULL THEN
        RAISE EXCEPTION 'Required parameter is null';
    END IF;

    UPDATE public.court_sync_checkpoints c
    SET 
        is_locked = false,
        locked_at = NULL,
        locked_by = NULL,
        last_sync_attempt_at = v_now,
        last_successful_sync_at = CASE WHEN p_success THEN v_now ELSE c.last_successful_sync_at END,
        last_scanned_judgment_date = CASE WHEN p_success AND p_new_judgment_date IS NOT NULL THEN p_new_judgment_date ELSE c.last_scanned_judgment_date END,
        last_scanned_diary_number = CASE WHEN p_success AND p_new_diary_no IS NOT NULL THEN p_new_diary_no ELSE c.last_scanned_diary_number END,
        consecutive_failures = CASE WHEN p_success THEN 0 ELSE c.consecutive_failures + 1 END,
        last_error_message = p_error,
        updated_at = v_now
    WHERE c.court_code = p_court_code
      AND c.locked_by = p_worker_id
      AND c.lock_generation = p_lock_generation
      AND c.is_locked = true
      AND c.locked_at >= (v_now - (c.lease_duration_seconds || ' seconds')::INTERVAL);

    v_released := FOUND;
    RETURN v_released;
END;
$$;

-- 11. RPC Permission Grants: Strictly Service Role Only
REVOKE ALL ON FUNCTION public.acquire_court_sync_lock(VARCHAR, TEXT, UUID, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.renew_court_sync_lock(VARCHAR, UUID, BIGINT, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_discovery_queue_batch(VARCHAR, UUID, BIGINT, INT, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.renew_queue_item_lease(UUID, VARCHAR, UUID, BIGINT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_queue_item(UUID, VARCHAR, UUID, BIGINT, VARCHAR) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_queue_item(UUID, VARCHAR, UUID, BIGINT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_court_sync_lock(VARCHAR, UUID, BIGINT, BOOLEAN, DATE, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.acquire_court_sync_lock(VARCHAR, TEXT, UUID, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.renew_court_sync_lock(VARCHAR, UUID, BIGINT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_discovery_queue_batch(VARCHAR, UUID, BIGINT, INT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.renew_queue_item_lease(UUID, VARCHAR, UUID, BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_queue_item(UUID, VARCHAR, UUID, BIGINT, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_queue_item(UUID, VARCHAR, UUID, BIGINT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_court_sync_lock(VARCHAR, UUID, BIGINT, BOOLEAN, DATE, TEXT, TEXT) TO service_role;

-- 12. Initial Checkpoint Row Seed
INSERT INTO public.court_sync_checkpoints (
    court_code,
    court_name,
    last_sync_attempt_at,
    last_successful_sync_at,
    last_scanned_judgment_date,
    last_scanned_diary_number,
    metadata
) VALUES (
    'INSC',
    'Supreme Court of India',
    NULL,
    NULL,
    NULL,
    NULL,
    '{"source_url": "https://www.sci.gov.in/judgments/", "cron_frequency": "6h", "batch_limit": 5}'::jsonb
) ON CONFLICT (court_code) DO NOTHING;
