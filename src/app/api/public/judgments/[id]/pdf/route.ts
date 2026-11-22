import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/db/supabase';
import { createPresignedR2GetUrl } from '@/lib/judgments/r2';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured || !supabase) return NextResponse.json({ error: 'Judgment repository is not configured.' }, { status: 503 });
  const { id } = await context.params;
  const { data, error } = await supabase.from('judgment_documents').select('r2_key').eq('id', id).eq('publication_status', 'published').eq('verification_status', 'admin_verified').single();
  if (error || !data) return NextResponse.json({ error: 'Published judgment not found.' }, { status: 404 });
  try { return NextResponse.redirect(createPresignedR2GetUrl(data.r2_key), 302); }
  catch { return NextResponse.json({ error: 'Original PDF download is temporarily unavailable.' }, { status: 503 }); }
}
