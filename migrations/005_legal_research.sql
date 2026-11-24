-- 005_legal_research.sql

CREATE TABLE IF NOT EXISTS public.legal_research_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES auth.users(id),

    query TEXT NOT NULL,
    ai_response TEXT,

    retrieved_document_ids UUID[] DEFAULT '{}',
    model_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saved_research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES auth.users(id),

    document_id UUID NOT NULL
      REFERENCES public.legal_documents(id) ON DELETE CASCADE,

    case_id UUID,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, document_id, case_id)
);
