import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/guards';
import { readBinaryDocument, verifySignedDownloadToken } from '@/lib/storage/document-storage';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');
    const token = searchParams.get('token');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required.' }, { status: 400 });
    }

    let authorizedAdvocateId: string | null = null;

    // 1. Check session cookie
    const user = await getCurrentUser();
    if (user) {
      // ZERO-KNOWLEDGE BARRIER: Case Admin is barred from confidential documents
      if (user.role === 'case_admin') {
        return NextResponse.json(
          { error: 'FORBIDDEN: Case administrators are barred from accessing confidential case files.' },
          { status: 403 }
        );
      }
      authorizedAdvocateId = user.id;
    } else if (token) {
      // 2. Or verify short-lived HMAC signed token
      const tokenPayload = verifySignedDownloadToken(token);
      if (tokenPayload && tokenPayload.documentId === documentId) {
        authorizedAdvocateId = tokenPayload.advocateId;
      }
    }

    if (!authorizedAdvocateId) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED: Valid session or download token required.' },
        { status: 401 }
      );
    }

    // Lookup document strictly within authorized advocate's docket
    const doc = localDb.getCaseDocumentById(authorizedAdvocateId, documentId);
    if (!doc) {
      return NextResponse.json(
        { error: 'Document not found or access denied.' },
        { status: 404 }
      );
    }

    // Read binary file from Supabase Storage or encrypted local vault
    const fileBuffer = await readBinaryDocument(doc.file_path);
    if (!fileBuffer) {
      return NextResponse.json(
        { error: 'File binary not found in storage repository.' },
        { status: 404 }
      );
    }

    const safeTitle = doc.title.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const ext = doc.mime_type === 'application/pdf' ? '.pdf' : '.bin';
    const filename = safeTitle.endsWith(ext) ? safeTitle : `${safeTitle}${ext}`;

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': doc.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Download failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
