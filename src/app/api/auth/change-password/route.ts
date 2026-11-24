import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { localDb } from '@/lib/db';
import { verifySession, COOKIE_NAME, hashPassword, verifyPassword } from '@/lib/auth/session';
import { supabase, supabaseAdmin } from '@/lib/db';
import { changePasswordSchema } from '@/lib/validation/schemas';
import { rateLimiter, getClientIp } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimitKey = `auth_change_pwd_${ip}`;

    const limitCheck = rateLimiter.check(rateLimitKey, 5, 900);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { 
          error: `अत्यधिक प्रयास। कृपया ${Math.ceil(limitCheck.resetSeconds / 60)} मिनट बाद पुनः प्रयास करें।` 
        },
        { status: 429, headers: { 'Retry-After': String(limitCheck.resetSeconds) } }
      );
    }

    const body = await req.json();
    const parseResult = changePasswordSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parseResult.data;
    let email = typeof body.email === 'string' ? body.email.trim() : '';

    // Check if user is logged in via session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
    const sessionUser = sessionCookie ? verifySession(sessionCookie) : null;

    if (sessionUser) {
      email = sessionUser.email;
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required / ईमेल पता आवश्यक है।' },
        { status: 400 }
      );
    }

    // Lookup user in database
    const user = localDb.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'इस ईमेल से पंजीकृत कोई खाता नहीं मिला।' },
        { status: 404 }
      );
    }

    // STRICT CRYPTOGRAPHIC VERIFICATION ONLY
    const isMatch = verifyPassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'वर्तमान पासवर्ड गलत है। कृपया पुनः जांचें।' },
        { status: 401 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'नया पासवर्ड आपके पुराने पासवर्ड से भिन्न होना चाहिए।' },
        { status: 400 }
      );
    }

    // Compute new bcrypt hash (12 rounds) and update in local-db
    const newHash = hashPassword(newPassword.trim());
    const updated = localDb.updateUserPassword(user.id, newHash);

    if (!updated) {
      return NextResponse.json(
        { error: 'पासवर्ड अपडेट करने में त्रुटि हुई। कृपया पुनः प्रयास करें।' },
        { status: 500 }
      );
    }

    // Auto-update in Supabase if configured and reachable
    const client = supabaseAdmin || supabase;
    if (client) {
      try {
        await client
          .from('users')
          .update({ password_hash: newHash, updated_at: new Date().toISOString() })
          .eq('email', user.email);
      } catch {
        // Graceful non-blocking fallback if remote Supabase is unreachable
      }
    }

    rateLimiter.reset(rateLimitKey);

    return NextResponse.json({
      success: true,
      message: 'पासवर्ड सफलतापूर्वक बदल दिया गया है! अब आप नए पासवर्ड से लॉगिन कर सकते हैं।'
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'पासवर्ड बदलने में त्रुटि हुई';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
