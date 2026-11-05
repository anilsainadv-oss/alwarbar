# Alwar Advocates Portal & My Case AI Legal Office — Architecture Document

## 1. System Overview

**Alwar Advocates Portal** is a modern, bilingual (Hindi/English), secure legal technology platform serving advocates practicing in Alwar, Rajasthan, with architecture designed for statewide and nationwide expansion.

The system is decomposed into three distinct zones:
1. **Public Information Portal**: Unauthenticated and verified legal information, advocate directory, Rajasthan welfare schemes, state & central laws, judgments, official court practice links, court notices, legal forms, and CLE training.
2. **Advocates Forum**: A moderated community forum for professional discussions, procedural inquiries, judgment analysis, and junior-senior advocate mentoring with topic categorization and spam controls.
3. **My Case — Private AI Legal Office**: An encrypted, strictly isolated personal legal practice management workspace for individual advocates. Includes case files, document management, hearing diaries, client notes, invoices, drafting studio, and provider-agnostic AI legal research & case analysis.

Additionally, two physically and logically separate administrative panels govern the portal:
- **Public Portal Admin (`/public-admin/*`)**: Content publication, moderation, welfare updates, advocate directory verification, and site announcements.
- **My Case Admin (`/case-admin/*`)**: Service operations, usage telemetry, account tier management, and system health **without access to confidential advocate case files or client records**.

---

## 2. Directory Structure

```text
c:\alwar-advocates\
├── docs/                      # Technical documentation, guides, and specifications
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── SECURITY.md
│   ├── SETUP_WINDOWS.md
│   ├── DEPLOYMENT.md
│   ├── ADMIN_GUIDE.md
│   ├── AI_INTEGRATION.md
│   └── FEATURE_CHECKLIST.md
├── migrations/                # Version-controlled PostgreSQL / Supabase SQL migrations
│   ├── 001_initial_schema.sql
│   ├── 002_rls_security_policies.sql
│   └── 003_seed_verified_data.sql
├── public/                    # Static assets, legal badges, logos, manifest
├── src/
│   ├── app/                   # Next.js 15 App Router
│   │   ├── (public)/          # Public Portal Routes (layout, pages, resources)
│   │   │   ├── page.tsx       # Public Home
│   │   │   ├── about/
│   │   │   ├── advocates/     # Advocate directory & profiles
│   │   │   ├── bar-association/
│   │   │   ├── welfare/       # Rajasthan Advocates Welfare Fund
│   │   │   ├── laws/          # Central & Rajasthan State Acts
│   │   │   ├── judgments/     # Supreme Court & Rajasthan HC Judgments
│   │   │   ├── court-resources/
│   │   │   ├── notices/
│   │   │   ├── news/
│   │   │   ├── events/
│   │   │   ├── forms/         # Verified downloadable legal templates
│   │   │   ├── training/
│   │   │   ├── jobs/
│   │   │   ├── forum/         # Community Forum
│   │   │   ├── contact/
│   │   │   ├── privacy/
│   │   │   ├── terms/
│   │   │   └── disclaimer/
│   │   ├── auth/              # Authentication routes (login, register, reset)
│   │   ├── public-admin/      # Admin Panel 1: Public Portal Administration
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── advocates/
│   │   │   ├── welfare/
│   │   │   ├── laws/
│   │   │   ├── judgments/
│   │   │   ├── notices/
│   │   │   ├── forms/
│   │   │   ├── forum/
│   │   │   └── audit-logs/
│   │   ├── my-case/           # Module 3: Private AI Legal Office (Secure Advocate Workspace)
│   │   │   ├── dashboard/
│   │   │   ├── cases/         # Case CRUD, timelines, CNR tracking
│   │   │   ├── documents/     # Private document repository & OCR viewer
│   │   │   ├── research/      # AI Retrieval-Augmented Legal Research
│   │   │   ├── drafting/      # AI Legal Drafting Studio (Notices, Petitions, Bail)
│   │   │   ├── diary/         # Daily Cause List & Hearing Diary
│   │   │   ├── tasks/         # Legal Deadlines & Compliance Tasks
│   │   │   ├── clients/       # Confidential Client Directory
│   │   │   ├── billing/       # Fee notes, receipts, outstanding ledger
│   │   │   ├── library/       # Personal legal citations & private templates
│   │   │   ├── ai-assistant/  # Case File Analyzer & Hearing Strategy
│   │   │   └── settings/
│   │   ├── case-admin/        # Admin Panel 2: Technical Service Admin (Zero-Knowledge)
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── accounts/
│   │   │   ├── usage/
│   │   │   ├── security/
│   │   │   └── audit-logs/
│   │   ├── api/               # API routes (REST & Server Actions)
│   │   │   ├── auth/
│   │   │   ├── public/
│   │   │   ├── forum/
│   │   │   ├── my-case/
│   │   │   ├── ai/
│   │   │   └── admin/
│   │   ├── layout.tsx         # Root layout with bilingual provider
│   │   └── globals.css        # Tailwind CSS and design tokens
│   ├── components/            # UI components and widgets
│   │   ├── ui/                # Buttons, Inputs, Cards, Tables, Modals, Badges
│   │   ├── public/            # Public navbar, footer, search bars, hero
│   │   ├── forum/             # Thread cards, reply boxes, moderation tags
│   │   ├── my-case/           # Case cards, timeline viewer, drafting canvas
│   │   └── admin/             # Admin sidebar, data tables, audit inspector
│   ├── lib/                   # Business logic, DB adapters, utilities
│   │   ├── db/                # Unified DB layer: Supabase Client + Local File-backed fallback
│   │   ├── auth/              # Session management, token verification, role policies
│   │   ├── ai/                # Provider-independent AI interface (Gemini / OpenAI / Demo)
│   │   ├── i18n/              # Hindi & English translation dictionaries & hooks
│   │   ├── storage/           # Secure document upload & access control
│   │   └── utils.ts           # Date formatting, legal citation parser, currency formatter
│   └── types/                 # Strict TypeScript models
│       ├── database.ts
│       ├── legal.ts
│       ├── mycase.ts
│       └── forum.ts
├── test/                      # Automated test suite
│   ├── auth.test.mjs
│   ├── security-isolation.test.mjs
│   ├── rls-verification.test.mjs
│   └── runner.mjs
├── .env.example
├── .env.local
├── package.json
└── tsconfig.json
```

---

## 3. Security and Multi-Tenancy Design

1. **Complete Advocate Data Isolation**:
   - Each record in `cases`, `case_documents`, `hearings`, `clients`, `invoices`, `drafts`, and `personal_library` is anchored by a strict foreign key `advocate_id` referencing `users.id`.
   - All server API handlers inspect the authenticated user's session token and enforce `WHERE advocate_id = session.user.id`.
   - Supabase Row-Level Security (RLS) policies enforce this natively at the database engine level.

2. **Dual Administrator Separation**:
   - `PUBLIC_ADMIN`: Role grants permission to mutate public resources, verify directory profiles, and moderate community posts. Denied access to private case endpoints.
   - `CASE_ADMIN`: Role grants access to infrastructure metrics, tenant accounts, and AI quota tracking. **Has zero access to private case documents, client names, or legal draft contents.**

3. **Bilingual Engine**:
   - Built-in lightweight client and server translation system supporting seamless toggling between **Hindi (हिंदी)** and **English**.
   - Preserves legal technical terms, statutory sections, and formal court citations in their authentic statutory formats.
