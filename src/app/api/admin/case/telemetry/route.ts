import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertCaseAdmin } from '@/lib/auth/guards';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertCaseAdmin(user);

    // ZERO KNOWLEDGE: Returns purely aggregate operational metrics without case contents or clients
    const telemetry = localDb.getMyCaseServiceTelemetry();
    return NextResponse.json({ telemetry });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
