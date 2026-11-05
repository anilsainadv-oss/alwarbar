import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertPublicAdmin } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);
    const schemes = localDb.getWelfareSchemes();
    const bulletins = localDb.getWelfareBulletins();
    return NextResponse.json({ schemes, bulletins });
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

    // Check if adding a live bulletin
    if (body.type === 'bulletin') {
      const { title_en, title_hi, authority, category, important, summary_en, summary_hi, official_link } = body;
      const bulletin = localDb.createWelfareBulletin({
        title_en,
        title_hi,
        authority: authority || 'Trustee Committee, Bar Council of Rajasthan',
        category: category || 'circular',
        important: Boolean(important),
        summary_en,
        summary_hi,
        official_link
      });

      localDb.createAuditLog({
        actor_id: user.id,
        actor_name: user.full_name,
        actor_role: user.role,
        action: 'PUBLISH_WELFARE_BULLETIN',
        entity_type: 'welfare_bulletin',
        entity_id: bulletin.id,
        details: { title_en }
      });

      return NextResponse.json({ success: true, bulletin });
    }

    // Otherwise create or update welfare scheme
    const { 
      title_en, title_hi, issuing_authority, official_source_url, 
      eligibility_criteria, benefits_summary, application_process, 
      document_checklist, deadline, category, max_benefit_amount, status_badge 
    } = body;

    const scheme = localDb.createWelfareScheme({
      title_en,
      title_hi,
      issuing_authority: issuing_authority || 'Bar Council of Rajasthan',
      official_source_url,
      eligibility_criteria,
      benefits_summary,
      application_process,
      document_checklist: document_checklist || ['Enrolment Certificate Copy', 'Bar Continuity Certificate'],
      deadline: deadline || undefined,
      category: category || 'retirement',
      max_benefit_amount: max_benefit_amount || 'Statutory Benefit',
      status_badge: status_badge || 'Active Scheme',
      last_verified_date: new Date().toISOString().split('T')[0],
      is_published: true,
      created_by: user.id
    });

    localDb.createAuditLog({
      actor_id: user.id,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'PUBLISH_WELFARE_SCHEME',
      entity_type: 'welfare_scheme',
      entity_id: scheme.id,
      details: { title_en }
    });

    return NextResponse.json({ success: true, scheme });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Scheme ID is required' }, { status: 400 });
    }

    const ok = localDb.updateWelfareScheme(id, {
      ...updates,
      last_verified_date: new Date().toISOString().split('T')[0]
    });

    if (ok) {
      localDb.createAuditLog({
        actor_id: user.id,
        actor_name: user.full_name,
        actor_role: user.role,
        action: 'UPDATE_WELFARE_SCHEME',
        entity_type: 'welfare_scheme',
        entity_id: id,
        details: updates
      });
    }

    return NextResponse.json({ success: ok });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Scheme ID is required' }, { status: 400 });
    }

    const ok = localDb.deleteWelfareScheme(id);
    return NextResponse.json({ success: ok });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
