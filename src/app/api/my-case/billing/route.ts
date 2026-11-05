import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const invoices = localDb.getInvoices(user.id);
    return NextResponse.json({ invoices });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { client_id, case_id, invoice_number, total_amount, paid_amount, status, issue_date, due_date, notes } = await req.json();

    if (!client_id || !invoice_number || total_amount === undefined) {
      return NextResponse.json({ error: 'Client, invoice number, and total amount are required.' }, { status: 400 });
    }

    const inv = localDb.createInvoice(user.id, {
      client_id,
      case_id: case_id || undefined,
      invoice_number: invoice_number.trim(),
      total_amount: Number(total_amount),
      paid_amount: Number(paid_amount || 0),
      status: status || 'unpaid',
      issue_date: issue_date || new Date().toISOString().split('T')[0],
      due_date: due_date || undefined,
      notes: notes || ''
    });

    return NextResponse.json({ success: true, invoice: inv });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create invoice';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
