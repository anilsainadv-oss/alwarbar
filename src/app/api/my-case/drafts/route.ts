import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const drafts = localDb.getDrafts(user.id);
    return NextResponse.json({ drafts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { case_id, draft_type, title, content_text, language } = await req.json();

    if (!draft_type || !title || !content_text) {
      return NextResponse.json({ error: 'Draft type, title, and content are required.' }, { status: 400 });
    }

    const draft = localDb.createDraft(user.id, {
      case_id: case_id || undefined,
      draft_type,
      title: title.trim(),
      content_text: content_text.trim(),
      language: language || 'en',
      version: 1
    });

    return NextResponse.json({ success: true, draft });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save draft';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { id, content_text, title } = await req.json();
    if (!id || !content_text) {
      return NextResponse.json({ error: 'Draft ID and content required' }, { status: 400 });
    }

    const updated = localDb.updateDraft(user.id, id, content_text, title);
    if (!updated) {
      return NextResponse.json({ error: 'Draft not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, draft: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update draft';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
