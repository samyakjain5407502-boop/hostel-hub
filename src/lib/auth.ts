import type { Role, Session, User } from '@/types';

/**
 * Lightweight JWT-style session tokens (HS256) built on WebCrypto.
 * Works on the Next.js server and in the browser so the demo runs
 * out-of-the-box; swap the `issueSession` call site for a real
 * Server Action + Supabase Auth / Prisma session in production.
 */

const SECRET = process.env.AUTH_SECRET || 'hostelhub_demo_signing_secret_change_me';
const COOKIE = 'hostelhub_session';
const LIFETIME = 60 * 60 * 12; // 12h

const b64u = {
  encode: (data: string | Uint8Array) => {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    let bin = '';
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  decode: (s: string): string => {
    const pad = s.replace(/-/g, '+').replace(/_/g, '/');
    const padded = pad + '='.repeat((4 - (pad.length % 4)) % 4);
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
};

async function sign(input: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(input));
  return b64u.encode(new Uint8Array(sig));
}

/** Issue a signed session token for a user. */
export async function issueSession(user: User): Promise<Session> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64u.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64u.encode(JSON.stringify({
    sub: user.id, role: user.role, name: user.name, studentId: user.studentId,
    iat: now, exp: now + LIFETIME
  }));
  const token = `${header}.${payload}.${await sign(`${header}.${payload}`)}`;
  return { token, role: user.role, user, iat: now, exp: now + LIFETIME };
}

/** Verify and decode a session token; returns null if invalid/expired. */
export async function verifySession(token: string | undefined | null): Promise<Session | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expected = await sign(`${header}.${payload}`);
  if (expected !== sig) return null;
  try {
    const data = JSON.parse(b64u.decode(payload));
    if (!data || !data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    const user: User = { id: data.sub, name: data.name, role: data.role as Role, studentId: data.studentId };
    return { token, role: user.role, user, iat: data.iat, exp: data.exp };
  } catch {
    return null;
  }
}

export { COOKIE };

/* ------------------------------------------------------------------ */
/* Demo credentials (in production these come from your DB + auth flow) */
/* ------------------------------------------------------------------ */
/* NOTE: no static OTP lives here — student logins mint a fresh, random
   6-digit code per session (see `src/lib/otp.ts` + `<OtpBanner />`). */
export const DEMO_STUDENT = { id: 'STU-23045', password: 'hostelhub' };
export const DEMO_ADMIN = { id: 'FAC-1001', key: 'HUB-2026', passkey: '447102' };

export function demoStudentUser(): User {
  return { id: DEMO_STUDENT.id, name: 'Aarav Mehta', role: 'student', studentId: DEMO_STUDENT.id, avatarHue: 248 };
}
export function demoAdminUser(): User {
    return { id: DEMO_ADMIN.id, name: 'Admin User', role: 'admin', email: 'admin@hostelhub.app', avatarHue: 160 };
}