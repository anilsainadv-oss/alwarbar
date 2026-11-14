import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { chamberRepository } from '@/lib/db/repositories';
import { inviteTeamMemberSchema } from '@/lib/validation/schemas';
import { featureGate } from '@/lib/saas/feature-gate';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { chamber } = await chamberRepository.getChamber(user.id);
    if (!chamber) {
      return NextResponse.json({ invitations: [] });
    }

    const invitations = await chamberRepository.getInvitations(chamber.id);
    return NextResponse.json({ invitations });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    // 1. Check Chamber Ownership
    const { chamber } = await chamberRepository.getChamber(user.id);
    if (!chamber || chamber.owner_advocate_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the Chamber Head (Senior Advocate) can invite team members. Please create a chamber first.' },
        { status: 403 }
      );
    }

    // 2. Plan Quota Check
    const quota = featureGate.canInviteTeamMember(user.id);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quota.reason || 'Team member seat limit reached for your subscription plan.' },
        { status: 403 }
      );
    }

    const json = await req.json();
    const parseResult = inviteTeamMemberSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid invitation details' },
        { status: 400 }
      );
    }

    const { email, role, full_name } = parseResult.data;

    // Check if already an active member
    const currentMembers = await chamberRepository.getMembers(chamber.id);
    const existingMember = currentMembers.find(m => m.email.toLowerCase() === email.toLowerCase());
    if (existingMember) {
      return NextResponse.json(
        { error: `User with email ${email} is already a member of this chamber.` },
        { status: 400 }
      );
    }

    const invitation = await chamberRepository.createInvitation({
      chamber_id: chamber.id,
      chamber_name: chamber.name,
      invited_by_advocate_id: user.id,
      invitee_email: email,
      role
    });

    return NextResponse.json({
      success: true,
      invitation,
      message: `Invitation generated for ${email} as ${role.replace('_', ' ')}. Share token: ${invitation.token}`
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send invitation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { chamber } = await chamberRepository.getChamber(user.id);
    if (!chamber || chamber.owner_advocate_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to revoke invitations' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const invitationId = searchParams.get('id');
    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 });
    }

    const revoked = await chamberRepository.revokeInvitation(chamber.id, invitationId);
    return NextResponse.json({ success: revoked });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to revoke invitation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
