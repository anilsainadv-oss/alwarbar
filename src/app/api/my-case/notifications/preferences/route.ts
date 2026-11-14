import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { notificationRepository } from '@/lib/db/repositories';
import { notificationPreferencesSchema } from '@/lib/validation/schemas';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const preferences = await notificationRepository.getPreferences(user.id);
    return NextResponse.json({ preferences });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const json = await req.json();
    const parseResult = notificationPreferencesSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid preference settings' },
        { status: 400 }
      );
    }

    const updated = await notificationRepository.updatePreferences(user.id, parseResult.data);
    return NextResponse.json({ success: true, preferences: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update preferences';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
