import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertPublicAdmin } from '@/lib/auth/guards';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const logs = localDb.getAuditLogs();
    return NextResponse.json({ logs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
