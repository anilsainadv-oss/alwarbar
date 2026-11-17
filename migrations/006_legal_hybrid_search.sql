-- 006_legal_hybrid_search.sql

CREATE OR REPLACE FUNCTION public.search_legal_chunks(
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
