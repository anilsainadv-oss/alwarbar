import { NextResponse } from 'next/server';
import { legalAI } from '@/lib/ai/provider';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { query, language } = await req.json();
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const research = await legalAI.conductLegalResearch(query, language || 'en');
    return NextResponse.json({ success: true, research });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI Legal Research failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
