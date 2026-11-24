import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { legalResearchRepository } from '@/lib/db/repositories/legal-research';
import { z } from 'zod';

const saveResearchSchema = z.object({
  document_id: z.string().min(1, 'Document ID is required'),
  case_id: z.string().optional().nullable(),
  notes: z.string().max(2000).optional()
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('case_id');

    const saved = await legalResearchRepository.getSavedResearch(user.id, caseId);
    return NextResponse.json({ success: true, saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch saved research';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const body = await req.json();
    const validated = saveResearchSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const entry = await legalResearchRepository.saveResearch(
      user.id,
      validated.data.document_id,
      validated.data.case_id,
      validated.data.notes
    );

    return NextResponse.json({
      success: true,
      message: 'निर्णय सफलतापूर्वक सुरक्षित किया गया (Research saved successfully)',
      saved: entry
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save research';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Saved research ID is required' }, { status: 400 });
    }

    const deleted = await legalResearchRepository.deleteSavedResearch(user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: 'Saved research entry not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'सुरक्षित शोध हटा दिया गया' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete saved research';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
