import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/guards';
import { runAutomatedCourtIngestion } from '@/lib/legal-research/court-crawler';

/**
 * Automated Live Court Ingestion Route
 * Connects with Rajasthan High Court (hcraj.nic.in) & Supreme Court of India (e-SCR)
 * Triggered by Scheduled Nightly Cron or 1-Click Manual Admin Sync.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'alwar-court-feed-cron-secret-2026';
    const isCronAuthorized = authHeader === `Bearer ${cronSecret}`;

    let triggeredBy = 'system-court-cron';
    let autoVerify = false;
    let court: 'all' | 'high_court' | 'supreme_court' = 'all';

    if (!isCronAuthorized) {
      const user = await getCurrentUser();
      if (!user || user.role !== 'public_admin') {
        return NextResponse.json(
          { error: 'FORBIDDEN: Requires Public Admin privileges or valid CRON Authorization.' },
          { status: 403 }
        );
      }
      triggeredBy = user.id;
    }

    // Parse options if provided in request
    try {
      const url = new URL(req.url);
      if (url.searchParams.get('court')) {
        const c = url.searchParams.get('court');
        if (c === 'high_court' || c === 'supreme_court' || c === 'all') {
          court = c;
        }
      }
      if (url.searchParams.get('auto_verify') === 'true') {
        autoVerify = true;
      }

      if (req.headers.get('content-type')?.includes('application/json')) {
        const body = await req.json().catch(() => ({}));
        if (body.court) court = body.court;
        if (typeof body.autoVerify === 'boolean') autoVerify = body.autoVerify;
      }
    } catch {
      // query or body parsing fallback
    }

    const result = await runAutomatedCourtIngestion({
      court,
      autoVerify,
      triggeredBy
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('Error in automated court ingestion cron:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error in court ingestion' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return POST(req);
}
