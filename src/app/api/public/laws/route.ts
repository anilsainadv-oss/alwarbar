import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import type { LegalCategory, LegalUpdate } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'all';
    const type = searchParams.get('type') || 'all'; // 'bare_act' | 'judgment' | 'all'
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    let updates: LegalUpdate[] = localDb.getLegalUpdates().filter(l => l.is_published);

    // Filter by type
    if (type === 'bare_act') {
      updates = updates.filter(l => l.category === 'central_law' || l.category === 'rajasthan_act');
    } else if (type === 'judgment') {
      updates = updates.filter(l => l.category === 'sc_judgment' || l.category === 'hc_judgment');
    }

    // Filter by category
    if (category !== 'all') {
      updates = updates.filter(l => l.category === category);
    }

    // Search query
    if (q) {
      updates = updates.filter(l =>
        l.title_en.toLowerCase().includes(q) ||
        l.title_hi.toLowerCase().includes(q) ||
        l.act_or_case_name.toLowerCase().includes(q) ||
        (l.citation && l.citation.toLowerCase().includes(q)) ||
        (l.court_name && l.court_name.toLowerCase().includes(q)) ||
        l.summary_en.toLowerCase().includes(q) ||
        l.summary_hi.toLowerCase().includes(q) ||
        l.key_sections.some(s => s.toLowerCase().includes(q))
      );
    }

    const total = updates.length;
    if (limit && limit > 0) {
      updates = updates.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      total,
      count: updates.length,
      laws: updates,
      open_source_meta: {
        sync_timestamp: new Date().toISOString(),
        verified_repositories: [
          { name: 'India Code Digital Repository', url: 'https://www.indiacode.nic.in', authority: 'Ministry of Law and Justice, Govt of India' },
          { name: 'Rajasthan Law & Judicial Gazette', url: 'https://law.rajasthan.gov.in', authority: 'Law Department, Government of Rajasthan' },
          { name: 'Supreme Court of India Precedents', url: 'https://sci.gov.in', authority: 'Supreme Court of India (e-SCR)' },
          { name: 'Rajasthan High Court Judgments', url: 'https://hcraj.nic.in', authority: 'High Court of Rajasthan (Jaipur & Jodhpur Benches)' }
        ],
        legal_status: 'In Force / Statutory Enacted'
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch legal updates';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
