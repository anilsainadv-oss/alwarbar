import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@/types/database';

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

const AUTH_SECRET = process.env.AUTH_SECRET || 'alwar-advocates-secure-dev-secret-1234567890abcdef';
export const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'alwar_law_session';

const BCRYPT_ROUNDS = 12;

export function signSession(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payload)
    .digest('hex');
  return `${payload}.${signature}`;
}

export function verifySession(token: string): SessionUser | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(payload)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    return data as SessionUser;
  } catch {
    return null;
  }
}

/**
 * Industry standard password hashing using bcrypt with 12 salt rounds.
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

/**
 * Secure password verification supporting bcrypt hashes with safe fallback
 * for legacy SHA-256 migration hashes.
 */
export function verifyPassword(password: string, hash: string): boolean {
  if (!password || !hash) return false;

  // Modern bcrypt hash check ($2a$, $2b$, or $2y$)
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    try {
      return bcrypt.compareSync(password, hash);
    } catch {
      return false;
    }
  }

  // Backward-compatibility during migration: verify against legacy SHA-256 static salt hash
  try {
    const legacyHash = crypto
      .createHash('sha256')
      .update(password + '_alwar_salt_2026')
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(legacyHash), Buffer.from(hash));
  } catch {
    return false;
  }
}
