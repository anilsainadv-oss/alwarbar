import { NextResponse } from 'next/server';
import { legalAI } from '@/lib/ai/provider';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { caseTitle, caseType, court, facts, documentsText } = await req.json();

    const analysis = await legalAI.analyzeCaseFile(
      caseTitle || 'Litigation Dossier',
      caseType || 'Trial Matter',
      court || 'District Court, Alwar',
      facts || '',
      documentsText || ''
    );

    return NextResponse.json({ success: true, analysis });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
