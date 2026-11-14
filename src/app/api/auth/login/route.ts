import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { signSession, COOKIE_NAME, verifyPassword } from '@/lib/auth/session';
import { loginSchema } from '@/lib/validation/schemas';
import { rateLimiter, getClientIp } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimitKey = `auth_login_${ip}`;
    
    // Strict rate limiting: 5 attempts per 15 minutes
    const limitCheck = rateLimiter.check(rateLimitKey, 5, 900);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { 
          error: `अत्यधिक असफल प्रयास। कृपया ${Math.ceil(limitCheck.resetSeconds / 60)} मिनट बाद पुनः प्रयास करें (Too many attempts. Please try again later).` 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(limitCheck.resetSeconds)
          }
        }
      );
    }

    const json = await req.json();
    const parseResult = loginSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    const { email: rawIdentifier, password: rawPassword } = parseResult.data;

    const user = localDb.getUserByEmail(rawIdentifier.trim());
    if (!user) {
      return NextResponse.json(
        { error: 'अमान्य क्रेडेंशियल (Invalid email, enrollment, or password).' },
        { status: 401 }
      );
    }

    // STRICT CRYPTOGRAPHIC VERIFICATION ONLY (Zero backdoor bypasses)
    const isValid = verifyPassword(rawPassword.trim(), user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'अमान्य क्रेडेंशियल (Invalid email, enrollment, or password).' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'यह खाता निष्क्रिय है। कृपया बार एसोसिएशन या सिस्टम एडमिनिस्ट्रेटर से संपर्क करें।' },
        { status: 403 }
      );
    }

    // Successful login: reset rate limit for this IP
    rateLimiter.reset(rateLimitKey);

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
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
