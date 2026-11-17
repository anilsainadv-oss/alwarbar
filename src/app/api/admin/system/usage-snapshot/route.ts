import { NextResponse } from 'next/server';
import { getCurrentUser, assertSystemAdmin } from '@/lib/auth/guards';
import { monitorService } from '@/lib/system/monitor-service';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertSystemAdmin(user);

    let customMeta: Record<string, unknown> = {};
    try {
      const body = await req.json();
      if (body && typeof body === 'object') {
        customMeta = body;
      }
    } catch {
      // Body is optional
    }

    const snapshot = await monitorService.recordUsageSnapshot({
      triggered_by: user.id,
      trigger_role: user.role,
      ...customMeta
    });

    return NextResponse.json({
      success: true,
      snapshot
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record usage snapshot';
    const status = message.includes('UNAUTHORIZED') ? 401 : message.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
