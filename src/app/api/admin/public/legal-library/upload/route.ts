import { NextResponse } from 'next/server';
import { getCurrentUser, assertPublicAdmin } from '@/lib/auth/guards';
import { rateLimiter } from '@/lib/security/rate-limit';
import { ingestAndIndexLegalDocument, type IngestionInput } from '@/lib/legal-research/indexing-pipeline';
import { indexLegalDocumentSchema } from '@/lib/validation/schemas';
import { legalResearchRepository } from '@/lib/db/repositories/legal-research';
import { validatePdfIntegrity } from '@/lib/storage/r2-client';
import { monitorService } from '@/lib/system/monitor-service';
import type { CourtLevel } from '@/types/legal-research';

const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB for admin

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const limitCheck = rateLimiter.check(`admin_doc_index_${user.id}`, 20, 60);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'एडमिन अपलोड दर सीमा पार (Rate limit exceeded: 20 per minute).' },
        { status: 429, headers: { 'Retry-After': String(limitCheck.resetSeconds) } }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    const ingestionInput: IngestionInput = {
      userId: user.id,
      userRole: 'public_admin'
    };

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file && !formData.get('raw_text')) {
        return NextResponse.json(
          { error: 'फ़ाइल या कच्चा पाठ (raw_text) आवश्यक है।' },
          { status: 400 }
        );
      }

      let uploadedPdfSha256: string | undefined;

      if (file) {
        if (file.size <= 0) {
          return NextResponse.json(
            { error: 'अपलोड की गई फ़ाइल खाली है (0 bytes)।' },
            { status: 400 }
          );
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            { error: 'फ़ाइल आकार 30 MB सीमा से अधिक है।' },
            { status: 400 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Strict PDF signature & HTML-rejection check
        const pdfCheck = validatePdfIntegrity(buffer, MAX_FILE_SIZE_BYTES);
        if (!pdfCheck.valid) {
          return NextResponse.json(
            { error: `अमान्य PDF फ़ाइल: ${pdfCheck.error || 'फ़ाइल %PDF- हस्ताक्षर से शुरू नहीं होती (HTML त्रुटि पृष्ठ अस्वीकृत)।'}` },
            { status: 400 }
          );
        }

        uploadedPdfSha256 = pdfCheck.sha256;
        ingestionInput.buffer = buffer;
        ingestionInput.filename = file.name;
        ingestionInput.mimeType = file.type || 'application/pdf';
      }

      if (formData.get('title')) ingestionInput.title = String(formData.get('title'));
      if (formData.get('citation')) ingestionInput.citation = String(formData.get('citation'));
      if (formData.get('diary_number')) ingestionInput.diary_number = String(formData.get('diary_number')).trim();
      if (formData.get('case_number')) ingestionInput.case_number = String(formData.get('case_number')).trim();
      if (formData.get('court_name')) ingestionInput.court_name = String(formData.get('court_name'));
      if (formData.get('court_level')) ingestionInput.court_level = String(formData.get('court_level')) as CourtLevel;
      if (formData.get('judgment_date')) ingestionInput.judgment_date = String(formData.get('judgment_date'));
      if (formData.get('judge_names')) ingestionInput.judge_names = String(formData.get('judge_names'));
      if (formData.get('parties')) ingestionInput.parties = String(formData.get('parties'));
      if (formData.get('legal_subject')) ingestionInput.legal_subject = String(formData.get('legal_subject'));
      if (formData.get('statutes')) ingestionInput.statutes = String(formData.get('statutes'));
      if (formData.get('raw_text')) ingestionInput.rawText = String(formData.get('raw_text'));
      if (formData.get('summary')) ingestionInput.summary = String(formData.get('summary'));
      if (formData.get('document_url')) ingestionInput.document_url = String(formData.get('document_url'));

      // Enforce Duplicate Detection (SHA-256, Citation, Diary Number) before quota/R2/Supabase writes
      const existingDocs = await legalResearchRepository.getDocuments({});
      const normCitation = (ingestionInput.citation || '').toLowerCase().trim();
      const normDiary = (ingestionInput.diary_number || '').toLowerCase().trim();
      const duplicate = existingDocs.find(d => {
        if (uploadedPdfSha256 && d.pdf_sha256 && d.pdf_sha256.toLowerCase() === uploadedPdfSha256.toLowerCase()) {
          return true;
        }
        if (normCitation && d.citation && d.citation.toLowerCase().trim() === normCitation) {
          return true;
        }
        if (normDiary && d.diary_number && d.diary_number.toLowerCase().trim() === normDiary) {
          return true;
        }
        return false;
      });
      if (duplicate) {
        return NextResponse.json(
          {
            error: `Duplicate judgment detected: already exists in repository (ID: ${duplicate.id}, Citation: ${duplicate.citation}).`,
            existingDocumentId: duplicate.id
          },
          { status: 409 }
        );
      }

      if (file) {
        // Storage Quota Safeguard: Prevent uploads when storage is full or reaches emergency limit (95%+)
        const quotaCheck = await monitorService.isUploadAllowed(file.size);
        if (!quotaCheck.allowed) {
          return NextResponse.json(
            { error: quotaCheck.reason || 'भंडारण कोटा पूर्ण हो गया है (Storage quota exceeded). नया दस्तावेज़ अपलोड करने से पूर्व अतिरिक्त कोटा आवंटित करें।' },
            { status: 507 }
          );
        }
      }
    } else {
      const json = await req.json();
      const parseResult = indexLegalDocumentSchema.safeParse(json);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: parseResult.error.errors[0]?.message || 'अमान्य डेटा प्रारूप' },
          { status: 400 }
        );
      }

      const data = parseResult.data;
      if (!data.raw_text) {
        return NextResponse.json(
          { error: 'कच्चा कानूनी पाठ (raw_text) आवश्यक है।' },
          { status: 400 }
        );
      }

      ingestionInput.rawText = data.raw_text;
      ingestionInput.title = data.title;
      ingestionInput.citation = data.citation;
      ingestionInput.alternate_citations = data.alternate_citations;
      ingestionInput.court_level = data.court_level;
      ingestionInput.court_name = data.court_name;
      ingestionInput.judgment_date = data.judgment_date;
      ingestionInput.judge_names = data.judge_names;
      ingestionInput.parties = data.parties;
      ingestionInput.legal_subject = data.legal_subject;
      ingestionInput.statutes = data.statutes;
      ingestionInput.summary = data.summary;
      ingestionInput.document_url = data.document_url;
    }

    const result = await ingestAndIndexLegalDocument(ingestionInput);

    // Audit log (persisted in Supabase judgment_audit_logs)
    await legalResearchRepository.recordAuditLog({
      document_id: result.document.id,
      actor_id: user.id,
      actor_name: user.full_name || user.email,
      actor_role: user.role,
      action: 'INGEST_LEGAL_DOCUMENT',
      performed_by: user.id,
      details: {
        title: result.document.title,
        citation: result.document.citation,
        diary_number: result.document.diary_number || null,
        r2_storage_key: result.document.r2_storage_key || null,
        pdf_sha256: result.document.pdf_sha256 || null,
        chunksIndexed: result.chunksIndexed,
        totalTokens: result.totalTokens
      }
    });

    return NextResponse.json({
      success: true,
      message: 'न्यायिक निर्णय सार्वजनिक कानूनी पुस्तकालय में सफलतापूर्वक अनुक्रमित किया गया',
      document: result.document,
      chunksIndexed: result.chunksIndexed,
      totalTokens: result.totalTokens,
      processingTimeMs: result.processingTimeMs,
      extractedMetadata: result.extractedMetadata
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Admin legal document upload failed';
    const status = message.includes('Unauthorized') || message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
