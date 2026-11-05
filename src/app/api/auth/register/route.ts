import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { hashPassword, signSession, COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const { email, password, full_name, phone, enrollment_no } = await req.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const existing = localDb.getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Account with this email already exists' }, { status: 409 });
    }

    const newUser = localDb.createUser({
      email,
      password_hash: hashPassword(password),
      full_name,
      phone: phone || '',
      role: 'registered_advocate',
      is_active: true
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
    const message = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
