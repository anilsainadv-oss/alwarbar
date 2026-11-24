import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { createCaseSchema } from '@/lib/validation/schemas';
import { featureGate } from '@/lib/saas/feature-gate';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const status = searchParams.get('status') || 'ALL';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);

    // Strict tenant isolation: strictly fetch cases owned by this advocate
    let cases = localDb.getCases(user.id);

    if (status !== 'ALL') {
      cases = cases.filter(c => c.status === status);
    }

    if (q) {
      cases = cases.filter(c => 
        (c.case_title && c.case_title.toLowerCase().includes(q)) ||
        (c.case_number && c.case_number.toLowerCase().includes(q)) ||
        (c.cnr_number && c.cnr_number.toLowerCase().includes(q)) ||
        (c.court_name && c.court_name.toLowerCase().includes(q)) ||
        (c.petitioner_parties && c.petitioner_parties.toLowerCase().includes(q)) ||
        (c.respondent_parties && c.respondent_parties.toLowerCase().includes(q))
      );
    }

    const total = cases.length;
    if (limit && limit > 0) {
      const offset = (page - 1) * limit;
      cases = cases.slice(offset, offset + limit);
    }

    return NextResponse.json({
      cases,
      total,
      page,
      limit: limit || total,
      total_pages: limit ? Math.ceil(total / limit) : 1
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

    const body = await req.json();
    const parseResult = createCaseSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid case parameters' },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // SaaS Plan Quota Check
    const quota = featureGate.canCreateCase(user.id);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason }, { status: 403 });
    }

    const newCase = localDb.createCase(user.id, {
      case_title: data.case_title.trim(),
      case_number: data.case_number.trim(),
      court_name: data.court_name.trim(),
      case_type: data.case_type.trim(),
      petitioner_parties: data.petitioner_parties?.trim() || '',
      respondent_parties: data.respondent_parties?.trim() || '',
      cnr_number: data.cnr_number?.trim() || undefined,
      stage_of_case: data.stage_of_case || 'Hearing',
      next_hearing_date: data.next_hearing_date || undefined,
      status: data.status || 'active',
      private_notes: data.notes || undefined,
      client_id: typeof body.client_id === 'string' ? body.client_id : undefined
    });

    return NextResponse.json({ success: true, case: newCase }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create case';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
