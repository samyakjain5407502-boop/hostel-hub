/**
 * POST /api/otp/send — production SMS delivery hook (live mode only).
 * ==================================================================
 * Called by `deliverOtp()` in `src/lib/otp.ts` when
 * `NEXT_PUBLIC_DATA_MODE` is NOT `mock`.
 *
 * In mock mode the code is minted in the browser and shown on screen, so
 * this route is never hit. In live mode the plaintext code must live on
 * the server only — a real implementation would mint it here (or in a
 * Server Action) and text it, never returning it to the client.
 *
 * Provider wiring — uncomment exactly one and add its env keys
 * (see `.env.example`):
 *
 *   Twilio      ── import twilio from 'twilio';
 *                  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
 *                  await client.messages.create({
 *                    to: `+91${mobile}`,
 *                    from: process.env.TWILIO_FROM_NUMBER,
 *                    body: `${code} is your HostelHub verification code. It expires in 2 minutes.`,
 *                  });
 *
 *   Fast2SMS    ── await fetch('https://www.fast2sms.com/dev/bulkV2', {
 *                    method: 'POST',
 *                    headers: { authorization: process.env.FAST2SMS_API_KEY! },
 *                    body: JSON.stringify({ route: 'otp', variables_values: code, numbers: mobile }),
 *                  });
 *
 *   Firebase    ── skip this endpoint entirely: use `signInWithPhoneNumber`
 *                  on the client and let Firebase Auth own the challenge.
 */

import { NextResponse } from 'next/server';
import { otpServer, isDigits, normalizeMobile } from '../_store';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { challengeId?: string; mobile?: string };
    const challengeId = body.challengeId ?? '';
    const mobile = normalizeMobile(body.mobile ?? '');

    if (!challengeId || !isDigits(mobile, 10)) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    /* Mint the code server-side and open a fresh challenge. The plaintext
       code never leaves this process — the client only learns that the SMS
       went out. */
    otpServer.issue(challengeId, mobile, request.headers.get('origin') ?? undefined);

    /* ── Plug your SMS gateway here (Twilio / Fast2SMS / Firebase) ── */
    // await sendSms(mobile, otpServer.peekCode(challengeId));

    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ error: 'gateway_unavailable' }, { status: 502 });
  }
}
