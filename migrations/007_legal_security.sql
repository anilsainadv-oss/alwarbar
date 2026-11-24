-- 007_legal_security.sql

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

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_document_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_document_processing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_document_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_research_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_research ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read published verified judgments"
ON public.legal_documents
FOR SELECT TO authenticated
USING (
  (publication_status = 'published'
   AND verification_status = 'verified')
  OR public.is_legal_admin()
);

CREATE POLICY "Admin manages legal documents"
ON public.legal_documents
FOR ALL TO authenticated
USING (public.is_legal_admin())
WITH CHECK (public.is_legal_admin());

CREATE POLICY "Read public judgment chunks"
ON public.legal_document_chunks
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.legal_documents d
    WHERE d.id = document_id
      AND d.publication_status = 'published'
      AND d.verification_status = 'verified'
  )
  OR public.is_legal_admin()
);

CREATE POLICY "Admin manages chunks"
ON public.legal_document_chunks
FOR ALL TO authenticated
USING (public.is_legal_admin())
WITH CHECK (public.is_legal_admin());

CREATE POLICY "Users read own research"
ON public.legal_research_history
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_legal_admin());

CREATE POLICY "Users create own research"
ON public.legal_research_history
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own saved research"
ON public.saved_research
FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.is_legal_admin())
WITH CHECK (user_id = auth.uid() OR public.is_legal_admin());

CREATE POLICY "Admin manages sources"
ON public.legal_document_sources
FOR ALL TO authenticated
USING (public.is_legal_admin())
WITH CHECK (public.is_legal_admin());

CREATE POLICY "Admin manages processing"
ON public.legal_document_processing
FOR ALL TO authenticated
USING (public.is_legal_admin())
WITH CHECK (public.is_legal_admin());

CREATE POLICY "Admin manages citations"
ON public.legal_document_citations
FOR ALL TO authenticated
USING (public.is_legal_admin())
WITH CHECK (public.is_legal_admin());

CREATE POLICY "Admin manages ingestion jobs"
ON public.legal_ingestion_jobs
FOR ALL TO authenticated
USING (public.is_legal_admin())
WITH CHECK (public.is_legal_admin());
