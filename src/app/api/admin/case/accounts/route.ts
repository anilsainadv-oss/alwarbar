import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertCaseAdmin } from '@/lib/auth/guards';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertCaseAdmin(user);

    const users = localDb.getUsers().map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      phone: u.phone,
      is_active: u.is_active,
      created_at: u.created_at
    }));

    return NextResponse.json({ users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
