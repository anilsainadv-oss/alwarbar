import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertPublicAdmin } from '@/lib/auth/guards';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const profiles = localDb.getAdvocateProfiles();
    return NextResponse.json({ profiles });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const { profile_id, is_verified } = await req.json();
    if (!profile_id) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    const ok = localDb.updateAdvocateVerification(profile_id, Boolean(is_verified), user.id);

    localDb.createAuditLog({
      actor_id: user.id,
      actor_name: user.full_name,
      actor_role: user.role,
      action: is_verified ? 'VERIFY_ADVOCATE_ENROLLMENT' : 'UNVERIFY_ADVOCATE_ENROLLMENT',
      entity_type: 'advocate_profile',
      entity_id: profile_id,
      details: { verified: is_verified }
    });

    return NextResponse.json({ success: ok });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
