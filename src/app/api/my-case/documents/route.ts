import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';

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

    const { case_id, title, category, file_path, extracted_text } = await req.json();

    if (!case_id || !title || !category) {
      return NextResponse.json({ error: 'Case ID, title, and category are required.' }, { status: 400 });
    }

    const doc = localDb.createCaseDocument(user.id, {
      case_id,
      title: title.trim(),
      category,
      file_path: file_path || `/vault/${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`,
      file_size_bytes: 512000,
      mime_type: 'application/pdf',
      extracted_text: extracted_text || 'Document uploaded into confidential case vault.',
      page_count: 1,
      ocr_status: 'completed'
    });

    return NextResponse.json({ success: true, document: doc });
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

    const deleted = localDb.deleteCaseDocument(user.id, id);
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
