import { cookies } from 'next/headers';
import { verifySession, COOKIE_NAME, SessionUser } from './session';
import { localDb } from '@/lib/db';

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySession(token);
  } catch {
    return null;
  }
}

export function assertAuthenticated(user: SessionUser | null): asserts user is SessionUser {
  if (!user) {
    throw new Error('UNAUTHORIZED: Authentication required to access this resource.');
  }
}

export function assertAdvocate(user: SessionUser | null): asserts user is SessionUser {
  assertAuthenticated(user);
  if (user.role !== 'registered_advocate') {
    throw new Error('FORBIDDEN: Requires registered advocate credentials.');
  }
}

export function assertPublicAdmin(user: SessionUser | null): asserts user is SessionUser {
  assertAuthenticated(user);
  if (user.role !== 'public_admin') {
    throw new Error('FORBIDDEN: Requires Public Portal Administrator privileges.');
  }
}

export function assertCaseAdmin(user: SessionUser | null): asserts user is SessionUser {
  assertAuthenticated(user);
  if (user.role !== 'case_admin') {
    throw new Error('FORBIDDEN: Requires My Case Service Administrator privileges.');
  }
}

/**
 * STRICT ZERO-KNOWLEDGE BARRIER:
 * Case Administrators are barred from reading private case dossiers, documents, or client records.
 */
export function assertAdvocateOwnership(user: SessionUser | null, targetAdvocateId: string): void {
  assertAuthenticated(user);
  if (user.id !== targetAdvocateId) {
    throw new Error('ACCESS_DENIED: Advocates may only view and mutate their own confidential case files.');
  }
}
