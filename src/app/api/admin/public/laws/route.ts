import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertPublicAdmin } from '@/lib/auth/guards';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);
    const laws = localDb.getLegalUpdates();
    return NextResponse.json({ laws });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const body = await req.json();
    const { title_en, title_hi, category, act_or_case_name, citation, court_name, summary_en, summary_hi, key_sections, official_source_url } = body;

    const law = localDb.createLegalUpdate({
      title_en,
      title_hi,
      category,
      act_or_case_name,
      citation,
      court_name,
      decision_or_commencement_date: new Date().toISOString().split('T')[0],
      summary_en,
      summary_hi,
      key_sections: key_sections || [],
      official_source_url,
      is_verified: true,
      last_verified_at: new Date().toISOString(),
      is_published: true
    });

    localDb.createAuditLog({
      actor_id: user.id,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'PUBLISH_LEGAL_UPDATE',
      entity_type: 'legal_update',
      entity_id: law.id,
      details: { title_en, category }
    });

    return NextResponse.json({ success: true, law });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
