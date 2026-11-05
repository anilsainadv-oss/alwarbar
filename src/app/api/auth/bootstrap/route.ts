import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { hashPassword, signSession, COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const { email, password, full_name, token, role } = await req.json();
    const expectedToken = process.env.ADMIN_BOOTSTRAP_TOKEN || 'setup-alwar-admin-token-2026';

    if (!token || token !== expectedToken) {
      return NextResponse.json({ error: 'Invalid administrator bootstrap token.' }, { status: 403 });
    }

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Email, password, and full name are required.' }, { status: 400 });
    }

    const existing = localDb.getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
    }

    const targetRole = role === 'case_admin' ? 'case_admin' : 'public_admin';

    const newUser = localDb.createUser({
      email,
      password_hash: hashPassword(password),
      full_name,
      role: targetRole,
      is_active: true
    });

    localDb.createAuditLog({
      actor_id: newUser.id,
      actor_name: newUser.full_name,
      actor_role: newUser.role,
      action: 'BOOTSTRAP_ADMIN_USER',
      entity_type: 'user',
      entity_id: newUser.id,
      details: { role: targetRole, method: 'ADMIN_BOOTSTRAP_TOKEN' }
    });

    const sessionUser = {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role
    };

    const sessionToken = signSession(sessionUser);
    const response = NextResponse.json({ success: true, user: sessionUser });
    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Bootstrap failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
