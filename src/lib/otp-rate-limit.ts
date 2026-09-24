/**
 * Server-side rate limiting for POST /api/otp/send (live mode only).
 * ==================================================================
 * The UI already enforces a 30-second resend cooldown
 * (`OTP_RESEND_COOLDOWN_MS` in `@/lib/otp`), but UI checks are trivially
 * bypassed by calling the endpoint directly with fresh challenge ids —
 * which would let a bot trigger unlimited SMS sends (and SMS provider
 * cost) once Twilio/Fast2SMS is connected. This module closes that hole
 * with three server-side limits:
 *
 *   • per mobile — max 1 send per `OTP_RESEND_COOLDOWN_MS` (30 s)
 *   • per mobile — max 5 sends per rolling hour
 *   • per IP     — max 10 send requests per rolling hour (second layer,
 *                  so one source can't cycle through many numbers)
 *
 * Storage follows the same zero-dependency, in-memory `Map` pattern used
 * by the OTP challenge store (`src/app/api/otp/_store.ts`). Note the usual
 * caveats of in-memory state: these counters reset on server restart and
 * are NOT shared across instances if this app is ever horizontally scaled
 * — both are acceptable for the current single-instance Render deployment.
 * If the app is ever scaled out, swap these Maps for a shared Redis /
 * database without touching the call sites below.
 *
 * The check-and-record step is synchronous, so concurrent requests cannot
 * slip past the limits (Node executes it as one atomic step).
 */

import { OTP_RESEND_COOLDOWN_MS } from '@/lib/otp';

/** Rolling window for the hourly caps. */
const HOUR_MS = 60 * 60 * 1000;
/** Max SMS sends to one mobile number within a rolling hour. */
const MAX_SENDS_PER_MOBILE_PER_HOUR = 5;
/** Max send requests from one IP address within a rolling hour. */
const MAX_SENDS_PER_IP_PER_HOUR = 10;

/** Send timestamps (ms since epoch) per mobile number, pruned to the rolling hour. */
const mobileHits = new Map<string, number[]>();
/** Send timestamps (ms since epoch) per client IP, pruned to the rolling hour. */
const ipHits = new Map<string, number[]>();

export type OtpSendRateDecision =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

/** Extract the caller IP from the request (Render/typical proxies set `x-forwarded-for`). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  if (first) return first;
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return 'unknown'; // shared fallback bucket when no proxy header is present
}

/** Drop timestamps that fell out of the rolling hour. Returns the pruned list (or undefined). */
function prune(hits: number[] | undefined, now: number): number[] | undefined {
  if (!hits) return undefined;
  const cutoff = now - HOUR_MS;
  let start = 0;
  while (start < hits.length && hits[start] <= cutoff) start += 1;
  if (start === hits.length) return [];
  return start === 0 ? hits : hits.slice(start);
}

/** Periodically drop fully-stale keys so the Maps cannot grow without bound. */
let callsSinceSweep = 0;
function sweep(now: number): void {
  callsSinceSweep += 1;
  if (callsSinceSweep < 100) return;
  callsSinceSweep = 0;
  for (const [key, hits] of mobileHits) {
    if (hits.length === 0 || hits[hits.length - 1] <= now - HOUR_MS) mobileHits.delete(key);
  }
  for (const [key, hits] of ipHits) {
    if (hits.length === 0 || hits[hits.length - 1] <= now - HOUR_MS) ipHits.delete(key);
  }
}

/** Build a denial with a positive, whole-second retry hint (min 1 s). */
function deny(msUntilRetry: number): OtpSendRateDecision {
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(msUntilRetry / 1000)) };
}

/**
 * Check (and, when allowed, record) one OTP send attempt.
 * Limits: 1 per cooldown per mobile, 5/hour per mobile, 10/hour per IP.
 */
export function checkOtpSendRateLimit(mobile: string, ip: string): OtpSendRateDecision {
  const now = Date.now();
  sweep(now);

  const mobileLog = prune(mobileHits.get(mobile), now) ?? [];
  const ipLog = prune(ipHits.get(ip), now) ?? [];

  // 1) Per-mobile cooldown — server-side twin of the UI's resend timer.
  const lastSend = mobileLog[mobileLog.length - 1];
  if (lastSend !== undefined && now - lastSend < OTP_RESEND_COOLDOWN_MS) {
    return deny(lastSend + OTP_RESEND_COOLDOWN_MS - now);
  }

  // 2) Per-mobile hourly cap — stops a number from being spammed all day.
  if (mobileLog.length >= MAX_SENDS_PER_MOBILE_PER_HOUR) {
    return deny(mobileLog[0] + HOUR_MS - now);
  }

  // 3) Per-IP hourly cap — stops one source cycling through many numbers.
  if (ipLog.length >= MAX_SENDS_PER_IP_PER_HOUR) {
    return deny(ipLog[0] + HOUR_MS - now);
  }

  // Allowed — record before the provider call so a slow/failing SMS
  // gateway can't be hammered either.
  mobileLog.push(now);
  ipLog.push(now);
  mobileHits.set(mobile, mobileLog);
  ipHits.set(ip, ipLog);
  return { allowed: true };
}