/**
 * POST /api/otp/send — live-mode SMS delivery (Phase 6).
 * ==================================================================
 * Called by `deliverOtp()` in `src/lib/otp.ts` when NEXT_PUBLIC_DATA_MODE
 * is NOT `mock`. Mock mode mints and shows the code in the browser, so it
 * never reaches this route — and the guard below refuses it outright, so
 * the zero-config demo can never spend SMS credit.
 *
 * Flow
 *   1. validate the challenge id + 10-digit mobile
 *   2. mint the plaintext code server-side (it is never returned to the client)
 *   3. hand it to `sendSms()` in `src/lib/sms.ts`, which picks Twilio or
 *      Fast2SMS from environment variables only — no key is ever hardcoded
 *   4. map the result onto a clear HTTP response
 *
 * Failure handling — never a crash:
 *   • no provider configured → 503 { error: 'sms_not_configured', missing: [...] }
 *   • provider rejected      → 502 { error: 'sms_provider_error', ... }
 *   • malformed request      → 400 { error: 'invalid_request' }
 * The UI turns any non-2xx into the friendly `auth.otp.gatewayFail` toast.
 */

import { NextResponse } from 'next/server';

import { isLiveMode } from '@/lib/data-mode';
import { OTP_TTL_MS } from '@/lib/otp';
import { sendSms } from '@/lib/sms';
import { otpServer, isDigits, normalizeMobile } from '../_store';

export async function POST(request: Request) {
  // Mock mode: the demo OTP is on-screen only — refuse to text anything.
  if (!isLiveMode()) {
    return NextResponse.json({ error: 'mock_mode' }, { status: 400 });
  }

  let body: { challengeId?: string; mobile?: string };
  try {
    body = (await request.json()) as { challengeId?: string; mobile?: string };
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const challengeId = body.challengeId ?? '';
  const mobile = normalizeMobile(body.mobile ?? '');

  if (!challengeId || !isDigits(mobile, 10)) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  /* Mint the code server-side and open a fresh challenge. The plaintext
     code never leaves this process — the client only learns that the SMS
     went out. */
  otpServer.issue(challengeId, mobile, request.headers.get('origin') ?? undefined);
  const code = otpServer.peekCode(challengeId) ?? '';

  const ttlMinutes = Math.max(1, Math.round(OTP_TTL_MS / 60_000));
  const result = await sendSms({ mobile, code, ttlMinutes });

  if (result.ok) {
    return NextResponse.json({ sent: true, provider: result.provider, id: result.id });
  }

  // Graceful, actionable failures — a thrown exception never escapes here.
  if (result.reason === 'not_configured') {
    return NextResponse.json(
      { error: 'sms_not_configured', message: result.message, missing: result.missing },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: 'sms_provider_error', provider: result.provider, message: result.message },
    { status: 502 }
  );
}
