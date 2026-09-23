/**
 * HostelHub · SMS gateway (server-only) — LIVE MODE ONLY
 * ============================================================
 * Phase 6: turns the on-screen demo OTP into a real text message.
 *
 * Provider selection is purely env-driven — no key is ever hardcoded:
 *
 *   SMS_PROVIDER=twilio | fast2sms      (optional explicit override)
 *
 *   Twilio     TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER
 *   Fast2SMS   FAST2SMS_API_KEY         (route 'otp', India DLT)
 *
 * Optional: SMS_COUNTRY_CODE (default 91) — used to build Twilio's E.164
 * `+91XXXXXXXXXX` destination from the 10-digit number the UI collects.
 *
 * DESIGN CONTRACT
 *   • `sendSms()` NEVER throws. It resolves a discriminated result so the
 *     route handler can answer with a clear, actionable error instead of a
 *     502 crash from an unhandled exception.
 *   • No provider configured → `{ ok: false, reason: 'not_configured' }`
 *     naming the exact environment variables to set. Never a crash.
 *   • Mock mode never reaches this module: `deliverOtp()` returns before it
 *     calls `/api/otp/send`, and the route refuses mock deployments outright
 *     so the zero-config demo can never spend SMS credit.
 *   • The plaintext code is never logged — only provider response ids and
 *     error text.
 *
 * Import this ONLY from server code (route handlers / Server Actions).
 */

/** Supported gateways. Extend here + in the sender switch to add another. */
export type SmsProvider = 'twilio' | 'fast2sms';

/** Result of one delivery attempt — a value, never a thrown error. */
export type SmsSendResult =
  | { ok: true; provider: SmsProvider; id?: string }
  | { ok: false; reason: 'not_configured'; message: string; missing: string[] }
  | { ok: false; reason: 'provider_error'; provider: SmsProvider; message: string };

export interface SmsMessage {
  /** Digits the UI collected (10 for India) — E.164 is built from this. */
  mobile: string;
  /** The plaintext OTP. Sent only, never logged, never returned. */
  code: string;
  /** Quoted inside the SMS body so the user knows the deadline. */
  ttlMinutes?: number;
}

/** Give the gateway a hard ceiling so a hung request can't wedge the route. */
const SMS_TIMEOUT_MS = 10_000;

/** Env vars per provider, used to build the "what's missing" message. */
const REQUIRED_ENV: Record<SmsProvider, string[]> = {
  twilio: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER'],
  fast2sms: ['FAST2SMS_API_KEY']
};

/* ------------------------------------------------------------------ */
/* Configuration (env-only)                                            */
/* ------------------------------------------------------------------ */

/** True when every env var the provider needs is present and non-empty. */
function hasProvider(provider: SmsProvider): boolean {
  return REQUIRED_ENV[provider].every((key) => Boolean(process.env[key]?.trim()));
}

/** The provider names whose credentials are complete, in preference order. */
export function configuredSmsProviders(): SmsProvider[] {
  return (['twilio', 'fast2sms'] as SmsProvider[]).filter(hasProvider);
}

/**
 * Which provider to use:
 *   1. an explicit, valid `SMS_PROVIDER` override, else
 *   2. the first provider that actually has complete credentials.
 * Returns `null` (with the required-env list) when nothing is wired.
 */
function resolveProvider(): { provider: SmsProvider | null; missing: string[] } {
  const all = Object.values(REQUIRED_ENV).flat();
  const override = process.env.SMS_PROVIDER?.trim().toLowerCase();
  if (override === 'twilio' || override === 'fast2sms') {
    if (hasProvider(override)) return { provider: override, missing: [] };
    // Override names a provider whose keys are absent → report that one.
    return { provider: null, missing: REQUIRED_ENV[override] };
  }
  const ready = configuredSmsProviders();
  return { provider: ready[0] ?? null, missing: ready.length ? [] : all };
}

/** `true` when any gateway is fully configured (used for logging/UI hints). */
export function isSmsConfigured(): boolean {
  return resolveProvider().provider !== null;
}

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

/** Digits-only 10-digit national number. */
function nationalNumber(mobile: string): string {
  return (mobile ?? '').replace(/\D/g, '').slice(-10);
}

/** `+<country><mobile>` for Twilio, from `SMS_COUNTRY_CODE` (default 91). */
function toE164(mobile: string): string {
  const country = (process.env.SMS_COUNTRY_CODE ?? '91').replace(/\D/g, '') || '91';
  return `+${country}${nationalNumber(mobile)}`;
}

/** The message a student receives (kept identical across providers). */
function buildBody(code: string, ttlMinutes: number): string {
  return `${code} is your HostelHub verification code. It expires in ${ttlMinutes} minute${ttlMinutes === 1 ? '' : 's'}. Never share it with anyone.`;
}

/** `fetch` with a timeout that always clears its timer. */
async function postJson(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SMS_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Delivery                                                            */
/* ------------------------------------------------------------------ */

/** Twilio REST: HTTP Basic auth + form-encoded body. */
async function sendViaTwilio(mobile: string, body: string): Promise<SmsSendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const token = process.env.TWILIO_AUTH_TOKEN!.trim();
  const from = process.env.TWILIO_FROM_NUMBER!.trim();

  const form = new URLSearchParams({ To: toE164(mobile), From: from, Body: body });
  const res = await postJson(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
    {
      method: 'POST',
      headers: {
        // Twilio uses HTTP Basic: account SID as the user, auth token as the password.
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    }
  );

  const payload = (await res.json().catch(() => ({}))) as {
    sid?: string; message?: string; code?: number;
  };
  if (!res.ok) {
    const detail = payload.message ?? `Twilio responded ${res.status}`;
    console.error(`[sms] twilio send failed (${res.status}): ${detail}`);
    return { ok: false, reason: 'provider_error', provider: 'twilio', message: detail };
  }
  return { ok: true, provider: 'twilio', id: payload.sid };
}

/** Fast2SMS: `otp` route, plain JSON + `authorization` header (India). */
async function sendViaFast2Sms(mobile: string, code: string): Promise<SmsSendResult> {
  const key = process.env.FAST2SMS_API_KEY!.trim();
  const res = await postJson('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: { authorization: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      route: 'otp',
      // The `otp` route substitutes `variables_values` into your DLT template.
      variables_values: code,
      numbers: mobile,
      flash: 0
    })
  });

  const payload = (await res.json().catch(() => ({}))) as {
    return?: boolean; request_id?: string; message?: string[] | string;
  };
  const detail = Array.isArray(payload.message) ? payload.message.join('; ') : payload.message;

  if (!res.ok || payload.return === false) {
    const text = detail || `Fast2SMS responded ${res.status}`;
    console.error(`[sms] fast2sms send failed (${res.status}): ${text}`);
    return { ok: false, reason: 'provider_error', provider: 'fast2sms', message: text };
  }
  return { ok: true, provider: 'fast2sms', id: payload.request_id };
}

/**
 * Send the OTP over SMS. ALWAYS resolves — never rejects — so callers map the
 * outcome to a clear HTTP response instead of crashing on an exception.
 *
 *   { ok: true,  provider, id }                    → delivered
 *   { ok: false, reason: 'not_configured', … }     → no credentials in env
 *   { ok: false, reason: 'provider_error', … }     → gateway rejected/failed
 */
export async function sendSms(message: SmsMessage): Promise<SmsSendResult> {
  const { provider, missing } = resolveProvider();
  const ttl = message.ttlMinutes ?? 2;

  if (!provider) {
    const detail =
      'No SMS provider is configured. Set FAST2SMS_API_KEY, or all three of ' +
      'TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER, in ' +
      '.env.local (see .env.example). Leave them unset and keep ' +
      'NEXT_PUBLIC_DATA_MODE=mock to use the on-screen demo OTP instead.';
    console.error(`[sms] ${detail} Missing: ${missing.join(', ') || 'all provider keys'}`);
    return { ok: false, reason: 'not_configured', message: detail, missing };
  }

  const mobile = nationalNumber(message.mobile);
  if (mobile.length !== 10) {
    return {
      ok: false,
      reason: 'provider_error',
      provider,
      message: 'A valid 10-digit mobile number is required to send an OTP.'
    };
  }

  const body = buildBody(message.code, ttl);

  try {
    return provider === 'twilio'
      ? await sendViaTwilio(mobile, body)
      : await sendViaFast2Sms(mobile, message.code);
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'unknown transport error';
    console.error(`[sms] ${provider} delivery threw: ${detail}`);
    return { ok: false, reason: 'provider_error', provider, message: detail };
  }
}


