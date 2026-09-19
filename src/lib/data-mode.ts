/**
 * Data-mode switch for HostelHub.
 * ------------------------------------------------------------------
 * `NEXT_PUBLIC_DATA_MODE` decides how the app gets its data:
 *
 *   • `mock`     (default) — zero-config demo: seed data + localStorage,
 *                            and service flows (e.g. OTP) are self-contained.
 *   • `supabase` (live)    — Supabase/Prisma backend; network service hooks
 *                            such as the SMS gateway are expected to be wired.
 *
 * The value is inlined at build time (NEXT_PUBLIC_*), so this module is safe
 * to import from both Server and Client Components.
 */

export type DataMode = 'mock' | 'supabase';

const RAW_MODE = (process.env.NEXT_PUBLIC_DATA_MODE ?? 'mock').trim().toLowerCase();

/** Resolved data mode — anything unrecognised falls back to the safe demo mode. */
export const DATA_MODE: DataMode = RAW_MODE === 'supabase' ? 'supabase' : 'mock';

/** True while the app runs on seed data and local-only service flows. */
export function isMockMode(): boolean {
  return DATA_MODE === 'mock';
}

/** True when a real backend (Supabase/Prisma + live service providers) is expected. */
export function isLiveMode(): boolean {
  return DATA_MODE === 'supabase';
}
