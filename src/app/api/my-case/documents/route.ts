import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { createDocumentSchema } from '@/lib/validation/schemas';
import { 
  validateDocumentUpload, 
  storeBinaryDocument, 
  deleteBinaryDocument 
} from '@/lib/storage/document-storage';
import { featureGate } from '@/lib/saas/feature-gate';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId') || undefined;

    const documents = localDb.getCaseDocuments(user.id, caseId);
    return NextResponse.json({ documents });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const contentType = req.headers.get('content-type') || '';

    // A. MULTIPART BINARY FILE UPLOAD
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const case_id = (formData.get('case_id') as string || '').trim();
      const title = (formData.get('title') as string || '').trim();
      const category = (formData.get('category') as string || 'evidence').trim();

      if (!case_id || !title || !file) {
        return NextResponse.json(
          { error: 'Case ID, document title, and a binary file are required.' },
          { status: 400 }
        );
      }

      // Verify advocate owns the case
      const caseRecord = localDb.getCaseById(user.id, case_id);
      if (!caseRecord) {
        return NextResponse.json({ error: 'Case not found or access denied.' }, { status: 404 });
      }

      // SaaS Storage Quota Check
      const quota = featureGate.canUploadDocument(user.id, file.size);
      if (!quota.allowed) {
        return NextResponse.json({ error: quota.reason }, { status: 403 });
      }

      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const validation = validateDocumentUpload(fileBuffer, file.type, file.name);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error || 'Invalid file.' }, { status: 400 });
      }

      const docId = 'doc-' + crypto.randomUUID();
      const storageResult = await storeBinaryDocument({
        advocateId: user.id,
        caseId: case_id,
        documentId: docId,
        buffer: fileBuffer,
        filename: file.name,
        mimeType: file.type
      });

      const doc = localDb.createCaseDocument(user.id, {
        case_id,
        title,
        category: category as any,
        file_path: storageResult.storagePath,
        file_size_bytes: storageResult.fileSizeBytes,
        mime_type: storageResult.mimeType,
        extracted_text: '',
        page_count: 1,
        ocr_status: 'pending' // STRICT: Never claim completed until OCR actually runs
      });

      return NextResponse.json({ 
        success: true, 
        document: doc,
        storageEngine: storageResult.storageEngine 
      }, { status: 201 });
    }

    // B. JSON METADATA UPLOAD (Fallback / Text Entry)
    const json = await req.json();
    const parseResult = createDocumentSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid document parameters' },
        { status: 400 }
      );
    }

    const { case_id, title, category, file_path, extracted_text } = parseResult.data;

    const caseRecord = localDb.getCaseById(user.id, case_id);
    if (!caseRecord) {
      return NextResponse.json({ error: 'Case not found or access denied.' }, { status: 404 });
    }

    const doc = localDb.createCaseDocument(user.id, {
      case_id,
      title: title.trim(),
      category: category as any,
      file_path: file_path || `/vault/${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`,
      file_size_bytes: 0,
      mime_type: 'application/pdf',
      extracted_text: extracted_text || '',
      page_count: 1,
      ocr_status: 'pending'
    });

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Document ID required' }, { status: 400 });

    const existingDoc = localDb.getCaseDocumentById(user.id, id);
    if (!existingDoc) {
      return NextResponse.json({ error: 'Document not found or delete denied' }, { status: 404 });
    }

    // Clean up binary file from storage
    if (existingDoc.file_path) {
      await deleteBinaryDocument(existingDoc.file_path);
    }

    const deleted = localDb.deleteCaseDocument(user.id, id);
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
