import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const items = localDb.getPersonalLibrary(user.id);
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { title, category, citation, notes, source_url } = await req.json();
    if (!title || !category) {
      return NextResponse.json({ error: 'Title and category are required' }, { status: 400 });
    }

    const item = localDb.createPersonalLibraryItem(user.id, {
      title: title.trim(),
      category: category.trim(),
      citation: citation ? citation.trim() : undefined,
      notes: notes || undefined,
      source_url: source_url || undefined
    });

    return NextResponse.json({ success: true, item });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save citation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
