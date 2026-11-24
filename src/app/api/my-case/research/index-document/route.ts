import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { rateLimiter } from '@/lib/security/rate-limit';
import { ingestAndIndexLegalDocument, type IngestionInput } from '@/lib/legal-research/indexing-pipeline';
import { indexLegalDocumentSchema } from '@/lib/validation/schemas';
import type { CourtLevel } from '@/types/legal-research';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    // Rate limiting: 10 uploads/indexing jobs per minute per user
    const limitCheck = rateLimiter.check(`doc_index_${user.id}`, 10, 60);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'दस्तावेज़ अपलोड दर सीमा पार (Upload rate limit exceeded: 10 per minute). कृपया 1 मिनट प्रतीक्षा करें।' },
        { status: 429, headers: { 'Retry-After': String(limitCheck.resetSeconds) } }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    const ingestionInput: IngestionInput = {
      userId: user.id,
      userRole: user.role
    };

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file && !formData.get('raw_text')) {
        return NextResponse.json(
          { error: 'फ़ाइल या कच्चा पाठ (raw_text) आवश्यक है (File or raw text is required).' },
          { status: 400 }
        );
      }

      if (file) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            { error: 'फ़ाइल आकार 25 MB सीमा से अधिक है (File size exceeds 25 MB limit).' },
            { status: 400 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        ingestionInput.buffer = Buffer.from(arrayBuffer);
        ingestionInput.filename = file.name;
        ingestionInput.mimeType = file.type;
      }

      // Metadata overrides from form fields
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
      // JSON payload
      const json = await req.json();
      const parseResult = indexLegalDocumentSchema.safeParse(json);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: parseResult.error.errors[0]?.message || 'अमान्य डेटा प्रारूप (Invalid data format)' },
          { status: 400 }
        );
      }

      const data = parseResult.data;
      if (!data.raw_text) {
        return NextResponse.json(
          { error: 'कच्चा कानूनी पाठ (raw_text) आवश्यक है (Legal text is required for JSON ingestion).' },
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

    return NextResponse.json({
      success: true,
      message: 'कानूनी दस्तावेज़ सफलतापूर्वक अनुक्रमित किया गया (Legal document ingested and indexed successfully)',
      document: result.document,
      chunksIndexed: result.chunksIndexed,
      totalTokens: result.totalTokens,
      processingTimeMs: result.processingTimeMs,
      extractedMetadata: result.extractedMetadata,
      warnings: result.warnings
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Legal document indexing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
