'use client';

/**
 * Client-side profile/role bridge — LIVE MODE ONLY.
 * ============================================================================
 * The app authenticates with its own signed cookie (AUTH_SECRET JWT carrying
 * role/name/studentId/…), while Supabase RLS reads `profiles.role` keyed by
 * auth.uid(). These two must agree or every staff flow (admissions approve,
 * invoices, operator approve, sponsor toggle…) is denied by RLS in live mode.
 *
 * `ensureProfileSynced()` POSTs to /api/profile/sync AFTER establishing a
 * Supabase session. The route independently verifies the app-session cookie
 * server-side and writes the profile with the SERVICE-ROLE key (the only
 * context the `profiles_block_self_role_change` trigger allows to set roles).
 * The client never sends a role — it cannot be spoofed from here.
 *
 * Contract:
 *   • mock mode               → resolved no-op, zero side effects
 *   • success                 → memoized (`synced = true`), never re-fetched
 *   • no app session yet      → silent no-op (retries on a later call)
 *   • failure (401/503/…)     → logged ONCE per reason, then re-attempted;
 *                               live ops proceed regardless — role-gated
 *                               writes may be denied by RLS until this works,
 *                               which surfaces as a logged error, never a
 *                               crash. Mock mode is entirely unaffected.
 * ============================================================================
 */

import { isLiveMode } from '../data-mode';
import { liveIdentity } from './live-data';

let synced = false;
const warned = new Set<string>();

function warnOnce(key: string, message: string, detail?: unknown) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message, detail ?? '');
}

export function ensureProfileSynced(): Promise<void> {
  if (!isLiveMode() || synced) return Promise.resolve();

  return (async () => {
    try {
      // 1. Establish the Supabase session first (one anon sign-in, memoized
      //    in live-data) so the server can validate it via auth.getUser().
      const ident = await liveIdentity();
      if (!ident) return; // anon sign-in failure already logged by liveIdentity

      // 2. The route re-verifies both sides (app cookie + Supabase session)
      //    and upserts profiles with the service-role key.
      const res = await fetch('/api/profile/sync', { method: 'POST' });
      if (res.ok) {
        synced = true;
        return;
      }
      if (res.status === 401) {
        // Not signed into the app yet (public marketplace/onboard pages) —
        // expected; retry silently on the next call after login.
        return;
      }
      const body: { reason?: string } = await res.json().catch(() => ({}));
      warnOnce(
        `sync-${res.status}-${body.reason ?? ''}`,
        `[live] profile role sync failed (${res.status}: ${body.reason ?? 'unknown'}) — ` +
          'staff RLS writes may be denied until SUPABASE_SERVICE_ROLE_KEY is configured.'
      );
    } catch (err) {
      warnOnce('sync-ex', '[live] profile role sync threw — continuing without it', err);
    }
  })();
}