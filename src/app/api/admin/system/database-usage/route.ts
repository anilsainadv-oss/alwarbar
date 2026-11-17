import { NextResponse } from 'next/server';
import { getCurrentUser, assertSystemAdmin } from '@/lib/auth/guards';
import { monitorService } from '@/lib/system/monitor-service';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertSystemAdmin(user);

    const [database, judgments] = await Promise.all([
      monitorService.getDatabaseUsageMetrics(),
      monitorService.getJudgmentDatabaseStats()
    ]);

    return NextResponse.json({
      database,
      judgments
    }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized access to database metrics';
    const status = message.includes('UNAUTHORIZED') ? 401 : message.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
