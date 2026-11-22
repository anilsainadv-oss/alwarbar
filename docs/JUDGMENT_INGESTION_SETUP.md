# Original Judgment Intake (first implementation)

This implementation adds a real, admin-only original-PDF intake and approval path. It deliberately does **not** claim automatic court scraping. Supreme Court/Rajasthan High Court discovery connectors, OCR/text extraction, embeddings, and scheduled synchronization are not included yet; they must be added only against a confirmed, permitted source/feed.

## 1. Apply database migration

Run `migrations/005_judgment_ingestion.sql` in the Supabase SQL Editor. This creates `judgment_documents`. Public reads are restricted by RLS to records that are both `admin_verified` and `published`. Writes use the server-side service-role key.

## 2. Configure server environment

Add these values to the deployment environment (not to `NEXT_PUBLIC_*` variables):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- optional `MAX_JUDGMENT_PDF_MB=30`

The R2 bucket should remain private. Never commit the real credentials or put them in client-side code.

## 3. Upload and review

Open `/public-admin/judgments` while signed in as a `public_admin`.

The administrator must obtain the original PDF from the official court source (or another source whose use is permitted), enter the case metadata and official HTTPS source URL, and upload the PDF. The server checks the PDF header, size, and SHA-256, stores the exact uploaded bytes in R2, and creates a `pending_review` row. It does not generate or rewrite a court PDF.

The admin must independently compare the PDF and case details with the official source before pressing **I verified original PDF — Approve**. Approval publishes the record. Rejected and pending records are not returned by the public API.

## 4. Endpoints

- `GET /api/admin/judgments` — admin review queue
- `POST /api/admin/judgments` — admin multipart upload (`court`, `case_title`, `case_number`, `judgment_date`, `source_url`, optional `citation`, `file`)
- `PATCH /api/admin/judgments/:id` — approve (`{"action":"approve","confirm_original_pdf":true}`) or reject
- `GET /api/public/judgments` — published and admin-verified metadata only
- `GET /api/public/judgments/:id/pdf` — short-lived signed download redirect for approved original PDF

## 5. Important current limitation

This is the safe manual intake + verification + publication foundation. It does not yet automatically discover or download new judgments from either court, does not bypass CAPTCHA, and does not perform OCR/AI semantic indexing. Do not advertise automatic court synchronization until a real source connector has been implemented and tested with actual new official judgments.
