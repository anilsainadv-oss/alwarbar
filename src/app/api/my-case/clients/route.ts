import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const clients = localDb.getClients(user.id);
    return NextResponse.json({ clients });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { full_name, phone, email, address, confidential_notes } = await req.json();
    if (!full_name) {
      return NextResponse.json({ error: 'Client full name is required.' }, { status: 400 });
    }

    const client = localDb.createClient(user.id, {
      full_name: full_name.trim(),
      phone: phone || '',
      email: email || '',
      address: address || '',
      confidential_notes: confidential_notes || ''
    });

    return NextResponse.json({ success: true, client });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create client';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
