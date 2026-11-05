import crypto from 'crypto';
import type { User, UserRole } from '@/types/database';

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

const AUTH_SECRET = process.env.AUTH_SECRET || 'alwar-advocates-secure-dev-secret-1234567890abcdef';
export const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'alwar_law_session';

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

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_alwar_salt_2026').digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
