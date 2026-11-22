import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getCurrentUser, assertPublicAdmin } from '@/lib/auth/guards';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/db/supabase';
import { sha256Buffer, uploadOriginalPdfToR2 } from '@/lib/judgments/r2';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MAX_PDF_BYTES = Number(process.env.MAX_JUDGMENT_PDF_MB || 30) * 1024 * 1024;
export async function GET() {
  try {
    const user = await getCurrentUser(); assertPublicAdmin(user);
    if (!isSupabaseAdminConfigured || !supabaseAdmin) return NextResponse.json({ error: 'Supabase service role is not configured.' }, { status: 503 });
    const { data, error } = await supabaseAdmin.from('judgment_documents').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    return NextResponse.json({ success: true, judgments: data });
  } catch (e) { const m = e instanceof Error ? e.message : 'Unable to load queue'; return NextResponse.json({ error: m }, { status: m.startsWith('UNAUTHORIZED') || m.startsWith('FORBIDDEN') ? 403 : 500 }); }
}
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(); assertPublicAdmin(user);
    if (!isSupabaseAdminConfigured || !supabaseAdmin) return NextResponse.json({ error: 'Supabase service role is not configured.' }, { status: 503 });
    const form = await request.formData(), file = form.get('file');
    const court = String(form.get('court') || ''), caseTitle = String(form.get('case_title') || '').trim(), caseNumber = String(form.get('case_number') || '').trim();
    const judgmentDate = String(form.get('judgment_date') || '').trim(), sourceUrl = String(form.get('source_url') || '').trim(), citation = String(form.get('citation') || '').trim();
    if (!(file instanceof File)) return NextResponse.json({ error: 'Original PDF file is required.' }, { status: 400 });
    if (!['supreme_court', 'rajasthan_high_court'].includes(court)) return NextResponse.json({ error: 'Invalid court.' }, { status: 400 });
    if (!caseTitle || !caseNumber || !/^\d{4}-\d{2}-\d{2}$/.test(judgmentDate) || !/^https:\/\//i.test(sourceUrl)) return NextResponse.json({ error: 'Case title, case number, YYYY-MM-DD date and official HTTPS source URL are required.' }, { status: 400 });
    if (file.size < 8 || file.size > MAX_PDF_BYTES) return NextResponse.json({ error: `PDF must be between 8 bytes and ${Math.floor(MAX_PDF_BYTES / 1048576)} MB.` }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.subarray(0, 5).toString('ascii') !== '%PDF-') return NextResponse.json({ error: 'File does not have a valid PDF header.' }, { status: 415 });
    const hash = sha256Buffer(bytes), id = randomUUID(), safeCase = caseNumber.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
    const r2Key = `original-judgments/${court}/${judgmentDate.slice(0, 4)}/${safeCase}_${hash.slice(0, 16)}.pdf`;
    const storageUri = await uploadOriginalPdfToR2(r2Key, bytes);
    const { data, error } = await supabaseAdmin.from('judgment_documents').insert({ id, court, case_title: caseTitle, case_number: caseNumber, citation: citation || null, judgment_date: judgmentDate, official_source_url: sourceUrl, original_file_name: file.name, original_mime_type: 'application/pdf', original_size_bytes: bytes.length, original_sha256: hash, r2_key: r2Key, storage_uri: storageUri, verification_status: 'pending_review', publication_status: 'pending', uploaded_by: user.id, uploaded_by_name: user.full_name }).select('*').single();
    if (error) throw error;
    return NextResponse.json({ success: true, judgment: data, message: 'Original PDF stored privately and placed in pending review.' }, { status: 201 });
  } catch (e) { const m = e instanceof Error ? e.message : 'Judgment upload failed'; return NextResponse.json({ error: m }, { status: m.startsWith('UNAUTHORIZED') || m.startsWith('FORBIDDEN') ? 403 : 500 }); }
}
