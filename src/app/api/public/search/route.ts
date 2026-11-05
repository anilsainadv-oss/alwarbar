import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam) : undefined;

  if (!q) {
    const defaultLimit = limit ?? 10;
    return NextResponse.json({
      laws: localDb.getLegalUpdates().slice(0, defaultLimit),
      welfare: localDb.getWelfareSchemes().slice(0, defaultLimit),
      advocates: localDb.getAdvocateProfiles().slice(0, defaultLimit),
      forms: localDb.getLegalForms().slice(0, defaultLimit)
    });
  }

  const laws = localDb.getLegalUpdates().filter(l => 
    l.title_en.toLowerCase().includes(q) ||
    l.title_hi.toLowerCase().includes(q) ||
    l.act_or_case_name.toLowerCase().includes(q) ||
    l.summary_en.toLowerCase().includes(q)
  );

  const welfare = localDb.getWelfareSchemes().filter(w =>
    w.title_en.toLowerCase().includes(q) ||
    w.title_hi.toLowerCase().includes(q) ||
    w.benefits_summary.toLowerCase().includes(q)
  );

  const advocates = localDb.getAdvocateProfiles().filter(a =>
    (a.user?.full_name && a.user.full_name.toLowerCase().includes(q)) ||
    (a.bar_council_enrollment_no && a.bar_council_enrollment_no.toLowerCase().includes(q)) ||
    (Array.isArray(a.practice_areas) && a.practice_areas.some(p => typeof p === 'string' && p.toLowerCase().includes(q)))
  );

  const forms = localDb.getLegalForms().filter(f =>
    f.title_en.toLowerCase().includes(q) ||
    f.title_hi.toLowerCase().includes(q) ||
    f.category.toLowerCase().includes(q)
  );

  return NextResponse.json({ laws, welfare, advocates, forms });
}
