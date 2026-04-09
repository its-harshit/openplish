import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { getStorage } from './store/storage.js';

const SECURE_KEY = 'policy_admin_lock_v1';

interface StoredLock {
  v: 1;
  saltB64: string;
  hashB64: string;
}

export function isPolicyLockConfigured(): boolean {
  const raw = getStorage().get(SECURE_KEY);
  return raw !== null && raw.length > 0;
}

export function verifyPolicyLockPassword(password: string): boolean {
  const raw = getStorage().get(SECURE_KEY);
  if (!raw) {
    return false;
  }
  let parsed: StoredLock;
  try {
    parsed = JSON.parse(raw) as StoredLock;
  } catch {
    return false;
  }
  if (parsed.v !== 1 || !parsed.saltB64 || !parsed.hashB64) {
    return false;
  }
  const salt = Buffer.from(parsed.saltB64, 'base64');
  const expected = Buffer.from(parsed.hashB64, 'base64');
  const hash = scryptSync(password, salt, 64);
  if (expected.length !== hash.length) {
    return false;
  }
  return timingSafeEqual(expected, hash);
}

export function setPolicyLockPassword(password: string): void {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  const stored: StoredLock = {
    v: 1,
    saltB64: salt.toString('base64'),
    hashB64: hash.toString('base64'),
  };
  getStorage().set(SECURE_KEY, JSON.stringify(stored));
}

export function clearPolicyLockPassword(): void {
  getStorage().deleteSecureKey(SECURE_KEY);
}
