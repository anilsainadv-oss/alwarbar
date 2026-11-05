import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { signSession, COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const user = localDb.getUserByEmail(email);

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
      secure: process.env.NODE_ENV === 'production',
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
