import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { clientRepository, caseRepository } from '@/lib/db/repositories';
import { updateClientSchema } from '@/lib/validation/schemas';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    assertAuthenticated(user);

    // Multi-tenant check: Fetch client scoped to this advocate
    const client = await clientRepository.getClientById(user.id, id);
    if (!client) {
      return NextResponse.json({ error: 'Client record not found or access denied.' }, { status: 404 });
    }

    // Fetch all cases belonging to this advocate and linked to this client
    const allCases = await caseRepository.getCases(user.id);
    const linkedCases = allCases.filter(c => c.client_id === id);

    return NextResponse.json({
      client,
      cases: linkedCases
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const body = await req.json();
    const parseResult = updateClientSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid client update parameters' },
        { status: 400 }
      );
    }

    const updated = await clientRepository.updateClient(user.id, id, parseResult.data);
    if (!updated) {
      return NextResponse.json({ error: 'Client not found or update denied.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, client: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update client';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const deleted = await clientRepository.deleteClient(user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: 'Client not found or deletion denied.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Client record deleted successfully.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete client';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
