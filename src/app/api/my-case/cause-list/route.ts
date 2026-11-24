import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { causeListRepository } from '@/lib/db/repositories';
import { parseCauseListText } from '@/lib/automation/cause-list-parser';
import { importCauseListSchema } from '@/lib/validation/schemas';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const entries = await causeListRepository.getEntries(user.id, date);
    const matchResult = await causeListRepository.matchToDocket(user.id, date);

    return NextResponse.json({
      date,
      totalEntries: entries.length,
      matchedToDocket: matchResult.matched,
      entries,
      matches: matchResult.matches
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const json = await req.json();
    const parseResult = importCauseListSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid cause list data' },
        { status: 400 }
      );
    }

    const { court_name, judge_name, cause_list_date, raw_text, entries: providedEntries } = parseResult.data;

    let finalEntries: any[] = [];

    if (raw_text && raw_text.trim().length > 0) {
      const parsed = parseCauseListText(raw_text, court_name, cause_list_date);
      finalEntries = parsed.entries;
    } else if (providedEntries && providedEntries.length > 0) {
      finalEntries = providedEntries.map(e => ({
        ...e,
        court_name,
        judge_name,
        cause_list_date
      }));
    } else {
      return NextResponse.json({ error: 'Provide either raw_text or structured entries' }, { status: 400 });
    }

    const saved = await causeListRepository.saveEntries(finalEntries);
    const matches = await causeListRepository.matchToDocket(user.id, cause_list_date);

    return NextResponse.json({
      success: true,
      causeListDate: cause_list_date,
      courtName: court_name,
      importedCount: saved.length,
      matchedCount: matches.matched,
      matches: matches.matches
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
