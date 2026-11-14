import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { subscriptionRepository } from '@/lib/db/repositories';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const invoices = await subscriptionRepository.getInvoices(user.id);
    return NextResponse.json({ invoices });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
