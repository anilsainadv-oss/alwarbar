import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { signSession, COOKIE_NAME } from '@/lib/auth/session';
import { rateLimiter, getClientIp } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  const isProduction = (process.env.NODE_ENV as string) === 'production';

  // STRICT SECURITY: Disallow passwordless demo login in production environments
  if (isProduction) {
    return NextResponse.json(
      { error: 'Passwordless demo login is disabled in production.' },
      { status: 403 }
    );
  }

  try {
    const ip = getClientIp(req);
    const limitCheck = rateLimiter.check(`auth_demo_${ip}`, 10, 300);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many demo switch requests. Please wait a few minutes.' },
        { status: 429 }
      );
    }

    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = localDb.getUserByEmail(email.trim());
    if (!user) {
      return NextResponse.json({ error: 'Demo user not found' }, { status: 404 });
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    };

    const token = signSession(sessionUser);

    const response = NextResponse.json({ success: true, user: sessionUser });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Demo switch failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
