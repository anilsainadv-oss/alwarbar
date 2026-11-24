# PRODUCTION DEPLOYMENT & OPERATIONS GUIDE

**Application:** Alwar Advocates Portal & My Case AI Legal Office  
**Repository:** `https://github.com/anilsainadv-oss/alwarbar`  
**Target Domain:** `https://alwaradvocates.org`  
**Date:** November 2026  
**Status:** Approved for Production Deployment  

---

## 1. System Requirements & Architecture Overview

The Alwar Advocates Portal is engineered as a hybrid Next.js 15 App Router application with dual-engine persistence (ACID local file persistence for zero-cost immediate operation, and managed PostgreSQL/Supabase for enterprise cloud scale).

### Recommended Production Hardware / Hosting
- **Node.js Runtime:** Node.js v18.17.0+ (Tested on Node.js v24.21.0)
- **Memory:** 1 GB RAM minimum (2 GB RAM recommended)
- **CPU:** 1 vCPU minimum (2 vCPU recommended for concurrent text extraction and DOCX generation)
- **Disk:** 10 GB SSD minimum (scales with document vault storage if hosted locally)
- **Platform Options:**
  1. **Vercel / Cloudflare Pages / AWS Amplify:** Zero-configuration serverless deployment.
  2. **Self-Hosted Linux VPS (Ubuntu 22.04 / 24.04 LTS):** Managed via PM2 and Nginx reverse proxy.
  3. **Docker Container:** Standard multi-stage containerized build.

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env.local` (or configure in your cloud host's secrets manager):

```bash
cp .env.example .env.production
```

### Essential Production Variables

| Variable | Description | Production Requirement |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Canonical public URL | `https://alwaradvocates.org` |
| `NODE_ENV` | Runtime environment | `production` |
| `AUTH_SECRET` | 64-char HMAC signing key | Generate via `openssl rand -hex 32` |
| `SESSION_COOKIE_NAME` | Secure HTTP-only cookie name | `alwar_law_session` |
| `NEXT_PUBLIC_SUPABASE_URL` | Managed PostgreSQL URL | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client API key | Standard anonymous client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key | **STRICTLY SERVER-ONLY** (Never prefix with `NEXT_PUBLIC_`) |
| `STORAGE_BUCKET_PRIVATE_CASES`| Private storage bucket | `private-advocate-cases` (Must be private) |
| `RAZORPAY_KEY_ID` | Razorpay Merchant ID | `rzp_live_...` (or test key `rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | Razorpay API Secret | Server-side only |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature secret | Used for HMAC-SHA256 signature check |
| `AI_PROVIDER` | Legal AI Engine | `demo` (offline free) or `gemini` / `openai` |
| `AI_API_KEY` | Server-only LLM key | Leave empty for 100% free offline demo engine |
| `EMAIL_PROVIDER` | Email delivery service | `simulator` (free) or `resend` / `smtp` |
| `WHATSAPP_PROVIDER` | WhatsApp business API | `simulator` (free) or `meta_cloud` |

---

## 3. Database Setup & PostgreSQL Migration Instructions

### Option A: Managed PostgreSQL / Supabase Setup (Recommended for Cloud)

1. **Create Supabase Project:**
   - Log into [Supabase Dashboard](https://supabase.com) and create a new project in the **AWS Mumbai (`ap-south-1`)** region for lowest latency to Alwar.
2. **Execute Database Migrations:**
   In Supabase SQL Editor, execute the migration scripts located in [`migrations/`](file:///C:/alwar-advocates/migrations/) in sequential order:
   - **Step 1:** [`migrations/000_supabase_complete_setup.sql`](file:///C:/alwar-advocates/migrations/000_supabase_complete_setup.sql) (Initial core extensions, ENUM types, and core tables).
   - **Step 2:** [`migrations/001_initial_schema.sql`](file:///C:/alwar-advocates/migrations/001_initial_schema.sql) (Detailed advocates, cases, and diary structure).
   - **Step 3:** [`migrations/002_rls_security_policies.sql`](file:///C:/alwar-advocates/migrations/002_rls_security_policies.sql) (Enables RLS on sensitive tables: `cases`, `clients`, `case_documents`, `hearing_diary`, `advocate_profiles`, `subscriptions`, and `team_members`).
   - **Step 4:** [`migrations/003_seed_verified_data.sql`](file:///C:/alwar-advocates/migrations/003_seed_verified_data.sql) (Seeds verified statutory acts, landmark precedents, and 18 Taluka Bar Association records).
   - **Step 5:** [`migrations/004_seed_users_and_profiles.sql`](file:///C:/alwar-advocates/migrations/004_seed_users_and_profiles.sql) (Seeds initial administrator and verified advocate accounts with bcrypt password hashes).
   - **Step 6:** [`migrations/005_ai_legal_research_pgvector.sql`](file:///C:/alwar-advocates/migrations/005_ai_legal_research_pgvector.sql) (Enables `vector` extension with schema `extensions`, creates `legal_documents`, `legal_document_chunks` [1536-dim VECTOR], `legal_research_history`, `saved_research`, `legal_document_sources`, HNSW cosine index `idx_chunks_embedding_hnsw`, GIN FTS index `idx_legal_docs_fts`, stored RPC functions `match_legal_documents` & `hybrid_legal_search`, and tenant RLS isolation).
   
   *Alternative single-file execution:*
   Run [`data/backups/migration-seed.sql`](file:///C:/alwar-advocates/data/backups/migration-seed.sql) which bundles the complete schema and seed data into a single transaction.

3. **Verify Row-Level Security (RLS):**
   Execute in SQL Editor:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   ```
   Ensure all tables (`cases`, `clients`, `case_documents`, `hearing_diary`) display `rowsecurity = true`.

### Option B: Local ACID JSON Engine (Zero Cloud Dependencies)

If deploying to a private chamber server or local Linux instance without cloud infrastructure:
- The system automatically reads and writes to [`data/local-db.json`](file:///C:/alwar-advocates/data/local-db.json).
- Atomic write locks and automated timestamps protect file integrity.
- Automated backup snapshots are written to `data/backups/backup-<ISO-date>.json` on every modification cycle.

---

## 4. Supabase Storage & Document Vault Configuration

1. **Create Storage Buckets:**
   - In Supabase Storage, create two buckets:
     1. `public-court-documents` (Public: enabled) — for statutory bare acts, court cause list templates, and notice circulars.
     2. `private-advocate-cases` (**Public: DISABLED / PRIVATE**) — strictly for confidential client evidence, vakalatnamas, and case documents.
2. **Apply Storage RLS Policy:**
   ```sql
   -- Allow advocates to read/upload only within their own advocate_id folder
   CREATE POLICY "Advocates own document storage"
   ON storage.objects FOR ALL
   TO authenticated
   USING (bucket_id = 'private-advocate-cases' AND (storage.foldername(name))[1] = auth.uid()::text);
   ```

---

## 5. Build & Deployment Walkthrough

### Deployment on Self-Hosted Linux VPS (Ubuntu)

```bash
# 1. Update OS packages & install Node.js 22+
sudo apt-get update && sudo apt-get upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git

# 2. Clone repository & install dependencies
git clone https://github.com/anilsainadv-oss/alwarbar.git /var/www/alwar-advocates
cd /var/www/alwar-advocates
npm ci

# 3. Configure production environment
cp .env.example .env.local
nano .env.local # Insert actual secrets

# 4. Execute test suite verification
npm test

# 5. Build Next.js production bundle
npm run build

# 6. Start service with PM2 Process Manager
sudo npm install -g pm2
pm2 start npm --name "alwar-portal" -- start -- -p 3001
pm2 save
pm2 startup
```

### Nginx Reverse Proxy & SSL (Let's Encrypt)

```nginx
# /etc/nginx/sites-available/alwaradvocates.org
server {
    server_name alwaradvocates.org www.alwaradvocates.org;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 30M;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/alwaradvocates.org /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d alwaradvocates.org -d www.alwaradvocates.org
```

---

## 6. Backup, Disaster Recovery & Maintenance

### 1. Automated Local DB Backup Script
To run an instantaneous snapshot backup of the application database:
```bash
node scripts/backup-local-db.mjs
```
Snapshots are written to `data/backups/backup-<TIMESTAMP>.json` with full metadata and SHA-256 integrity verification.

### 2. Scheduled Nightly Cron Backup
Add to root crontab (`sudo crontab -e`):
```cron
0 2 * * * cd /var/www/alwar-advocates && /usr/bin/node scripts/backup-local-db.mjs >> /var/log/alwar-backup.log 2>&1
```

### 3. PostgreSQL Database Backup (If using Supabase/RDS)
```bash
pg_dump -h db.<project-ref>.supabase.co -U postgres -d postgres -F c -b -v -f /var/backups/alwar_pg_$(date +%Y%m%d).dump
```

### 4. Disaster Recovery Restoration Procedure
In the event of hardware failure:
1. Re-deploy the codebase to fresh hardware using `git clone` and `npm ci`.
2. Locate the most recent verified backup file in `data/backups/backup-<TIMESTAMP>.json`.
3. Copy the backup snapshot to active database:
   ```bash
   cp data/backups/backup-2026-11-14T09-20-29-960Z.json data/local-db.json
   ```
4. Verify data integrity by running the test suite:
   ```bash
   npm test
   ```
5. Restart PM2: `pm2 restart alwar-portal`.

---

## 7. Production Go-Live Checklist

- [ ] `NODE_ENV=production` set.
- [ ] `AUTH_SECRET` generated with 64 random hex characters.
- [ ] `ADMIN_BOOTSTRAP_TOKEN` removed or set to a secure single-use string.
- [ ] Supabase service role key kept strictly server-side (not exposed to browser).
- [ ] Supabase storage bucket `private-advocate-cases` set to **Private**.
- [ ] Razorpay webhook endpoint configured with `RAZORPAY_WEBHOOK_SECRET` verification.
- [ ] Custom domain DNS A/CNAME records configured to production IP with active SSL.
- [ ] Nightly backup cron job installed and tested.
- [ ] Verification tests passing (`npm test`).
- [ ] Build succeeds with 0 type errors (`npm run build`).
