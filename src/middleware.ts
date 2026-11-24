import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_SECRET = process.env.AUTH_SECRET || 'alwar-advocates-secure-dev-secret-1234567890abcdef';
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'alwar_law_session';

interface SessionPayload {
  id: string;
  email: string;
  full_name: string;
  role: 'registered_advocate' | 'public_admin' | 'case_admin';
}

/**
 * Universal Web Crypto HMAC-SHA256 signature verifier
 */
async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, signatureHex] = parts;
    if (!payloadB64 || !signatureHex) return null;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(AUTH_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const match = signatureHex.match(/.{1,2}/g);
    if (!match) return null;
    const sigBytes = new Uint8Array(match.map(b => parseInt(b, 16)));

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      enc.encode(payloadB64)
    );

    if (!valid) return null;

    const decoded = atob(payloadB64);
    return JSON.parse(decoded) as SessionPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isMyCasePage = pathname.startsWith('/my-case');
  const isMyCaseApi = pathname.startsWith('/api/my-case');

  const isPublicAdminPage = pathname.startsWith('/public-admin') && pathname !== '/public-admin/login';
  const isPublicAdminApi = pathname.startsWith('/api/admin/public');

  const isCaseAdminPage = pathname.startsWith('/case-admin') && pathname !== '/case-admin/login';
  const isCaseAdminApi = pathname.startsWith('/api/admin/case');

  // If the route is not protected, proceed immediately
  if (!isMyCasePage && !isMyCaseApi && !isPublicAdminPage && !isPublicAdminApi && !isCaseAdminPage && !isCaseAdminApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // 1. My Case AI Legal Office Protection
  if (isMyCasePage || isMyCaseApi) {
    if (!session) {
      if (isMyCaseApi) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED: Please sign in to access your My Case workspace.' },
          { status: 401 }
        );
      }
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ZERO-KNOWLEDGE ENFORCEMENT: Case Admin is barred from private advocate case files
    if (session.role === 'case_admin') {
      if (isMyCaseApi) {
        return NextResponse.json(
          { error: 'FORBIDDEN: Case administrators are barred from accessing confidential advocate dossiers.' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/case-admin/dashboard', request.url));
    }

    if (session.role !== 'registered_advocate' && session.role !== 'public_admin') {
      if (isMyCaseApi) {
        return NextResponse.json(
          { error: 'FORBIDDEN: Advocate credentials required.' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // 2. Public Portal Admin Protection
  if (isPublicAdminPage || isPublicAdminApi) {
    if (!session) {
      if (isPublicAdminApi) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED: Please sign in to access admin resources.' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/public-admin/login', request.url));
    }

    if (session.role !== 'public_admin') {
      if (isPublicAdminApi) {
        return NextResponse.json(
          { error: 'FORBIDDEN: Requires Public Portal Administrator privileges.' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/public-admin/login', request.url));
    }
  }

  // 3. My Case Service Admin Protection (Zero-Knowledge Telemetry)
  if (isCaseAdminPage || isCaseAdminApi) {
    if (!session) {
      if (isCaseAdminApi) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED: Please sign in to access case admin resources.' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/case-admin/login', request.url));
    }

    if (session.role !== 'case_admin') {
      if (isCaseAdminApi) {
        return NextResponse.json(
          { error: 'FORBIDDEN: Requires My Case Service Administrator privileges.' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/case-admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/my-case/:path*',
    '/api/my-case/:path*',
    '/public-admin/:path*',
    '/api/admin/public/:path*',
    '/case-admin/:path*',
    '/api/admin/case/:path*'
  ]
};
