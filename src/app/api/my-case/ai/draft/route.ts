import { NextResponse } from 'next/server';
import { legalAI } from '@/lib/ai/provider';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { aiDraftSchema } from '@/lib/validation/schemas';
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

    const json = await req.json();
    const parseResult = aiDraftSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid draft parameters' },
        { status: 400 }
      );
    }

    const { draftType, caseTitle, courtName, parties, facts, language } = parseResult.data;

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
