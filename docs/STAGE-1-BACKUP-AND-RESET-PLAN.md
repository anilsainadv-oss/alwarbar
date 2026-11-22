# STAGE 1 BACKUP VERIFICATION & STAGE 2 RESET PLAN
**Alwar District & Sessions Bar Association Portal (`alwarbar.in`)**  
**Date:** 21 November 2026  
**Status:** STAGE 1 COMPLETE (VERIFIED) | STAGE 2 AWAITING FINAL CONFIRMATION  

---

## 1. Verified Backup Location

The complete, independent backup has been created and verified on disk at:

```
C:\alwar-advocates\data\backups\final-fresh-reset-2026-11-21\
```

### Complete Inventory of Backup Files

| File / Subfolder | Size | Records / Objects | SHA-256 Hash |
| :--- | :--- | :--- | :--- |
| `backup-manifest.json` | 3,745 B | Full metadata & verification report | `bf4fd8806a14e78ee9dc7cc468816e9d8661d78dcdc46d28ec543580c7442715` |
| `legal_documents.json` | 305,136 B | 16 documents (including full text) | `4b6e889cfa7d61a7f6cdd622dcef9ec302bd66e62c62b9442dd060bf45579ecb` |
| `legal_document_chunks.json` | 1,927,114 B | 108 chunks (including 1536-d vector embeddings) | `b0fd3d3e026d67d25f5d48c467447e80651d6af6773555b23ec1576f2c8e9db3` |
| `judgment_audit_logs.json` | 21,529 B | 30 audit log entries (independent copy) | `467ad25c59db6acf9861798ad53bfe38dcef10fcf72a292f5016a9413920300b` |
| `pdfs/INSC_2026_CRL-A-1945-2026_abe47c9c.pdf` | 21,859 B | Supreme Court Judgment (2026 INSC 485) | `abe47c9cd47ebaa987f85654367cfba47cf7133e7f6a517933bb2645e8644dcf` |
| `pdfs/official-judgments_HCRAJ-JP_2026_CREF-2-2026_2026_RJ_JP_44204_DB_5b6b4b96.pdf` | 383,445 B | Rajasthan HC Judgment (2026:RJ-JP:44204-DB) | `5b6b4b96b90b1d47048312caa754fb6c5a336c216d82fb6f759506465bf14db8` |

**Total Backup Footprint:** 2.54 MB  

---

## 2. Backup Verification & Validation Results

All backup files were read back from disk and independently validated against the live database and Cloudflare R2 bucket:

- **Document Count & IDs:** 16 / 16 exact match.
- **Full Text Preservation:** 100% of 16 records contain their complete text (length 907 to 54,446 characters).
- **Chunk Count & Embeddings:** 108 / 108 chunks preserved. All 108 chunks have non-empty vector embeddings intact.
- **Audit Logs Count:** 30 / 30 audit log entries captured with full timestamps, admin actors, and event JSON payloads.
- **PDF Binary Integrity:**
  - `INSC/2026/CRL-A-1945-2026_abe47c9c.pdf`: Size 21,859 bytes matches R2. Magic bytes `%PDF-` valid. Computed SHA-256 matches both disk copy and Supabase `pdf_sha256` column (`abe47c9c...`).
  - `official-judgments/HCRAJ-JP/2026/CREF-2-2026_2026_RJ_JP_44204_DB_5b6b4b96.pdf`: Size 383,445 bytes matches R2. Magic bytes `%PDF-` valid. Computed SHA-256 matches both disk copy and Supabase `pdf_sha256` column (`5b6b4b96...`).
- **Overall Backup Integrity Status:** **`VERIFIED & RECOVERABLE`**

---

## 3. Exact Deletion List

### A. Supabase Database (`legal_documents` - 16 records)
1. `doc-ravi-kumar-2026-hcraj` | Citation: `2026:RJ-JP:44204-DB`
2. `doc-8a983296-0771-4b37-802c-74fac6082949` | Citation: `2026 (1) WLC (Raj) 214`
3. `doc-daf515fd-1407-41b6-bff2-80bb7a3a5ce6` | Citation: `2026 (1) RLR 488`
4. `doc-8169c79e-407c-4f20-a1d1-b53de1210a62` | Citation: `2026 (1) RajCriC 320`
5. `doc-1cca7d96-278d-48ad-b299-80a80e8cc824` | Citation: `2026 INSC 412`
6. `doc-21cecd00-613e-4d8b-a2d5-f576b066f922` | Citation: `2026 INSC 485`
7. `doc-6a2119b9-218b-4040-a382-97e5465d8e46` | Citation: `2026 (1) WLC (Raj) 512`
8. `doc-47d80f6b-1d3c-4c55-a298-e4c3999efe5e` | Citation: `2026 (1) RLR 602`
9. `doc-b30e825d-b8f7-4491-a727-5a346b44ee46` | Citation: `2026 (1) RajCriC 440`
10. `doc-7e27bb86-fd42-4a07-b10d-4671a45e025d` | Citation: `2026 INSC 520`
11. `doc-b0981ef2-83fa-4384-95b1-1a32410b4764` | Citation: `2026 INSC 560`
12. `doc-bf42ad3c-9a6e-45e7-8d70-ecc96fafe05d` | Citation: `2026:RJ-JP:4812`
13. `doc-94d84764-f1a1-433e-8b56-e35de68cae51` | Citation: `2026:RJ-JP:5194`
14. `doc-1e5fe258-efe4-4a3e-89f2-0bc554e793a2` | Citation: `2026:RJ-JD:6210`
15. `doc-d5512772-6b0e-4741-82f8-9b913508f39e` | Citation: `2026 INSC 492`
16. `doc-8feec317-8c34-4cfb-a8ef-1863d7b67a64` | Citation: `2026 INSC 504`

### B. Supabase Database (`legal_document_chunks` - 108 records)
- All 108 chunks mapped to the 16 document IDs above.

### C. Cloudflare R2 Bucket (`alwar-advocates-judgements` - 2 PDF Objects)
1. `INSC/2026/CRL-A-1945-2026_abe47c9c.pdf` (21,859 bytes)
2. `official-judgments/HCRAJ-JP/2026/CREF-2-2026_2026_RJ_JP_44204_DB_5b6b4b96.pdf` (383,445 bytes)

### D. Local JSON Fallback (`data/local-db.json`)
The following judgment-specific arrays will be emptied:
- `legal_documents` (16 entries → `[]`)
- `legal_document_chunks` (108 entries → `[]`)
- `legal_document_sources` (18 test entries → `[]`)
- `legal_document_processing` (15 test entries → `[]`)
- `legal_ingestion_jobs` (6 test entries → `[]`)
- `legal_document_citations` (9 test entries → `[]`)

---

## 4. Foreign-Key Impact & Deletion Order

1. **`legal_document_chunks` -> `legal_documents`**:
   - `legal_document_chunks` references `legal_documents(id)`.
   - **Order:** We will explicitly delete all records in `legal_document_chunks` first, followed by `legal_documents`.
2. **`judgment_audit_logs` -> `legal_documents`**:
   - Live database inspection confirms that historical audit entries for previously deleted documents (`doc-47aef5a3...`, `doc-bulk-...`, `bulk`) still exist without errors.
   - **`judgment_audit_logs` will NOT be deleted.** All 30 audit log records remain strictly intact in Supabase and in the local backup.
3. **No External Table Dependencies**:
   - Tables such as `cases`, `case_documents`, `advocates`, `admin_users`, `welfare_records`, `laws`, `notices_events`, and `forum_*` do not reference `legal_documents`. Zero foreign-key violations will occur.

---

## 5. Exact SQL & R2 Operations Proposed

### Step 1: Supabase Deletion (via Service Role API or SQL)
```sql
-- Phase A: Delete all vector chunks
DELETE FROM public.legal_document_chunks
WHERE document_id IN (
  'doc-ravi-kumar-2026-hcraj',
  'doc-8a983296-0771-4b37-802c-74fac6082949',
  'doc-daf515fd-1407-41b6-bff2-80bb7a3a5ce6',
  'doc-8169c79e-407c-4f20-a1d1-b53de1210a62',
  'doc-1cca7d96-278d-48ad-b299-80a80e8cc824',
  'doc-21cecd00-613e-4d8b-a2d5-f576b066f922',
  'doc-6a2119b9-218b-4040-a382-97e5465d8e46',
  'doc-47d80f6b-1d3c-4c55-a298-e4c3999efe5e',
  'doc-b30e825d-b8f7-4491-a727-5a346b44ee46',
  'doc-7e27bb86-fd42-4a07-b10d-4671a45e025d',
  'doc-b0981ef2-83fa-4384-95b1-1a32410b4764',
  'doc-bf42ad3c-9a6e-45e7-8d70-ecc96fafe05d',
  'doc-94d84764-f1a1-433e-8b56-e35de68cae51',
  'doc-1e5fe258-efe4-4a3e-89f2-0bc554e793a2',
  'doc-d5512772-6b0e-4741-82f8-9b913508f39e',
  'doc-8feec317-8c34-4cfb-a8ef-1863d7b67a64'
);

-- Phase B: Delete all 16 legal documents
DELETE FROM public.legal_documents
WHERE id IN (
  'doc-ravi-kumar-2026-hcraj',
  'doc-8a983296-0771-4b37-802c-74fac6082949',
  'doc-daf515fd-1407-41b6-bff2-80bb7a3a5ce6',
  'doc-8169c79e-407c-4f20-a1d1-b53de1210a62',
  'doc-1cca7d96-278d-48ad-b299-80a80e8cc824',
  'doc-21cecd00-613e-4d8b-a2d5-f576b066f922',
  'doc-6a2119b9-218b-4040-a382-97e5465d8e46',
  'doc-47d80f6b-1d3c-4c55-a298-e4c3999efe5e',
  'doc-b30e825d-b8f7-4491-a727-5a346b44ee46',
  'doc-7e27bb86-fd42-4a07-b10d-4671a45e025d',
  'doc-b0981ef2-83fa-4384-95b1-1a32410b4764',
  'doc-bf42ad3c-9a6e-45e7-8d70-ecc96fafe05d',
  'doc-94d84764-f1a1-433e-8b56-e35de68cae51',
  'doc-1e5fe258-efe4-4a3e-89f2-0bc554e793a2',
  'doc-d5512772-6b0e-4741-82f8-9b913508f39e',
  'doc-8feec317-8c34-4cfb-a8ef-1863d7b67a64'
);
```

### Step 2: Cloudflare R2 Deletion (via AWS SDK `DeleteObjectsCommand`)
```javascript
await r2.send(new DeleteObjectsCommand({
  Bucket: 'alwar-advocates-judgements',
  Delete: {
    Objects: [
      { Key: 'INSC/2026/CRL-A-1945-2026_abe47c9c.pdf' },
      { Key: 'official-judgments/HCRAJ-JP/2026/CREF-2-2026_2026_RJ_JP_44204_DB_5b6b4b96.pdf' }
    ],
    Quiet: false
  }
}));
```

---

## 6. Confirmation: What Remains Untouched

| Application Area | Table / Key | Protection Status |
| :--- | :--- | :--- |
| **Audit Logs** | `public.judgment_audit_logs` (Supabase) | **Preserved 100% (all 30 logs)** |
| **Database Schema** | Tables, triggers, indexes, pgvector extension | **Preserved 100% (unaltered)** |
| **User & Admin Accounts** | `users`, `advocate_profiles`, `admin_users` | **Preserved 100%** |
| **Advocate Cases (My Cases)** | `cases`, `case_documents`, `case_hearings`, `tasks`, `clients` | **Preserved 100%** |
| **Bar Welfare & Schemes** | `welfare_schemes`, `welfare_bulletins`, `welfare_records` | **Preserved 100%** |
| **Bar Forum & Updates** | `legal_updates`, `legal_forms`, `notices_events`, `forum_*` | **Preserved 100%** |
| **Cloudflare Storage Config** | R2 bucket permissions, API keys, credentials | **Preserved 100%** |
| **Portal Front-End / UI** | Entire Next.js portal and admin routing | **Preserved 100%** |

---

*Stage 1 is complete and verified. No deletions have been performed. Awaiting your explicit confirmation to proceed with Stage 2 execution.*
