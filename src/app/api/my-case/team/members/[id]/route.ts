import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { chamberRepository } from '@/lib/db/repositories';
import { updateMemberRoleSchema } from '@/lib/validation/schemas';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { id: memberId } = await params;
    const { chamber } = await chamberRepository.getChamber(user.id);
    if (!chamber || chamber.owner_advocate_id !== user.id) {
      return NextResponse.json({ error: 'Only the Chamber Head can modify member roles' }, { status: 403 });
    }

    const json = await req.json();
    const parseResult = updateMemberRoleSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid role payload' },
        { status: 400 }
      );
    }

    const { role, status } = parseResult.data;
    const updated = await chamberRepository.updateMemberRole(chamber.id, memberId, role, status);
    if (!updated) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, member: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update member';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { id: memberId } = await params;
    const { chamber } = await chamberRepository.getChamber(user.id);
    if (!chamber || chamber.owner_advocate_id !== user.id) {
      return NextResponse.json({ error: 'Only the Chamber Head can remove members' }, { status: 403 });
    }

    const removed = await chamberRepository.removeMember(chamber.id, memberId);
    if (!removed) {
      return NextResponse.json(
        { error: 'Cannot remove this member (cannot remove Chamber Head / owner)' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Member removed from chamber' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to remove member';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
