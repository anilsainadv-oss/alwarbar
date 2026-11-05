import { NextResponse } from 'next/server';
import { legalAI } from '@/lib/ai/provider';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { draftType, caseTitle, courtName, parties, facts, language } = await req.json();

    if (!draftType) {
      return NextResponse.json({ error: 'Draft type is required' }, { status: 400 });
    }

    const draft = await legalAI.generateDraft(
      draftType,
      caseTitle || 'Standard Matter',
      courtName || 'Competent Court, Alwar',
      parties || { petitioner: '', respondent: '' },
      facts || '',
      language || 'en'
    );

    return NextResponse.json({ success: true, draft });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Draft generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
