import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { createClientSchema } from '@/lib/validation/schemas';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);

    let clients = localDb.getClients(user.id);

    if (q) {
      clients = clients.filter(c => 
        (c.full_name && c.full_name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    }

    const total = clients.length;
    if (limit && limit > 0) {
      const offset = (page - 1) * limit;
      clients = clients.slice(offset, offset + limit);
    }

    return NextResponse.json({
      clients,
      total,
      page,
      limit: limit || total,
      total_pages: limit ? Math.ceil(total / limit) : 1
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const json = await req.json();
    const parseResult = createClientSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid client information' },
        { status: 400 }
      );
    }

    const { full_name, phone, email, address, confidential_notes } = parseResult.data;

    const client = localDb.createClient(user.id, {
      full_name: full_name.trim(),
      phone: phone || '',
      email: email || '',
      address: address || '',
      confidential_notes: confidential_notes || ''
    });

    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create client';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
