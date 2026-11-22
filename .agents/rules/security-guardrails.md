---
description: Mandatory security guardrails and confirmation policies for Alwar Advocates Portal
always_on: true
---

# Security Guardrails — Alwar Advocates Portal

1. **Environment Variables & Secrets Protection**:
   - Never print, echo, expose, or commit environment variables or secrets from `.env`, `.env.local`, or process environment.
   - Guard `AUTH_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, and `ADMIN_BOOTSTRAP_TOKEN` against leakage.

2. **File Deletion Safeguard**:
   - Never delete or remove project files or directories without explicit user confirmation.

3. **Database Integrity**:
   - Never drop or truncate database tables without explicit confirmation.
   - Never run destructive production database migrations without explicit user review.

4. **Production Deployments**:
   - Never initiate deployments to production environments without explicit confirmation.

5. **Legal Records & Judgments Approval**:
   - Never publish judgments or legal orders without verified Admin approval.
