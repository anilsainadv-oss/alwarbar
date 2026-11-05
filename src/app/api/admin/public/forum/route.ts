import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertPublicAdmin } from '@/lib/auth/guards';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const reports = localDb.getForumReports();
    const allPosts = localDb.getAllForumPostsAdmin();
    return NextResponse.json({ reports, allPosts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const { report_id, status } = await req.json();
    const ok = localDb.updateForumReportStatus(report_id, status);

    localDb.createAuditLog({
      actor_id: user.id,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'MODERATE_FORUM_REPORT',
      entity_type: 'forum_report',
      entity_id: report_id,
      details: { status }
    });

    return NextResponse.json({ success: ok });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
