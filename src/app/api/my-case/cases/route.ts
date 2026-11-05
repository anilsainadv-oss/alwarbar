import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    // Strict tenant isolation: strictly fetch cases owned by this advocate
    const cases = localDb.getCases(user.id);
    return NextResponse.json({ cases });
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
    const { 
      case_title, court_name, case_type, petitioner_parties, 
      respondent_parties, case_number, cnr_number, filing_date, 
      next_hearing_date, stage_of_case, status, private_notes, client_id 
    } = body;

    if (!case_title || !court_name || !case_type || !petitioner_parties || !respondent_parties) {
      return NextResponse.json({ error: 'Case title, court name, type, and parties are required.' }, { status: 400 });
    }

    const newCase = localDb.createCase(user.id, {
      case_title: case_title.trim(),
      court_name: court_name.trim(),
      case_type: case_type.trim(),
      petitioner_parties: petitioner_parties.trim(),
      respondent_parties: respondent_parties.trim(),
      case_number: case_number ? case_number.trim() : undefined,
      cnr_number: cnr_number ? cnr_number.trim() : undefined,
      filing_date: filing_date || undefined,
      next_hearing_date: next_hearing_date || undefined,
      stage_of_case: stage_of_case ? stage_of_case.trim() : 'Preliminary Stage',
      status: status || 'active',
      private_notes: private_notes || undefined,
      client_id: client_id || undefined
    });

    return NextResponse.json({ success: true, case: newCase });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Creation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
