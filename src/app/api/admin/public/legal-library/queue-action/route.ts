import { NextResponse } from 'next/server';
import { getCurrentUser, assertPublicAdmin } from '@/lib/auth/guards';
import { legalResearchRepository } from '@/lib/db/repositories/legal-research';
import { localDb } from '@/lib/db';
import { z } from 'zod';
import type { CourtDiscoveryQueueStatus } from '@/types/legal-research';

export const dynamic = 'force-dynamic';

const queueActionSchema = z.object({
  queue_id: z.string().min(1, 'Queue ID is required'),
  action: z.enum(['reprocess', 'quarantine', 'dismiss']),
  reason: z.string().optional()
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const url = new URL(req.url);
    const courtCode = url.searchParams.get('court') || undefined;
    const status = (url.searchParams.get('status') as CourtDiscoveryQueueStatus) || undefined;

    const queueItems = await legalResearchRepository.getDiscoveryQueue(courtCode, status);
    const checkpoint = await legalResearchRepository.getCourtSyncCheckpoint(courtCode || 'INSC');

    return NextResponse.json({
      checkpoint,
      totalItems: queueItems.length,
      items: queueItems
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve queue items';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const body = await req.json();
    const parse = queueActionSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.errors[0]?.message || 'Invalid request body' },
        { status: 400 }
      );
    }

    const { queue_id, action, reason } = parse.data;

    const queueItems = await legalResearchRepository.getDiscoveryQueue();
    const item = queueItems.find(q => q.id === queue_id);
    if (!item) {
      return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    let newStatus: CourtDiscoveryQueueStatus;

    if (action === 'reprocess') {
      newStatus = 'pending';
      item.retry_count = 0;
      item.last_error = null;
    } else if (action === 'quarantine') {
      newStatus = 'quarantined';
    } else {
      newStatus = 'duplicate_skipped';
    }

    item.status = newStatus;
    item.updated_at = now;

    // Record immutable audit log
    await legalResearchRepository.recordAuditLog({
      document_id: item.document_id || `queue-${item.id}`,
      action: `QUEUE_ACTION_${action.toUpperCase()}` as any,
      actor_id: user.id,
      actor_name: user.full_name || user.email,
      actor_role: user.role,
      performed_by: user.id,
      details: {
        entity_type: 'court_discovery_queue',
        entity_id: item.id,
        previous_status: item.status,
        new_status: newStatus,
        reason: reason || null,
        court_code: item.court_code,
        diary_number: item.diary_number,
        citation: item.citation
      },
      notes: reason || `Admin action ${action} performed on queue item`
    });

    return NextResponse.json({
      success: true,
      queue_id: item.id,
      status: newStatus,
      updated_at: now
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Admin queue action failed';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
