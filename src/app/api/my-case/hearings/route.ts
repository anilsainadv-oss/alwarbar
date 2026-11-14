import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { createHearingSchema } from '@/lib/validation/schemas';

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
    const parseResult = createHearingSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid hearing data' },
        { status: 400 }
      );
    }

    const { case_id, hearing_date, court_room, judge_name, business_recorded, next_action, next_hearing_date } = parseResult.data;

    // Verify advocate owns the case
    const caseRecord = localDb.getCaseById(user.id, case_id);
    if (!caseRecord) {
      return NextResponse.json({ error: 'Case not found or access denied.' }, { status: 404 });
    }

    const hearing = localDb.createHearing(user.id, {
      case_id,
      hearing_date,
      court_room,
      judge_name,
      business_recorded,
      next_action,
      next_hearing_date,
      attended: false
    });

    // Auto-update case next hearing date if provided
    if (next_hearing_date) {
      localDb.updateCase(user.id, case_id, { next_hearing_date });
    }

    return NextResponse.json({ success: true, hearing }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record hearing';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
