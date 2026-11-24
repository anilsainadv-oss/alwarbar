import { NextResponse } from 'next/server';
import { getCurrentUser, assertPublicAdmin } from '@/lib/auth/guards';
import { rateLimiter } from '@/lib/security/rate-limit';
import { ingestAndIndexLegalDocument, type IngestionInput } from '@/lib/legal-research/indexing-pipeline';
import { indexLegalDocumentSchema } from '@/lib/validation/schemas';
import { localDb } from '@/lib/db';
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

      if (file) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            { error: 'फ़ाइल आकार 30 MB सीमा से अधिक है।' },
            { status: 400 }
          );
        }

        // Storage Quota Safeguard: Prevent uploads when storage is full or reaches emergency limit (95%+)
        const quotaCheck = await monitorService.isUploadAllowed(file.size);
        if (!quotaCheck.allowed) {
          return NextResponse.json(
            { error: quotaCheck.reason || 'भंडारण कोटा पूर्ण हो गया है (Storage quota exceeded). नया दस्तावेज़ अपलोड करने से पूर्व अतिरिक्त कोटा आवंटित करें।' },
            { status: 507 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        ingestionInput.buffer = Buffer.from(arrayBuffer);
        ingestionInput.filename = file.name;
        ingestionInput.mimeType = file.type;
      }

      if (formData.get('title')) ingestionInput.title = String(formData.get('title'));
      if (formData.get('citation')) ingestionInput.citation = String(formData.get('citation'));
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

    // Audit log
    localDb.createAuditLog({
      actor_id: user.id,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'INGEST_LEGAL_DOCUMENT',
      entity_type: 'legal_document',
      entity_id: result.document.id,
      details: {
        title: result.document.title,
        citation: result.document.citation,
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
