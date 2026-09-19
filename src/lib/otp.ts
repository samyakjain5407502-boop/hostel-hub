/**
 * HostelHub · Dynamic OTP engine
 * ==================================================================
 * Nothing here is hardcoded: every "Send OTP" tap mints a *fresh*
 * 6-digit code with a cryptographic RNG, stored on a short-lived
 * challenge that carries its own expiry, attempt counter and resend
 * cooldown.
 *
 * Two run modes (see `@/lib/data-mode`):
 *
 *   • mock  — the code is generated in the browser, surfaced on screen
 *             (see `<OtpBanner />`) and verified locally against the
 *             challenge, so the demo works with zero infrastructure.
 *   • live  — the code is minted/verified by your backend; this module
 *             only orchestrates the request through `deliverOtp()` and
 *             `verifyOtp()` (Twilio / Fast2SMS / Firebase hooks below).
 *
 * ️ Security note: local verification exists purely for the demo. In
 * production (live mode) the plaintext code must never reach the client —
 * `verifyOtp()` delegates to your route handler and the server burns the
 * challenge on success.
 */

import { isMockMode } from '@/lib/data-mode';

export const OTP_LENGTH = 6;
/** A code stays valid for two minutes — long enough to type, short enough to stay safe. */
export const OTP_TTL_MS = 120_000;
/** Wrong guesses allowed before the challenge burns and a new one must be requested. */
export const OTP_MAX_ATTEMPTS = 5;
/** Minimum gap between two "resend" taps (prevents SMS flooding). */
export const OTP_RESEND_COOLDOWN_MS = 30_000;

export type OtpStatus = 'ok' | 'empty' | 'expired' | 'mismatch' | 'locked';

export interface OtpChallenge {
  /** Opaque id shared with the backend so it can burn the right row. */
  id: string;
  /** Digits-only mobile number the code was issued for. */
  mobile: string;
  /**
   * The freshly generated code. Populated in mock mode only — in live mode the
   * code lives on the server and this stays empty.
   */
  code: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

export interface OtpVerification {
  ok: boolean;
  status: OtpStatus;
  /** Challenge carrying the updated attempt counter — keep it in state. */
  challenge: OtpChallenge;
}

export interface OtpDelivery {
  /** `mock` = shown on screen, `sms` = handed to a real gateway. */
  via: 'mock' | 'sms';
}

/* ------------------------------------------------------------------ */
/* Randomness                                                          */
/* ------------------------------------------------------------------ */

/** WebCrypto when available, with a non-crypto fallback for exotic runtimes. */
function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  const webCrypto = typeof globalThis.crypto !== 'undefined' ? globalThis.crypto : undefined;
  if (webCrypto && typeof webCrypto.getRandomValues === 'function') {
    webCrypto.getRandomValues(bytes);
    return bytes;
  }
  for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return bytes;
}

/**
 * Mint a brand-new numeric OTP.
 * Uniformly distributed over `[0, 10^length)` and never an all-identical
 * sequence (e.g. `000000`) — those get fat-fingered or guessed.
 */
export function generateOtp(length: number = OTP_LENGTH): string {
  const bytes = randomBytes(length * 4);
  let code = '';
  for (let i = 0; i < length; i += 1) {
    let chunk = 0;
    for (let j = 0; j < 4; j += 1) chunk = chunk * 256 + bytes[i * 4 + j];
    code += String(chunk % 10);
  }
  if (/^(\d)\1+$/.test(code)) return generateOtp(length);
  return code;
}

/** Opaque challenge id (`otp_<16 hex chars>`). */
function createChallengeId(): string {
  return `otp_${Array.from(randomBytes(8), (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

/** Compare two codes without leaking length/position through early exits. */
function safeEqual(a: string, b: string): boolean {
  if (a.length === 0 || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ------------------------------------------------------------------ */
/* Mobile helpers                                                      */
/* ------------------------------------------------------------------ */

/** Strip formatting and a leading country/trunk prefix (`+91`, `0`). */
export function normalizeMobile(input: string): string {
  let digits = (input ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

/** Accepts Indian 10-digit mobiles (6–9 start) and international 10–15 digit numbers. */
export function isValidMobile(input: string): boolean {
  const digits = normalizeMobile(input);
  if (digits.length === 10) return /^[6-9]\d{9}$/.test(digits);
  return digits.length > 10 && digits.length <= 15;
}

/** Digits only, capped to the OTP length — used for the input field's onChange. */
export function normalizeOtp(input: string): string {
  return (input ?? '').replace(/\D/g, '').slice(0, OTP_LENGTH);
}

/** `9826011223` → `+91 ••••• 1223` (kept readable in the banner + toasts). */
export function maskMobile(input: string): string {
  const digits = normalizeMobile(input);
  const last4 = digits.slice(-4);
  if (digits.length === 10) return `+91 ••••• ${last4}`;
  if (digits.length > 4) return `${'•'.repeat(Math.min(5, digits.length - 4))} ${last4}`;
  return digits || 'your mobile';
}

/* ------------------------------------------------------------------ */
/* Challenge lifecycle                                                 */
/* ------------------------------------------------------------------ */

/** Mint a fresh challenge (new code, fresh TTL, zero attempts) for a mobile. */
export function createOtpChallenge(mobile: string, now: number = Date.now()): OtpChallenge {
  const digits = normalizeMobile(mobile);
  return {
    id: createChallengeId(),
    mobile: digits,
    code: isMockMode() ? generateOtp() : '',
    createdAt: now,
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
  };
}

/**
 * "Resend" — always a *new* code on a *new* challenge, never a replay of the
 * previous one (the old code dies with the challenge it belonged to).
 */
export function resendOtp(mobile: string, now: number = Date.now()): OtpChallenge {
  return createOtpChallenge(mobile, now);
}

/** Seconds until the code expires (0 once dead). */
export function secondsLeft(challenge: OtpChallenge | null, now: number = Date.now()): number {
  if (!challenge) return 0;
  return Math.max(0, Math.ceil((challenge.expiresAt - now) / 1000));
}

/** Seconds until the next resend is allowed (0 = allowed right now). */
export function resendSecondsLeft(challenge: OtpChallenge | null, now: number = Date.now()): number {
  if (!challenge) return 0;
  return Math.max(0, Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - challenge.createdAt)) / 1000));
}

/** Attempts remaining before the challenge burns. */
export function attemptsLeft(challenge: OtpChallenge | null): number {
  if (!challenge) return 0;
  return Math.max(0, OTP_MAX_ATTEMPTS - challenge.attempts);
}

/* ------------------------------------------------------------------ */
/* Delivery + verification                                             */
/* ------------------------------------------------------------------ */

/**
 * Hand the code to the delivery channel.
 *
 * mock → resolved locally (the UI shows the code in `<OtpBanner />`).
 * live → `POST /api/otp/send`, a Route Handler / Server Action where you plug in:
 *
 *   Twilio      ── const client = twilio(SID, TOKEN);
 *                  await client.messages.create({ to: `+91${mobile}`, from: TWILIO_FROM, body });
 *
 *   Fast2SMS    ── await fetch('https://www.fast2sms.com/dev/bulkV2', {
 *                    method: 'POST', headers: { authorization: FAST2SMS_KEY },
 *                    body: JSON.stringify({ route: 'otp', variables_values: code, numbers: mobile })
 *                  });
 *
 *   Firebase    ── const confirmation = await signInWithPhoneNumber(auth, `+91${mobile}`, recaptcha);
 *                  (client-side; skip this endpoint entirely and let Auth own the challenge)
 */
export async function deliverOtp(challenge: OtpChallenge): Promise<OtpDelivery> {
  if (isMockMode()) return { via: 'mock' };

  const res = await fetch('/api/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId: challenge.id, mobile: challenge.mobile }),
  });
  if (!res.ok) throw new Error('otp_gateway_unavailable');
  return { via: 'sms' };
}

/**
 * Verify a typed code against the live challenge.
 * Returns a status the caller maps to a friendly message, plus the challenge
 * with its attempt counter moved forward.
 */
export async function verifyOtp(
  challenge: OtpChallenge,
  input: string,
  now: number = Date.now()
): Promise<OtpVerification> {
  const typed = normalizeOtp(input);

  if (!typed) return { ok: false, status: 'empty', challenge };
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, status: 'locked', challenge };
  if (challenge.expiresAt <= now) return { ok: false, status: 'expired', challenge };

  if (!isMockMode()) {
    /* Production: compare on the server, where the plaintext code never leaves. */
    const ok = await verifyOtpOnServer(challenge, typed);
    return { ok, status: ok ? 'ok' : 'mismatch', challenge: { ...challenge, attempts: challenge.attempts + (ok ? 0 : 1) } };
  }

  const ok = safeEqual(challenge.code, typed);
  return { ok, status: ok ? 'ok' : 'mismatch', challenge: { ...challenge, attempts: challenge.attempts + (ok ? 0 : 1) } };
}

/**
 * Live-mode hook — `POST /api/otp/verify` should look the challenge up by id,
 * compare the code in constant time, burn it on success and return `{ valid }`.
 */
async function verifyOtpOnServer(challenge: OtpChallenge, code: string): Promise<boolean> {
  try {
    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: challenge.id, mobile: challenge.mobile, code }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { valid?: boolean };
    return data.valid === true;
  } catch {
    return false;
  }
}
