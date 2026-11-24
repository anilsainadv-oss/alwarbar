import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { updateCaseSchema } from '@/lib/validation/schemas';
import { automationDispatcher } from '@/lib/automation/dispatcher';

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
    const savedResearch = localDb.getSavedResearch(user.id, id);

    return NextResponse.json({
      case: caseRecord,
      documents,
      hearings,
      tasks,
      invoices,
      drafts,
      savedResearch
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
    const parseResult = updateCaseSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid case update data' },
        { status: 400 }
      );
    }

    const existing = localDb.getCaseById(user.id, id);
    if (!existing) {
      return NextResponse.json({ error: 'Case not found or update denied.' }, { status: 404 });
    }
    const prevDate = existing.next_hearing_date;
    const prevStage = existing.stage_of_case;

    const updated = localDb.updateCase(user.id, id, parseResult.data);
    if (!updated) {
      return NextResponse.json({ error: 'Case not found or update denied.' }, { status: 404 });
    }

    // Trigger automated case status change alert if hearing date or stage changed
    if ((parseResult.data.next_hearing_date && parseResult.data.next_hearing_date !== prevDate) ||
        (parseResult.data.stage_of_case && parseResult.data.stage_of_case !== prevStage)) {
      await automationDispatcher.notifyCaseStatusChange(user.id, updated, {
        previousDate: prevDate,
        newDate: updated.next_hearing_date,
        previousStage: prevStage,
        newStage: updated.stage_of_case
      });
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
