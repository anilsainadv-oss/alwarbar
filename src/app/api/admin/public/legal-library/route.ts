import { NextResponse } from 'next/server';
import { getCurrentUser, assertPublicAdmin } from '@/lib/auth/guards';
import { legalResearchRepository } from '@/lib/db/repositories/legal-research';
import { localDb } from '@/lib/db';
import { z } from 'zod';
import type { VerificationStatus, CourtLevel } from '@/types/legal-research';

const updateDocumentSchema = z.object({
  id: z.string().min(1, 'Document ID is required'),
  title: z.string().min(3).optional(),
  case_number: z.string().optional(),
  citation: z.string().min(3).optional(),
  court_name: z.string().min(2).optional(),
  court_level: z.enum(['Supreme Court', 'High Court', 'District Court', 'Tribunal']).optional(),
  bench: z.enum(['Jodhpur', 'Jaipur']).nullable().optional(),
  judgment_date: z.string().optional(),
  decision_type: z.string().optional(),
  case_type: z.string().optional(),
  judge_names: z.union([z.string(), z.array(z.string())]).optional(),
  parties: z.union([z.string(), z.array(z.string())]).optional(),
  legal_subjects: z.array(z.string()).optional(),
  legal_subject: z.string().optional(),
  statutes: z.union([z.string(), z.array(z.string())]).optional(),
  summary: z.string().optional(),
  source_type: z.enum(['manual', 'automatic', 'api']).optional(),
  publication_status: z.enum(['draft', 'published', 'archived']).optional(),
  verification_status: z.enum(['pending', 'verified', 'rejected', 'archived']).optional()
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const courtLevel = searchParams.get('court_level') || undefined;
    const search = searchParams.get('search')?.toLowerCase().trim() || '';

    const allDocs = await legalResearchRepository.getDocuments({
      status: status !== 'ALL' ? status : undefined,
      court_level: courtLevel !== 'ALL' ? courtLevel : undefined
    });

    let filtered = allDocs;
    if (search) {
      filtered = allDocs.filter(d => {
        const statutesStr = Array.isArray(d.statutes) ? d.statutes.join(' ') : (d.statutes || '');
        const judgeStr = Array.isArray(d.judge_names) ? d.judge_names.join(' ') : (d.judge_names || '');
        const subjectsStr = Array.isArray(d.legal_subjects) ? d.legal_subjects.join(' ') : (d.legal_subject || '');
        return (
          d.title.toLowerCase().includes(search) ||
          d.citation.toLowerCase().includes(search) ||
          d.court_name.toLowerCase().includes(search) ||
          statutesStr.toLowerCase().includes(search) ||
          judgeStr.toLowerCase().includes(search) ||
          subjectsStr.toLowerCase().includes(search)
        );
      });
    }

    const allChunks = localDb.getLegalDocumentChunks();
    const docWithMeta = filtered.map(d => ({
      ...d,
      chunks_count: allChunks.filter(c => c.document_id === d.id).length
    }));

    const metrics = {
      totalDocuments: allDocs.length,
      verifiedCount: allDocs.filter(d => d.verification_status === 'verified').length,
      pendingCount: allDocs.filter(d => d.verification_status === 'pending').length,
      rejectedCount: allDocs.filter(d => d.verification_status === 'rejected').length,
      totalChunks: allChunks.length,
      vectorStorageStatus: 'active_pgvector_hnsw'
    };

    return NextResponse.json({
      success: true,
      documents: docWithMeta,
      metrics
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    const status = message.includes('Unauthorized') || message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const body = await req.json();

    // 1-Click Bulk Verification Gate
    if (body.action === 'verify_all') {
      const allDocs = await legalResearchRepository.getDocuments({});
      const pendingDocs = allDocs.filter(d => d.verification_status === 'pending');

      for (const doc of pendingDocs) {
        await legalResearchRepository.updateDocument(doc.id, {
          verification_status: 'verified',
          publication_status: 'published',
          verified_by: user.id,
          verified_at: new Date().toISOString()
        } as any);
      }

      localDb.createAuditLog({
        actor_id: user.id,
        actor_name: user.full_name,
        actor_role: user.role,
        action: 'VERIFY_ALL_LEGAL_DOCUMENTS',
        entity_type: 'legal_document',
        entity_id: 'bulk',
        details: { count: pendingDocs.length }
      });

      return NextResponse.json({
        success: true,
        verifiedCount: pendingDocs.length,
        message: `${pendingDocs.length} विधिक निर्णय सफलतापूर्वक सत्यापित एवं लाइव किए गए (Verified and published)`
      });
    }

    const parsed = updateDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;
    if (updates.verification_status === 'verified') {
      (updates as any).verified_by = user.id;
      (updates as any).verified_at = new Date().toISOString();
    }
    if (updates.publication_status === 'published' && updates.verification_status && updates.verification_status !== 'verified') {
      return NextResponse.json(
        { error: "Publication status cannot be 'published' unless verification status is 'verified'." },
        { status: 400 }
      );
    }

    const updated = await legalResearchRepository.updateDocument(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Legal document not found' }, { status: 404 });
    }

    localDb.createAuditLog({
      actor_id: user.id,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'UPDATE_LEGAL_DOCUMENT_METADATA',
      entity_type: 'legal_document',
      entity_id: id,
      details: {
        updates,
        citation: updated.citation
      }
    });

    return NextResponse.json({
      success: true,
      message: 'विधिक निर्णय विवरण सफलतापूर्वक अद्यतन किया गया (Metadata updated successfully)',
      document: updated
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed';
    const status = message.includes('Unauthorized') || message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const deleted = await legalResearchRepository.deleteDocument(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Document not found or already deleted' }, { status: 404 });
    }

    localDb.createAuditLog({
      actor_id: user.id,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'DELETE_LEGAL_DOCUMENT',
      entity_type: 'legal_document',
      entity_id: id,
      details: {
        document_id: id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'विधिक निर्णय एवं संबंधित वेक्टर चंक्स सफलतापूर्वक हटा दिए गए (Document deleted)'
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    const status = message.includes('Unauthorized') || message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
