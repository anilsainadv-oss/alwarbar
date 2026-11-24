import { NextResponse } from 'next/server';
import { getCurrentUser, assertSystemAdmin } from '@/lib/auth/guards';
import { monitorService } from '@/lib/system/monitor-service';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    assertSystemAdmin(user);

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    const { history, trends } = await monitorService.getUsageHistory(days);
    return NextResponse.json({
      history,
      trends
    }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized access to usage history';
    const status = message.includes('UNAUTHORIZED') ? 401 : message.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
