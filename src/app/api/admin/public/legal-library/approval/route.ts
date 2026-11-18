import { NextResponse } from 'next/server';
import { getCurrentUser, assertPublicAdmin } from '@/lib/auth/guards';
import { legalResearchRepository } from '@/lib/db/repositories/legal-research';
import { localDb } from '@/lib/db';
import { z } from 'zod';
import type { ApprovalStatus, PublicationStatus, VerificationStatus } from '@/types/legal-research';

export const dynamic = 'force-dynamic';

const approvalActionSchema = z.object({
  document_id: z.string().min(1, 'Document ID is required'),
  action: z.enum([
    'approve_and_publish',
    'approve_only',
    'reject',
    'save_draft',
    'reprocess'
  ]),
  rejection_reason: z.string().optional(),
  notes: z.string().optional(),
  metadata_updates: z.record(z.any()).optional()
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const body = await req.json();
    const parse = approvalActionSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.errors[0]?.message || 'Invalid request body' },
        { status: 400 }
      );
    }

    const { document_id, action, rejection_reason, notes, metadata_updates } = parse.data;

    const doc = await legalResearchRepository.getDocumentById(document_id);
    if (!doc) {
      return NextResponse.json({ error: 'Legal document not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    let updates: Partial<any> = {
      updated_at: now
    };

    if (metadata_updates && Object.keys(metadata_updates).length > 0) {
      updates = { ...updates, ...metadata_updates };
    }

    let auditAction: string = action;
    let auditNotes = notes || '';

    switch (action) {
      case 'approve_and_publish':
        updates.approval_status = 'approved' as ApprovalStatus;
        updates.verification_status = 'verified' as VerificationStatus;
        updates.publication_status = 'published' as PublicationStatus;
        updates.approved_by = user.id;
        updates.approved_at = now;
        updates.published_at = now;
        updates.rejected_by = null;
        updates.rejected_at = null;
        updates.rejection_reason = null;
        auditAction = 'published';
        auditNotes = auditNotes || `Approved and published by Admin ${user.email}`;
        break;

      case 'approve_only':
        updates.approval_status = 'approved' as ApprovalStatus;
        updates.verification_status = 'verified' as VerificationStatus;
        updates.publication_status = 'draft' as PublicationStatus;
        updates.approved_by = user.id;
        updates.approved_at = now;
        updates.rejected_by = null;
        updates.rejected_at = null;
        updates.rejection_reason = null;
        auditAction = 'approved';
        auditNotes = auditNotes || `Approved without publishing by Admin ${user.email}`;
        break;

      case 'reject':
        if (!rejection_reason || rejection_reason.trim().length < 3) {
          return NextResponse.json(
            { error: 'Rejection reason is required (minimum 3 characters).' },
            { status: 400 }
          );
        }
        updates.approval_status = 'rejected' as ApprovalStatus;
        updates.verification_status = 'rejected' as VerificationStatus;
        updates.publication_status = 'draft' as PublicationStatus;
        updates.rejected_by = user.id;
        updates.rejected_at = now;
        updates.rejection_reason = rejection_reason.trim();
        auditAction = 'rejected';
        auditNotes = `Rejected: ${rejection_reason.trim()}`;
        break;

      case 'save_draft':
        updates.approval_status = 'draft' as ApprovalStatus;
        updates.publication_status = 'draft' as PublicationStatus;
        auditAction = 'saved_draft';
        auditNotes = auditNotes || 'Saved as draft for further review';
        break;

      case 'reprocess':
        updates.approval_status = 'pending' as ApprovalStatus;
        updates.verification_status = 'pending' as VerificationStatus;
        updates.publication_status = 'draft' as PublicationStatus;
        updates.ocr_status = 'pending';
        auditAction = 'reprocessed';
        auditNotes = auditNotes || 'Triggered re-processing of PDF text extraction';
        break;
    }

    const updatedDoc = await legalResearchRepository.updateDocument(document_id, updates);

    // Record Immutable Audit Log Entry
    await legalResearchRepository.recordAuditLog({
      document_id,
      action: auditAction as any,
      performed_by: user.id,
      notes: auditNotes,
      metadata_snapshot: {
        citation: doc.citation,
        court: doc.court_name,
        action,
        previous_approval_status: doc.approval_status || 'pending',
        new_approval_status: updates.approval_status,
        new_publication_status: updates.publication_status
      }
    });

    return NextResponse.json({
      success: true,
      document: updatedDoc,
      actionApplied: action,
      auditRecorded: true
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Action failed';
    const statusCode = message.includes('Unauthorized') || message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('document_id') || undefined;

    const logs = await legalResearchRepository.getAuditLogs(documentId);

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
