import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { localDb } from '@/lib/db';
import { readBinaryDocument } from '@/lib/storage/document-storage';
import { extractDocumentText } from '@/lib/ai/document-parser';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { documentId } = await req.json();
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const doc = localDb.getCaseDocumentById(user.id, documentId);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Read binary file from vault
    const fileBuffer = await readBinaryDocument(doc.file_path);
    if (!fileBuffer) {
      return NextResponse.json({ error: 'Failed to read document binary from vault' }, { status: 500 });
    }

    const extraction = await extractDocumentText(fileBuffer, doc.mime_type, doc.file_path);

    // Update document record in database
    const s = (localDb as any).ensureLoaded();
    const target = s.case_documents.find((d: any) => d.id === doc.id && d.advocate_id === user.id);
    if (target) {
      target.extracted_text = extraction.text;
      target.page_count = extraction.pageCount;
      target.ocr_status = extraction.ocrStatus;
      (localDb as any).save();
    }

    return NextResponse.json({
      success: true,
      extraction: {
        textLength: extraction.text.length,
        wordCount: extraction.wordCount,
        pageCount: extraction.pageCount,
        method: extraction.method,
        isScanned: extraction.isScanned,
        ocrStatus: extraction.ocrStatus,
        ocrMessage: extraction.ocrMessage
      },
      text: extraction.text
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Text extraction failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
