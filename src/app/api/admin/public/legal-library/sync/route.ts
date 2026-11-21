import { NextResponse } from 'next/server';
import { getCurrentUser, assertPublicAdmin } from '@/lib/auth/guards';
import { CourtSyncService } from '@/lib/court-sync/court-sync-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const syncRequestSchema = z.object({
  court: z.enum(['all', 'supreme_court', 'rajasthan_high_court']).optional(),
  dryRun: z.boolean().optional(),
  force: z.boolean().optional()
});

/**
 * GET /api/admin/public/legal-library/sync
 * Returns real-time telemetry for Supreme Court & Rajasthan High Court sync status,
 * last sync timestamps, aggregate counts, and recent ingestion job history.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const state = await CourtSyncService.getDashboardState();
    return NextResponse.json(state);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve court sync telemetry';
    const statusCode = message.includes('UNAUTHORIZED') ? 401 : message.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

/**
 * POST /api/admin/public/legal-library/sync
 * Allows an authenticated Public Admin to manually trigger "Sync Now"
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const body = await req.json().catch(() => ({}));
    const parse = syncRequestSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.errors[0]?.message || 'Invalid sync parameters' },
        { status: 400 }
      );
    }

    const { court, dryRun, force } = parse.data;

    const result = await CourtSyncService.executeSync({
      court: court || 'all',
      dryRun: dryRun === true,
      force: force === true,
      triggeredBy: user.email || user.id
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Court sync failed';
    const statusCode = message.includes('Rate limit') 
      ? 429 
      : message.includes('UNAUTHORIZED') 
        ? 401 
        : message.includes('FORBIDDEN') 
          ? 403 
          : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
