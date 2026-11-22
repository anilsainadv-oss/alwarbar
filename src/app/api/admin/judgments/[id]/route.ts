import { NextResponse } from 'next/server';
import { getCurrentUser, assertPublicAdmin } from '@/lib/auth/guards';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/db/supabase';
export const dynamic = 'force-dynamic';
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(); assertPublicAdmin(user);
    if (!isSupabaseAdminConfigured || !supabaseAdmin) return NextResponse.json({ error: 'Supabase service role is not configured.' }, { status: 503 });
    const { id } = await context.params, body = await request.json(), action = body.action;
    if (!['approve', 'reject'].includes(action)) return NextResponse.json({ error: 'Action must be approve or reject.' }, { status: 400 });
    const { data: found, error: readError } = await supabaseAdmin.from('judgment_documents').select('id').eq('id', id).single();
    if (readError || !found) return NextResponse.json({ error: 'Judgment not found.' }, { status: 404 });
    if (action === 'approve' && body.confirm_original_pdf !== true) return NextResponse.json({ error: 'Explicit confirmation of original PDF and case details is required.' }, { status: 400 });
    const update = action === 'approve' ? { verification_status: 'admin_verified', publication_status: 'published', approved_by: user.id, approved_by_name: user.full_name, approved_at: new Date().toISOString() } : { verification_status: 'rejected', publication_status: 'rejected', rejected_by: user.id, rejected_at: new Date().toISOString(), rejection_reason: String(body.reason || 'Rejected by administrator').slice(0, 1000) };
    const { data, error } = await supabaseAdmin.from('judgment_documents').update(update).eq('id', id).select('*').single();
    if (error) throw error;
    return NextResponse.json({ success: true, judgment: data });
  } catch (e) { const m = e instanceof Error ? e.message : 'Review failed'; return NextResponse.json({ error: m }, { status: m.startsWith('UNAUTHORIZED') || m.startsWith('FORBIDDEN') ? 403 : 500 }); }
}
