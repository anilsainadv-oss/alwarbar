# Alwar Advocates Portal & My Case AI Legal Office

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1-black.svg)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](LICENSE)

A modern, bilingual, secure legal technology platform uniting public legal information, an advocate community forum, and a private AI-powered legal office for advocates in Alwar, Rajasthan.

---

## 🏛️ Platform Architecture

The system consists of three connected yet strictly partitioned functional zones:

1. **Public Legal Information Portal**:
   - Central & Rajasthan State Acts, Amendments, and Notifications
   - Supreme Court & Rajasthan High Court Verified Judgments
   - Rajasthan Advocates Welfare Fund official schemes & application checklists
   - Verified Advocate Directory with enrollment status
   - Downloadable standard court forms & practical litigation guides
   - Court notices, training workshops, and CLE seminars

2. **Advocates Forum**:
   - Professional discussion community across civil, criminal, revenue, and procedural law
   - Topic tagging, upvoting, accepted answer markers, and bookmarking
   - Dedicated Hindi and English discussion threads
   - Spam control and moderator review workflows

3. **My Case — Private AI Legal Office**:
   - Secure advocate case management (CNR tracking, parties, case stages)
   - Encrypted case document vault with private access controls
   - Hearing diary & daily cause list tracker
   - Confidential client records and billing/fee ledger
   - AI Case File Analyzer (fact chronology, key legal issues, missing evidence checks)
   - AI Legal Research with verified statutory grounding
   - AI Drafting Studio (Legal notices, bail applications, written statements, affidavits)

4. **Dual Administrative Panels**:
   - **Public Portal Admin** (`/public-admin`): Curates public information, manages directory verifications, and moderates forum posts.
   - **My Case Service Admin** (`/case-admin`): Manages system health, storage quotas, and accounts **with zero access to private case documents or client data**.

---

## 🚀 Quick Start on Windows

```powershell
# Navigate to directory
cd C:\alwar-advocates

# Install dependencies (already installed)
npm install

# Run automated security and functionality tests
npm test

# Run local development server
npm run dev
```

Visit:
- **Public Portal**: `http://localhost:3000`
- **My Case Legal Office**: `http://localhost:3000/my-case`
- **Public Admin Panel**: `http://localhost:3000/public-admin/login`
- **Case Service Admin**: `http://localhost:3000/case-admin/login`

---

## 🛡️ Security & Zero-Knowledge Guarantee

- Multi-tenant data isolation: all case files and client entries strictly bound to `advocate_id`.
- Complete Supabase Row-Level Security (RLS) policies in `migrations/002_rls_security_policies.sql`.
- Provider-agnostic AI layer with honest demo fallback when no API key is configured.
- Fully bilingual interface (Hindi / English) toggleable at runtime.

---

## 📖 Detailed Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [Database Schema & Migrations](docs/DATABASE_SCHEMA.md)
- [Security & Access Control](docs/SECURITY.md)
- [Windows Development Setup](docs/SETUP_WINDOWS.md)
- [Two Admin Panels Guide](docs/ADMIN_GUIDE.md)
- [AI Integration & RAG Engine](docs/AI_INTEGRATION.md)
- [Production Deployment Guide](docs/DEPLOYMENT.md)
- [Feature Verification Checklist](docs/FEATURE_CHECKLIST.md)
