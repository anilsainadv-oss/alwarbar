import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { hashPassword, signSession, COOKIE_NAME } from '@/lib/auth/session';
import { registerSchema } from '@/lib/validation/schemas';
import { rateLimiter, getClientIp } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limitCheck = rateLimiter.check(`auth_register_${ip}`, 5, 900);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'अत्यधिक रजिस्ट्रेशन प्रयास। कृपया कुछ समय बाद पुनः प्रयास करें।' },
        { status: 429, headers: { 'Retry-After': String(limitCheck.resetSeconds) } }
      );
    }

    const body = await req.json();
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid registration details' },
        { status: 400 }
      );
    }

    const { email, password, full_name, phone, bar_council_enrollment_no, court_practice_complex } = parseResult.data;

    const existing = localDb.getUserByEmail(email.trim());
    if (existing) {
      return NextResponse.json({ error: 'Account with this email already exists' }, { status: 409 });
    }

    const newUser = localDb.createUser({
      email: email.trim(),
      password_hash: hashPassword(password),
      full_name: full_name.trim(),
      phone: phone || '',
      role: 'registered_advocate',
      is_active: true
    });

    // Create advocate profile if enrollment provided
    if (bar_council_enrollment_no) {
      try {
        localDb.createAdvocateProfile({
          user_id: newUser.id,
          bar_council_enrollment_no: bar_council_enrollment_no.trim(),
          bar_association_name: 'District Bar Association, Alwar',
          court_practice_complex: court_practice_complex || 'District & Sessions Court, Alwar',
          chamber_address: '',
          experience_years: 1,
          practice_areas: ['Civil', 'Criminal'],
          is_verified: false,
          is_publicly_listed: true
        });
      } catch {
        // Non-blocking profile creation
      }
    }

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
