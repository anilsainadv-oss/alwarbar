import assert from 'node:assert';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const AUTH_SECRET = 'alwar-advocates-secure-dev-secret-1234567890abcdef';

function signSession(user) {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payload)
    .digest('hex');
  return `${payload}.${signature}`;
}

function verifySession(token) {
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

    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

function verifyPassword(password, hash) {
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    return bcrypt.compareSync(password, hash);
  }
  const legacy = crypto.createHash('sha256').update(password + '_alwar_salt_2026').digest('hex');
  return legacy === hash;
}

export async function runAuthTests() {
  console.log('Testing Authentication & Cryptographic Session Tokens...');

  // 1. Password Hash Verification with Bcrypt
  const rawPass = 'Advocate@2026';
  const hashed = hashPassword(rawPass);
  assert(verifyPassword(rawPass, hashed), 'Password must verify successfully with bcrypt');
  assert(!verifyPassword('WrongPass', hashed), 'Different password must be rejected');
  console.log('  ✓ Password hashing with salt verified');

  // 2. Session Sign and Verification
  const user = {
    id: 'usr-1234',
    email: 'advocate.rajesh@alwarbar.in',
    full_name: 'Advocate Rajesh Sharma',
    role: 'registered_advocate'
  };

  const token = signSession(user);
  const decoded = verifySession(token);
  assert.deepStrictEqual(decoded, user, 'Decoded session user must match original signed user');
  console.log('  ✓ HMAC session signing and verification succeeded');

  // 3. Tampering Prevention
  const tamperedToken = token.slice(0, -4) + 'abcd';
  const tamperedDecoded = verifySession(tamperedToken);
  assert.strictEqual(tamperedDecoded, null, 'Tampered token must fail signature verification');
  console.log('  ✓ Cryptographic tampering correctly rejected with null');
}
