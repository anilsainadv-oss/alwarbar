# Security Architecture & Data Protection — Alwar Advocates Portal

## 1. Threat Model & Confidentiality Principle

Advocates in India owe strict legal professional privilege under Section 126 of the Indian Evidence Act, 1872 / Section 132 of the Bharatiya Sakshya Adhiniyam, 2023. Client case files, case strategies, bail drafts, and privileged communications must be safeguarded with defense-in-depth security.

---

## 2. Multi-Tier Security Controls

### A. Strict Data Isolation (Multi-Tenancy)
- Every query accessing private case data, documents, hearings, invoices, or drafts MUST be scoped to the authenticated user ID (`advocate_id = session.user.id`).
- Supabase Row-Level Security (RLS) is enabled on all tables in `migrations/002_rls_security_policies.sql`.
- Direct ID manipulation (IDOR attacks) via URL or API parameters returns an immediate HTTP 403 / 404 response.

### B. Dual Administrator Wall (Zero Knowledge for Case Admin)
- Two distinct administrative tiers exist:
  1. `PUBLIC_ADMIN`: Has access to public portal content, notices, verified directory profiles, and community moderation. Has NO route or token access to `/case-admin` or `/my-case`.
  2. `CASE_ADMIN`: Has operational visibility into system telemetry, tenant account status, AI quota limits, and platform health. **Technically barred from accessing advocate case files, client rosters, documents, or draft text.**
- No "universal impersonation" backdoors exist.

### C. Authentication & Session Security
- Sessions are maintained using `HttpOnly`, `SameSite=Lax`, `Secure` cookies.
- Passwords are encrypted using salted cryptographic hashes.
- Initial admin access requires an explicit one-time bootstrap token (`ADMIN_BOOTSTRAP_TOKEN`) rather than hardcoded default credentials.

### D. File Storage Access Controls
- Private case documents are uploaded to private storage buckets. Public access URLs are strictly disabled.
- Downloads are served only via authenticated server proxy routes that verify advocate ownership before streaming bytes.
- Upload validation checks file extensions (`.pdf`, `.docx`, `.png`, `.jpg`), MIME types, and enforces a maximum file size limit (default: 25 MB).

### E. AI Privacy Boundary
- Case analysis sends only the minimal text context required for the immediate query.
- Prompts and completions are not logged with personally identifiable client identifiers.
- When `AI_PROVIDER="demo"`, the system operates completely offline without transmitting any client data outside the local machine.
