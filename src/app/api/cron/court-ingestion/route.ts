import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/guards';
import { CourtSyncService } from '@/lib/court-sync/court-sync-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export const preferredRegion = 'bom1';

/**
 * 6-Hour Scheduled Court Judgment Ingestion Cron Route
 * Connects with Supreme Court of India & Rajasthan High Court
 * 
 * Scheduled every 6 hours (0 * /6 * * *)
 * Protected by CRON_SECRET or Public Admin Session
 * 
 * Invokes CourtSyncService (live sci.gov.in fetch) with strict
 * pending approval defaults, R2 non-overwrite, and quadruple deduplication.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    // SECURITY: no hardcoded fallback secret. If CRON_SECRET is not set, only a logged-in
    // public_admin session can trigger sync.
    const cronSecret = process.env.CRON_SECRET || '';
    const isCronAuthorized = cronSecret.length >= 24 && authHeader === `Bearer ${cronSecret}`;

    let triggeredBy = 'system-court-cron';
    let court: 'all' | 'rajasthan_high_court' | 'supreme_court' = 'all';
    let dryRun = false;
    let force = false;

    if (!isCronAuthorized) {
      // Check query param key fallback
      const url = new URL(req.url);
      const queryKey = url.searchParams.get('key') || url.searchParams.get('token');
      // Prefer the Authorization header; the query-string token is only accepted if a strong secret is set.
      if (!(cronSecret.length >= 24 && queryKey === cronSecret)) {
        const user = await getCurrentUser();
        if (!user || user.role !== 'public_admin') {
          return NextResponse.json(
            { error: 'FORBIDDEN: Requires Public Admin privileges or valid CRON Authorization token.' },
            { status: 403 }
          );
        }
        triggeredBy = user.id;
      }
    }

    // Parse options
    try {
      const url = new URL(req.url);
      const c = url.searchParams.get('court');
      if (c === 'high_court' || c === 'rajasthan_high_court') court = 'rajasthan_high_court';
      else if (c === 'supreme_court') court = 'supreme_court';

      if (url.searchParams.get('dry_run') === 'true' || url.searchParams.get('dryRun') === 'true') {
        dryRun = true;
      }
      if (url.searchParams.get('force') === 'true') {
        force = true;
      }

      if (req.headers.get('content-type')?.includes('application/json')) {
        const body = await req.json().catch(() => ({}));
        if (body.court) {
          if (body.court === 'high_court' || body.court === 'rajasthan_high_court') court = 'rajasthan_high_court';
          else if (body.court === 'supreme_court') court = 'supreme_court';
        }
        if (typeof body.dryRun === 'boolean') dryRun = body.dryRun;
        if (typeof body.force === 'boolean') force = body.force;
      }
    } catch {
      // fallback
    }

    const result = await CourtSyncService.executeSync({
      court,
      dryRun,
      triggeredBy,
      force
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Court sync cron failed';
    const statusCode = message.includes('Rate limit') ? 429 : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
