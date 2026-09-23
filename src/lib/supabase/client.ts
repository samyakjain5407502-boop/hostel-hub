/**
 * Supabase browser client — live-mode only.
 * ============================================================================
 * Phase 2 of the live-backend wiring. This module is a no-op in mock mode:
 * `getSupabaseBrowserClient()` returns `null` immediately when
 * `NEXT_PUBLIC_DATA_MODE !== 'supabase'`, so the default demo never reads
 * Supabase env vars and never creates a client (zero-config, zero network).
 *
 * In live mode it lazily creates one memoized client via `@supabase/ssr`
 * (cookie-backed session so the same auth works in middleware + server),
 * reading credentials strictly from environment variables:
 *
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Import ONLY this module from client components (`store-api.tsx`).
 * Server Components / route handlers should use `./server` instead.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

import { isLiveMode } from '../data-mode';

/** Memoized browser client — created at most once per page load. */
let browserClient: SupabaseClient | null = null;

const MISSING_CONFIG_MESSAGE =
  '[supabase] Live mode is enabled (NEXT_PUBLIC_DATA_MODE=supabase) but the ' +
  'browser client could not be created. Set NEXT_PUBLIC_SUPABASE_URL and ' +
  'NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example).';

/**
 * Returns the Supabase browser client.
 *
 * - Mock mode (default): returns `null` — nothing is initialized, ever.
 * - Live mode, credentials present: returns a memoized client.
 * - Live mode, credentials missing: logs a clear error and returns `null`
 *   (never crashes, never hardcodes keys).
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  // Mock mode must stay fully self-contained — bail out before touching env.
  if (!isLiveMode()) return null;

  if (browserClient) return browserClient;

  // NEXT_PUBLIC_* values are inlined by Next.js at build time — safe here.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error(MISSING_CONFIG_MESSAGE);
    return null;
  }

  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}

/**
 * Like {@link getSupabaseBrowserClient} but fails loudly instead of `null`.
 * Call only inside `if (isLiveMode()) { … }` branches so a misconfigured live
 * deployment surfaces a clear error rather than silently serving stale data.
 */
export function requireSupabaseBrowserClient(): SupabaseClient {
  if (!isLiveMode()) {
    throw new Error(
      '[supabase] requireSupabaseBrowserClient() was called in mock mode. ' +
        'Live-mode code paths must be guarded by isLiveMode().'
    );
  }
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error(MISSING_CONFIG_MESSAGE);
  return client;
}
