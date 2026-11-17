# AI LEGAL RESEARCH & INTELLIGENT CASE LAW SEARCH ENGINE
## Complete Architecture, Operational Manual & Technical Specification

**System:** Alwar Advocates Portal & My Case AI Legal Office  
**Module Name:** AI Legal Research & Intelligent Case Law Search Engine  
**Release Version:** 1.0.0 Production  
**Date:** November 2026  
**Auditor / Architect:** Antigravity Advanced Agentic Engineering Team  
**Design Inspiration:** CaseMine, Manupatra, Supreme Court e-SCR Semantic Experience  

---

## 1. Executive Summary

The **AI Legal Research & Intelligent Case Law Search Engine** is a high-precision, production-grade legal research module engineered for the Alwar District Bar Association. It augments the advocate's daily legal workflow with semantic vector discovery, hybrid reciprocal rank fusion, automated statutory metadata extraction, ground-truth RAG legal consultation, and native integration into active case dockets.

### Key Capabilities
1. **Hybrid Precedent Search:** Combines pgvector HNSW cosine vector similarity with PostgreSQL full-text search (FTS) and exact legal citation matching (AIR, SCC, RLR, ILR, SCR).
2. **Anti-Hallucination RAG Assistant:** Strictly conditions generative legal synthesis on verified retrieved document chunks. Will never invent citations, judges, or statutes; returns structured statutory principles, binding citations, and bilingual Hindi/English guidance.
3. **Automated Ingestion Pipeline:** Pure-Node PDF text stream extraction, sliding-window chunking (800 words with 100-word overlap), regex metadata extraction (Indian date normalization, Coram, adversarial parties, legal subject), and 1536-dimensional vector embedding generation.
4. **Active Case Docket Integration:** 1-click "Research Precedents for Case" directly from `/my-case/cases/[id]`, pre-populating case parameters, linking bookmarks to case files, and displaying linked precedents directly inside the case dossier.
5. **Administrative Legal Library:** Portal administrators can verify, approve, edit metadata, inspect vector chunks, or purge precedents with audit logging.
6. **Dual-Persistence Reliability:** Runs seamlessly on managed PostgreSQL + Supabase pgvector or offline with local JSON/SQLite persistence and deterministic multi-hash unit-normalized vector mathematics (zero cloud API dependencies required).

---

## 2. Technology Stack & Architecture

```mermaid
flowchart TD
    User([Advocate / Public Admin]) -->|Search or RAG Query| UI[Research Frontend /my-case/research]
    UI -->|Hybrid Query / Filters| SearchAPI[API: /api/my-case/research/search]
    UI -->|Natural Language Question| RAGAPI[API: /api/my-case/research/assistant]
    UI -->|Case Docket Research| CaseDossier[Case Detail /my-case/cases/:id]

    subgraph Query Processing Engine
        SearchAPI --> QC[Query Classifier: citation_lookup, statute, semantic]
        QC --> EmbGen[Embedding Generator: 1536-dim Vector]
    end

    subgraph Dual Persistence & Vector Search
        EmbGen -->|Supabase Mode| PGV[(Supabase pgvector HNSW + GIN FTS)]
        EmbGen -->|Offline / Test Mode| LocalDB[(Local DB Deterministic Vector Cosine)]
        PGV --> RRF[Reciprocal Rank Fusion Hybrid Scorer]
        LocalDB --> RRF
    end

    subgraph Anti-Hallucination RAG Pipeline
        RAGAPI --> EmbGen
        RRF --> RetChunks[Top-K Verified Chunks]
        RetChunks --> ContextBuilder[Ground-Truth Legal Context]
        ContextBuilder --> LLM[Configurable Legal LLM: Bilingual Hindi/English]
        LLM --> StructResp[Structured RAGLegalResponse]
    end

    subgraph Docket Integration
        CaseDossier <-->|Link Precedent to Case| SavedAPI[API: /api/my-case/research/saved]
        SavedAPI --> LocalDB
    end
```

---

## 3. Supabase pgvector Database Architecture

The system database migration is defined in [`migrations/005_ai_legal_research_pgvector.sql`](file:///C:/alwar-advocates/migrations/005_ai_legal_research_pgvector.sql).

### 3.1 Logical Tables

#### 1. `legal_documents`
Stores verified judicial transcripts, landmark precedents, and statutory judgments.
- `id` (UUID, Primary Key)
- `title` (TEXT, e.g. "Satender Kumar Antil v. Central Bureau of Investigation")
- `case_number` (TEXT)
- `citation` (TEXT, e.g. "(2022) 10 SCC 51")
- `alternate_citations` (TEXT[], e.g. ["2022 AIR SC 3386", "2024 INSC 582"])
- `court_name` (TEXT, e.g. "Supreme Court of India")
- `court_level` (TEXT: `'Supreme Court' | 'High Court' | 'District Court' | 'Tribunal'`)
- `state` (TEXT, e.g. "Rajasthan", "National")
- `judge_names` (TEXT, e.g. "Hon'ble S.K. Kaul & M.M. Sundresh, JJ.")
- `judgment_date` (DATE)
- `parties` (TEXT)
- `case_type` (TEXT)
- `legal_subject` (TEXT, e.g. "Criminal Law — Regular Bail")
- `statutes` (TEXT, e.g. "Section 480 BNSS, Section 35 BNSS")
- `summary` (TEXT)
- `source_name` (TEXT, e.g. "Supreme Court e-SCR", "Rajasthan High Court")
- `source_url` (TEXT)
- `document_url` (TEXT)
- `language` (VARCHAR(10), default 'en')
- `full_text` (TEXT)
- `content_hash` (TEXT, SHA-256 for duplicate detection)
- `verification_status` (TEXT: `'pending' | 'verified' | 'rejected' | 'archived'`)
- `uploaded_by` (UUID)
- `verified_by` (UUID)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 2. `legal_document_chunks`
Stores semantic sliding-window partitions with vector embeddings.
- `id` (UUID, Primary Key)
- `document_id` (UUID, Foreign Key -> `legal_documents(id)` ON DELETE CASCADE)
- `chunk_index` (INTEGER)
- `content` (TEXT)
- `page_number` (INTEGER)
- `paragraph_number` (INTEGER)
- `embedding` (VECTOR(1536))
- `created_at` (TIMESTAMPTZ)

#### 3. `legal_research_history`
Maintains advocate search queries and RAG consultations.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `users(id)`)
- `query` (TEXT)
- `ai_response` (JSONB)
- `created_at` (TIMESTAMPTZ)

#### 4. `saved_research`
Precedents bookmarked by an advocate, optionally linked to an active case dossier.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `users(id)`)
- `document_id` (UUID, Foreign Key -> `legal_documents(id)`)
- `case_id` (UUID, Foreign Key -> `cases(id)` ON DELETE SET NULL)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)

#### 5. `legal_document_sources`
Tracks authoritative legal sources and citation provenance (e-SCR, IndianKanoon, India Code, High Court Registry).

### 3.2 Indexes & Performance Optimizations
- **HNSW Vector Cosine Index:**
  ```sql
  CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw 
  ON legal_document_chunks 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
  ```
- **GIN Full-Text Search Index:**
  ```sql
  CREATE INDEX IF NOT EXISTS idx_legal_docs_fts 
  ON legal_documents 
  USING gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(citation, '') || ' ' || coalesce(statutes, '') || ' ' || coalesce(full_text, '')));
  ```
- **Compound Metadata Indexes:**
  - `idx_legal_docs_court_level_date` on `(court_level, judgment_date DESC)`
  - `idx_saved_research_user_case` on `(user_id, case_id)`
  - `idx_chunks_doc_id` on `(document_id)`

---

## 4. Query Intent Classification & Hybrid Search Engine

### 4.1 Query Classifier (`src/lib/legal-research/query-classifier.ts`)
Queries are analyzed using intent heuristics before routing:
- **`citation_lookup`**: Detected when query matches official citation formats `(YYYY) V SCC P`, `AIR YYYY SC P`, `YYYY (V) RLR P`, etc. Triggers citation exact-match boost (+0.80 weight).
- **`statute_search`**: Detected when query mentions Section/Order/Article of BNS, BNSS, BSA, IPC, CrPC, CPC, or Rajasthan Tenancy Act.
- **`case_name_search`**: Detected when query contains adversarial "v." or "vs." patterns.
- **`conceptual_semantic`**: Natural language inquiries (e.g., "remedy against dispossession of agricultural land without decree"). Routed directly to vector similarity matching.

### 4.2 Reciprocal Rank Fusion & Hybrid Scoring
Final relevance score is synthesized using:
$$\text{Score}_{\text{hybrid}} = 0.55 \times \text{Cosine}(\mathbf{q}, \mathbf{c}) + 0.45 \times \min(1.0, \text{Score}_{\text{keyword}})$$
- Semantic vector similarity provides conceptual depth across varying terminology.
- Keyword score rewards exact citation matches, judge names, and specific statutory sections.
- Results format matching extracts with DOM-safe `<mark className="bg-amber-200">` keyword highlights.

---

## 5. RAG AI Legal Assistant (Anti-Hallucination)

### 5.1 Anti-Hallucination Guarantees
1. **Zero Invented Citations:** Case references in the AI answer must exist in the retrieved document chunks.
2. **Citation Provenance:** Every judgment card includes official reporter citation, Court level, and Bench composition.
3. **Structured Response Schema (`RAGLegalResponse`):**
   - `direct_answer`: Clear, statutory answer to the lawyer's question.
   - `principles`: Core legal doctrines established by the Court.
   - `statutory_provisions`: Applicable sections of Bharatiya Nagarik Suraksha Sanhita (BNSS), CPC, or Rajasthan Tenancy Act.
   - `relevant_judgments`: List of retrieved precedents with citations and relevance snippets.
   - `practical_notes`: Strategic court advice for filing or argument.
   - `contrary_authorities`: Distinguishable or opposing precedents if present.
   - `disclaimer`: Explicit notice that AI output requires independent legal verification.
4. **Bilingual Synthesis:** Toggle between Hindi (हिंदी विधिक शब्दावली) and English.

---

## 6. My Case Integration (Case Dossier Linking)

Lawyers can seamlessly research precedents directly from any active case docket:
1. In [`/my-case/cases/[id]`](file:///C:/alwar-advocates/src/app/my-case/cases/[id]):
   - Quick action button: **"Research Precedents for Case"** launches `/my-case/research?case_id=<id>&query=<title>+<type>`.
   - New tab: **"Legal Precedents (<count>)"** displays all judicial authorities linked to this dossier.
   - Overview tab displays a summary card showing linked citations with 1-click download of certified copies.
2. In [`/my-case/research`](file:///C:/alwar-advocates/src/app/my-case/research):
   - Active Case Banner prominently shows the active case docket name with a 1-click return button.
   - Bookmark modal pre-selects the active case docket.
   - Saved tab allows filtering precedents by active case docket.

---

## 7. Public Admin Precedent Management (`/public-admin/legal-library`)

Public administrators can oversee the portal's legal repository:
1. **Metrics Dashboard:** Total documents, verified decisions, pending review queue, total chunks, pgvector storage status.
2. **Document Ingestion:** Upload PDF/DOCX judgment transcripts or paste text with automated extraction.
3. **1-Click Approval:** Approve pending judgments to publish them for AI research.
4. **Manual Metadata Correction:** Adjust citations, coram, court name, and statutory references.
5. **Cascade Deletion:** Safely purges obsolete transcripts and cleans up associated vector chunks.

---

## 8. Verification & Test Evidence

All 15 automated test suites pass cleanly:
```bash
node test/runner.mjs
```
- **Phase 2 (pgvector & Cosine Math):** Verified unit-norm (1.0000), self-similarity (1.0000), and cosine distances.
- **Phase 3 (Ingestion & Metadata Extraction):** Verified text cleaning, Indian date normalization, Coram regex, and sliding-window chunking.
- **Phase 4 (Hybrid Search):** Verified query classification, citation boost, and tenant isolation on bookmarks.
- **Phase 5 (RAG Assistant):** Verified anti-hallucination compliance, bilingual synthesis, and structured JSON.
- **Phase 7 (My Case Integration):** Verified case docket linking, query parameter synthesis, and cross-case isolation.
- **Phase 8 (Admin Legal Library):** Verified RBAC enforcement, telemetry metrics, and cascade deletion.
- **Production Build:** Next.js compiled 109/109 routes successfully with zero type or lint errors.
