import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import type { NoticeEvent } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'all';
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    let items: NoticeEvent[] = localDb.getNotices().filter(n => n.is_published);

    if (category !== 'all') {
      items = items.filter(n => n.category === category);
    }

    if (q) {
      items = items.filter(n =>
        n.title_en.toLowerCase().includes(q) ||
        n.title_hi.toLowerCase().includes(q) ||
        n.content_en.toLowerCase().includes(q) ||
        n.content_hi.toLowerCase().includes(q) ||
        n.organizer.toLowerCase().includes(q) ||
        (n.venue && n.venue.toLowerCase().includes(q))
      );
    }

    const total = items.length;
    if (limit && limit > 0) {
      items = items.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      total,
      count: items.length,
      news: items,
      open_source_meta: {
        sync_timestamp: new Date().toISOString(),
        verified_sources: [
          { name: 'District & Sessions Court, Alwar', url: 'https://districts.ecourts.gov.in/alwar' },
          { name: 'Bar Council of Rajasthan', url: 'http://barcouncilofrajasthan.org' },
          { name: 'Alwar District Bar Association', url: 'https://alwarbar.in' },
          { name: 'e-Courts National Services', url: 'https://services.ecourts.gov.in' }
        ]
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch news and notices';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
