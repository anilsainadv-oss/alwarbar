# AI Legal Assistant Integration & Retrieval-Augmented Generation (RAG)

## 1. Provider-Agnostic AI Architecture

The legal office module integrates an abstract, provider-independent AI interface located at `src/lib/ai/provider.ts`. This decouples the application from any single commercial AI vendor, enabling free-tier deployment and seamless migration between providers.

Supported Provider Drivers:
- **`demo` (Default)**: Honest offline deterministic fallback mode. Processes legal text using local heuristics, document parsing, and verified statutory structures without external API calls or costs.
- **`gemini`**: Google Gemini API (`gemini-1.5-flash`, `gemini-1.5-pro`) using server-side environment credentials.
- **`openai`**: OpenAI-compatible API (`gpt-4o`, `gpt-4o-mini`).
- **`groq`**: Ultra-fast open-weights inference (Llama 3, Mixtral).
- **`local`**: Self-hosted Ollama or vLLM endpoints.

---

## 2. Ethical Rules & Non-Negotiable AI Directives

1. **Anti-Hallucination Guardrails**:
   - The AI Assistant will **never invent statutory sections, citations, judgment dates, or judicial quotations**.
   - If a legal source cannot be verified in the retrieved passage or index, the response explicitly displays: `[Unverified Reference — Advocate Verification Required]`.
2. **Advocate Disclaimers**:
   - All AI drafting studio outputs, case summaries, and legal research results are clearly labeled as **"AI-Assisted Draft for Advocate Review"**.
   - The advocate maintains sole professional responsibility for legal filings.
3. **Privacy Boundary**:
   - Full case dossiers are never transmitted en bloc. Only relevant text excerpts are dispatched per query.

---

## 3. Configuration

Set the active provider in your `.env.local`:
```env
AI_PROVIDER="gemini" # or "demo", "openai", "groq"
AI_API_KEY="your-api-key-here"
AI_MODEL_NAME="gemini-1.5-flash"
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.2
```

When no API key is provided, the platform automatically switches to **Honest Demo Mode**, displaying a non-intrusive badge that informs the advocate that deterministic local templates are active.
