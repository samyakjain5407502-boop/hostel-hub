/**
 * POST /api/otp/verify — production verification hook (live mode only).
 * ====================================================================
 * Called by `verifyOtpOnServer()` in `src/lib/otp.ts` when
 * `NEXT_PUBLIC_DATA_MODE` is NOT `mock`.
 *
 * Looks the challenge up by id, compares the typed code in constant time,
 * counts failed attempts and burns the challenge on success — the way any
 * real OTP backend (or Firebase Phone Auth session validation) behaves.
 */

import { NextResponse } from 'next/server';
import { otpServer, isDigits, normalizeMobile, normalizeOtpCode } from '../_store';

/** Tiny constant-time string compare so timing cannot leak the code. */
function safeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i += 1) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      challengeId?: string; mobile?: string; code?: string;
    };
    const challengeId = body.challengeId ?? '';
    const mobile = normalizeMobile(body.mobile ?? '');
    const code = normalizeOtpCode(body.code ?? '');

    if (!challengeId || !isDigits(mobile, 10) || code.length !== 6) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    const result = otpServer.verify(challengeId, mobile, code, safeEqual);
    if (!result) {
      return NextResponse.json({ error: 'challenge_not_found' }, { status: 404 });
    }

    return NextResponse.json({ valid: result.valid, expired: result.expired, locked: result.locked });
  } catch {
    return NextResponse.json({ error: 'verify_failed' }, { status: 500 });
  }
}
