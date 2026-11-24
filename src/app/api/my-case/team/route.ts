import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { chamberRepository } from '@/lib/db/repositories';
import { createChamberSchema } from '@/lib/validation/schemas';
import { featureGate } from '@/lib/saas/feature-gate';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { chamber, membership } = await chamberRepository.getChamber(user.id);
    const usage = featureGate.getUsageMetrics(user.id);

    if (!chamber) {
      return NextResponse.json({
        hasChamber: false,
        usage,
        members: [],
        invitations: []
      });
    }

    const members = await chamberRepository.getMembers(chamber.id);
    const invitations = await chamberRepository.getInvitations(chamber.id);

    return NextResponse.json({
      hasChamber: true,
      chamber,
      membership,
      isOwner: chamber.owner_advocate_id === user.id,
      members,
      invitations,
      usage
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
    const parseResult = createChamberSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid chamber data' },
        { status: 400 }
      );
    }

    const chamber = await chamberRepository.createChamber(user.id, parseResult.data);
    const members = await chamberRepository.getMembers(chamber.id);

    return NextResponse.json({
      success: true,
      chamber,
      members
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save chamber';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
