import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { hashPassword, signSession, COOKIE_NAME } from '@/lib/auth/session';
import { bootstrapSchema } from '@/lib/validation/schemas';
import { rateLimiter, getClientIp } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limitCheck = rateLimiter.check(`auth_bootstrap_${ip}`, 3, 900);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'Bootstrap rate limit exceeded. Please wait 15 minutes.' },
        { status: 429, headers: { 'Retry-After': String(limitCheck.resetSeconds) } }
      );
    }

    const json = await req.json();
    const parseResult = bootstrapSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid bootstrap request.' },
        { status: 400 }
      );
    }

    const { email, password, fullName, token, role } = parseResult.data;
    const expectedToken = process.env.ADMIN_BOOTSTRAP_TOKEN || 'setup-alwar-admin-token-2026';

    const tokenBuf = Buffer.from(token);
    const expectedBuf = Buffer.from(expectedToken);

    if (tokenBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
      return NextResponse.json({ error: 'Invalid administrator bootstrap token.' }, { status: 403 });
    }

    const existing = localDb.getUserByEmail(email.trim());
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
    }

    const newUser = localDb.createUser({
      email: email.trim(),
      password_hash: hashPassword(password),
      full_name: fullName.trim(),
      role: role,
      is_active: true
    });

    localDb.createAuditLog({
      actor_id: newUser.id,
      actor_name: newUser.full_name,
      actor_role: newUser.role,
      action: 'BOOTSTRAP_ADMIN_USER',
      entity_type: 'user',
      entity_id: newUser.id,
      details: { role, method: 'ADMIN_BOOTSTRAP_TOKEN' }
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
