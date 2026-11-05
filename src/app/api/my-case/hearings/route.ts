import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const hearings = localDb.getHearings(user.id);
    return NextResponse.json({ hearings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const body = await req.json();
    const { case_id, hearing_date, court_room, judge_name, business_recorded, next_action, next_hearing_date } = body;

    if (!case_id || !hearing_date) {
      return NextResponse.json({ error: 'Case ID and hearing date are required.' }, { status: 400 });
    }

    const hearing = localDb.createHearing(user.id, {
      case_id,
      hearing_date,
      court_room: court_room || '',
      judge_name: judge_name || '',
      business_recorded: business_recorded || '',
      next_action: next_action || '',
      next_hearing_date: next_hearing_date || undefined,
      attended: true
    });

    return NextResponse.json({ success: true, hearing });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record hearing';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
