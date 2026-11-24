import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { legalResearchRepository } from '@/lib/db/repositories/legal-research';
import { z } from 'zod';

const recordHistorySchema = z.object({
  query: z.string().min(1, 'Query is required'),
  ai_response: z.any()
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20;

    const history = await legalResearchRepository.getHistory(user.id, limit);
    return NextResponse.json({ success: true, history });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch research history';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const body = await req.json();
    const validated = recordHistorySchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Invalid history payload' },
        { status: 400 }
      );
    }

    const entry = await legalResearchRepository.recordHistory(
      user.id,
      validated.data.query,
      validated.data.ai_response
    );

    return NextResponse.json({ success: true, entry });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record research history';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
