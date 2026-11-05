import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/guards';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to report content.' }, { status: 401 });
    }

    const { post_id, reply_id, reason, details } = await req.json();

    const report = localDb.createForumReport({
      post_id,
      reply_id,
      reporter_id: user.id,
      reporter_name: user.full_name,
      reason: reason || 'Inappropriate Content / Potential Confidentiality Breach',
      details: details || ''
    });

    return NextResponse.json({ success: true, report });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Report failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
