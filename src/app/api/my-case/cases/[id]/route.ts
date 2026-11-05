import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    assertAuthenticated(user);

    // Strict tenant isolation: user can only view their own case
    const caseRecord = localDb.getCaseById(user.id, id);
    if (!caseRecord) {
      return NextResponse.json({ error: 'Case not found or access denied.' }, { status: 404 });
    }

    const documents = localDb.getCaseDocuments(user.id, id);
    const hearings = localDb.getHearings(user.id).filter(h => h.case_id === id);
    const tasks = localDb.getTasks(user.id).filter(t => t.case_id === id);
    const invoices = localDb.getInvoices(user.id).filter(i => i.case_id === id);
    const drafts = localDb.getDrafts(user.id).filter(d => d.case_id === id);

    return NextResponse.json({
      case: caseRecord,
      documents,
      hearings,
      tasks,
      invoices,
      drafts
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const body = await req.json();
    const updated = localDb.updateCase(user.id, id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Case not found or update denied.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, case: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const deleted = localDb.deleteCase(user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: 'Case not found or deletion denied.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
