import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/db/supabase';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  if (!isSupabaseConfigured || !supabase) return NextResponse.json({ error: 'Judgment repository is not configured.' }, { status: 503 });
  const params = new URL(request.url).searchParams, court = params.get('court'), q = params.get('q')?.trim();
  let query = supabase.from('judgment_documents').select('id,court,case_title,case_number,citation,judgment_date,official_source_url,original_sha256,created_at').eq('publication_status', 'published').eq('verification_status', 'admin_verified').order('judgment_date', { ascending: false }).limit(100);
  if (court && ['supreme_court', 'rajasthan_high_court'].includes(court)) query = query.eq('court', court);
  if (q) query = query.or(`case_title.ilike.%${q}%,case_number.ilike.%${q}%,citation.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Unable to retrieve judgments.' }, { status: 500 });
  return NextResponse.json({ success: true, count: data?.length || 0, judgments: data || [] });
}
