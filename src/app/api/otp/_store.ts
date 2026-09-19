/**
 * Server-side OTP challenge store (live mode only).
 * ==================================================
 * Mock mode never touches this: there the code is minted in the browser,
 * shown on screen and verified locally (see `src/lib/otp.ts`).
 *
 * In live mode the plaintext code lives *only* here. Challenges expire in
 * two minutes, allow five wrong attempts, and are burned on success.
 *
 * This in-memory map is a zero-dependency placeholder that keeps the API
 * contract complete. For production swap `otpServer` internals for
 * Supabase / Redis / Prisma — nothing else in the app changes.
 */

import { generateOtp, OTP_TTL_MS, OTP_MAX_ATTEMPTS } from '@/lib/otp';

interface ServerChallenge {
  mobile: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  burned: boolean;
}

const store = new Map<string, ServerChallenge>();

export function normalizeMobile(raw: string): string {
  return (raw ?? '').replace(/\D/g, '').slice(-10);
}

export function normalizeOtpCode(raw: string): string {
  return (raw ?? '').replace(/\D/g, '').slice(0, 6);
}

export function isDigits(value: string, length: number): boolean {
  return value.length === length && /^\d+$/.test(value);
}

export const otpServer = {
  /** Mint a fresh code for `challengeId` and open a live challenge. */
  issue(challengeId: string, mobile: string, _origin?: string): void {
    const now = Date.now();
    store.set(challengeId, {
      mobile,
      code: generateOtp(),
      createdAt: now,
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
      burned: false,
    });
  },

  /**
   * Verify a typed code. Returns `null` when the challenge id is unknown.
   * A success burns the challenge; failed attempts count toward the lock.
   */
  verify(
    challengeId: string,
    mobile: string,
    code: string,
    safeEqual: (a: string, b: string) => boolean
  ): { valid: boolean; expired: boolean; locked: boolean } | null {
    const challenge = store.get(challengeId);
    if (!challenge || challenge.burned || challenge.mobile !== mobile) return null;

    const now = Date.now();
    if (challenge.expiresAt <= now) {
      store.delete(challengeId);
      return { valid: false, expired: true, locked: false };
    }
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      store.delete(challengeId);
      return { valid: false, expired: false, locked: true };
    }

    if (safeEqual(challenge.code, code)) {
      store.delete(challengeId); // one successful use, then burn
      return { valid: true, expired: false, locked: false };
    }

    challenge.attempts += 1;
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) store.delete(challengeId);
    return { valid: false, expired: false, locked: false };
  },

  /** Test/inspection helper — the code for a live challenge, if any. */
  peekCode(challengeId: string): string | undefined {
    return store.get(challengeId)?.code;
  },
};
