/**
 * Supabase server client — live-mode only.
 * ============================================================================
 * For API route handlers, Server Components and Server Actions. Uses
 * `@supabase/ssr`'s `createServerClient`, which reads/writes the auth session
 * through Next.js cookies so RLS policies see the signed-in user.
 *
 * Same contract as the browser client:
 *
 * - Mock mode (default): `getSupabaseServerClient()` returns `null`
 *   immediately — `next/headers` is never touched, no env vars are read.
 * - Live mode: lazily creates a request-scoped client from
 *   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
 * - Live mode with missing credentials: logs a clear error, returns `null`.
 *
 * IMPORTANT: do NOT import this module from client components — `cookies()`
 * only exists in the server runtime. Client code must use `./client`.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { isLiveMode } from '../data-mode';

const MISSING_CONFIG_MESSAGE =
  '[supabase] Live mode is enabled (NEXT_PUBLIC_DATA_MODE=supabase) but the ' +
  'server client could not be created. Set NEXT_PUBLIC_SUPABASE_URL and ' +
  'NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example).';

/**
 * Returns a request-scoped Supabase server client, or `null` in mock mode.
 * Safe to call from route handlers, Server Actions and Server Components.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  // Mock mode must stay fully self-contained — bail out before touching env.
  if (!isLiveMode()) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error(MISSING_CONFIG_MESSAGE);
    return null;
  }

  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component where cookie writes are not
          // allowed — the middleware/session refresh path handles this.
        }
      },
    },
  });
}

/**
 * Like {@link getSupabaseServerClient} but fails loudly instead of `null`.
 * Call only inside `if (isLiveMode()) { … }` branches so a misconfigured live
 * deployment surfaces a clear error rather than silently serving stale data.
 */
export function requireSupabaseServerClient(): SupabaseClient {
  if (!isLiveMode()) {
    throw new Error(
      '[supabase] requireSupabaseServerClient() was called in mock mode. ' +
        'Live-mode code paths must be guarded by isLiveMode().'
    );
  }
  const client = getSupabaseServerClient();
  if (!client) throw new Error(MISSING_CONFIG_MESSAGE);
  return client;
}

/**
 * Service-role client (server-only, live-mode only) — BYPASSES RLS.
 * Powers exactly two things:
 *   1. POST /api/profile/sync — writing the verified app-session `role` into
 *      `profiles` (blocked for end-user JWTs by the
 *      `profiles_block_self_role_change` trigger in supabase/schema.sql).
 *   2. scripts/seed-supabase.ts — the Phase-7 one-time demo seed.
 * Reads `SUPABASE_SERVICE_ROLE_KEY` (never NEXT_PUBLIC_* — must never reach
 * the browser bundle). Returns `null` (with one clear warning) when unset or
 * in mock mode, so callers degrade gracefully instead of crashing.
 */
export function getSupabaseServiceClient(): SupabaseClient | null {
  if (!isLiveMode()) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.warn(
      '[supabase] SUPABASE_SERVICE_ROLE_KEY (and/or NEXT_PUBLIC_SUPABASE_URL) ' +
        'not set — role sync and seeding are disabled. See .env.example.'
    );
    return null;
  }

  // Plain @supabase/supabase-js client: no cookies, no session persistence —
  // the key itself grants the bypass.
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
