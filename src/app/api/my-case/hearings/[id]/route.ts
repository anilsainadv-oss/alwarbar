import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { hearingRepository } from '@/lib/db/repositories';
import { updateHearingSchema } from '@/lib/validation/schemas';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const hearing = await hearingRepository.getHearingById(user.id, id);
    if (!hearing) {
      return NextResponse.json({ error: 'Hearing record not found or access denied.' }, { status: 404 });
    }

    return NextResponse.json({ hearing });
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
    const parseResult = updateHearingSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid hearing update parameters' },
        { status: 400 }
      );
    }

    const updated = await hearingRepository.updateHearing(user.id, id, parseResult.data);
    if (!updated) {
      return NextResponse.json({ error: 'Hearing not found or update denied.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, hearing: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update hearing';
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

    const deleted = await hearingRepository.deleteHearing(user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: 'Hearing not found or deletion denied.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Hearing entry cancelled successfully.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to cancel hearing';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
