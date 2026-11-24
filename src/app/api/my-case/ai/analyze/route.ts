import { NextResponse } from 'next/server';
import { legalAI } from '@/lib/ai/provider';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { rateLimiter } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    // AI rate limiting: 15 queries per minute per advocate
    const limitCheck = rateLimiter.check(`ai_query_${user.id}`, 15, 60);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'AI दर सीमा पार (Rate limit exceeded: 15 queries per minute). कृपया 1 मिनट बाद प्रयास करें।' },
        { status: 429, headers: { 'Retry-After': String(limitCheck.resetSeconds) } }
      );
    }

    const { caseTitle, caseType, court, facts, documentsText } = await req.json();

    if (!facts && !documentsText) {
      return NextResponse.json({ error: 'Case facts or document text is required for AI analysis' }, { status: 400 });
    }

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
