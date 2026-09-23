/**
 * Live-mode persistence — PHASE 5 entity set:
 *   Hostels (owners + branches), beds (the /management/inventory matrix),
 *   applications/admissions, bookings, invoices, gate passes.
 *   → colleges & operators are wired in their own localStorage-backed
 *     modules (college-registry.ts, management/operators page).
 *   → `inventory_items` (article stock) has no app-side consumer yet, so
 *     there is nothing to mirror for it (schema + RLS are already ready).
 *
 * MOCK-SAFETY CONTRACT — identical to live-data.ts:
 *   • every helper starts with isLiveMode()/getSupabaseBrowserClient() →
 *     in mock mode: no env read, no network, zero side effects;
 *   • store-api.tsx only calls these inside `if (isLiveMode())` blocks.
 *
 * DESIGN — same "Supabase = source of truth, local slice = render cache"
 * pattern as Phase 4: the synchronous local commit stays for instant UI,
 * then the same computed row is pushed to Supabase; hydrateOperations()
 * overwrites these slices from the DB on the next load. Final-value writes
 * can clobber concurrent devices (no delta RPCs) — demo-acceptable, flagged.
 *
 * ROLE BRIDGE — every op awaits ensureProfileSynced() first so staff RLS
 * (admissions approve, sponsor toggle, desk updates…) sees the app session's
 * role. Until then such writes may be denied — surfaced as logged `[live]`
 * errors, never crashes; mock mode is unaffected.
 * NOTE — PostgREST UPDATE blocked by RLS matches 0 rows WITHOUT an error,
 * so updates use `.select('id')` and treat "0 rows" as a visible failure.
 */

import { getSupabaseBrowserClient } from './client';
import { isLiveMode } from '../data-mode';
import { liveIdentity } from './live-data';
import { ensureProfileSynced } from './profile-sync';
// Row mapping lives in a pure module so scripts/seed-supabase.ts can reuse the
// exact same conventions (see the header of ./mapping).
import {
  appFromRow, appToRow, bedFromRow, bedToRow, bookingFromRow, bookingToRow,
  branchFromRow, branchToRow, invoiceFromRow, invoiceToRow, iso, ms,
  ownerFromRow, ownerToRow, passFromRow, passToRow
} from './mapping';
import type {
  AppRow, BedRow, BookingRow, BranchRow, GatePassRow, InvoiceRow, OwnerRow
} from './mapping';
import type {
  Branch, FeeInvoice, GatePass, OwnerProfile, RoomBed, StudentApplication,
  TokenBooking
} from '../../types';
import type { DbSnapshot } from '../store-core';

/* ---------- shared runner ----------
 * Contract (mirrors Phase 4):
 *   1. mock / no env            → immediate return (client is null)
 *   2. bridge app-session role  → ensureProfileSynced() (memoized)
 *   3. establish identity       → liveIdentity() (one anon sign-in, memoized)
 *   4. any thrown error         → one logged `[live] <label> failed`, no crash
 * Supabase helpers do NOT throw on `error` results — each caller must
 * `if (error) throw error;` (or check affected rows) so step 4 sees it.
 */
async function op(label: string, run: (sb: import('@supabase/supabase-js').SupabaseClient, userId: string) => Promise<void>): Promise<void> {
  if (!isLiveMode()) return;
  await ensureProfileSynced();
  const ident = await liveIdentity();
  if (!ident) return;
  try {
    await run(ident.sb, ident.userId);
  } catch (err) {
    console.error(`[live] ${label} failed`, err);
  }
}

/** UPDATE helper: RLS-filtered updates that hit 0 rows look "successful"
 *  to PostgREST — surface that as an error instead. */
function assertOneAffected(
  res: { data: unknown[] | null; error: { message: string } | null },
  what: string
): void {
  if (res.error) throw new Error(res.error.message);
  if (!res.data || res.data.length === 0) {
    throw new Error(`${what}: no row updated (missing id, or RLS denied it)`);
  }
}

/* ---------- write ops: marketplace + admissions ---------- */

/** registerOwner — public insert policy (the /onboard KYC funnel is signed out). */
export function liveRegisterOwner(o: OwnerProfile): Promise<void> {
  return op('registerOwner', async (sb) => {
    const { error } = await sb.from('owners').insert(ownerToRow(o));
    if (error) throw error;
  });
}

/** registerBranch — public insert policy (same onboarding funnel / admin console). */
export function liveRegisterBranch(b: Branch): Promise<void> {
  return op('registerBranch', async (sb) => {
    const { error } = await sb.from('branches').insert(branchToRow(b));
    if (error) throw error;
  });
}

/** toggleSponsor — staff RLS (admin/management after role sync). */
export function liveToggleSponsor(branchId: string, sponsored: boolean): Promise<void> {
  return op('toggleSponsor', async (sb) => {
    const res = await sb.from('branches')
      .update({ sponsored })
      .eq('id', branchId)
      .select('id');
    assertOneAffected(res, 'toggleSponsor');
  });
}

/** applyForHostel — students insert rows keyed by their own roll number. */
export function liveApplyForHostel(app: StudentApplication): Promise<void> {
  return op('applyForHostel', async (sb) => {
    const { error } = await sb.from('applications').insert(appToRow(app));
    if (error) throw error;
  });
}

/** decideApplication — desk RLS decides; approving also locks the bed.
 *  Mirrors decideApplication()'s local math: bed only locks when Approved. */
export function liveDecideApplication(
  id: string, status: StudentApplication['status'], bedId: string | null
): Promise<void> {
  return op('decideApplication', async (sb) => {
    const res = await sb.from('applications')
      .update({ status, bed_id: bedId, decided_at: new Date().toISOString() })
      .eq('id', id)
      .select('id');
    assertOneAffected(res, 'decideApplication');
    if (bedId && status === 'Approved') {
      const bedRes = await sb.from('beds')
        .update({ status: 'Locked' })
        .eq('id', bedId)
        .select('id');
      assertOneAffected(bedRes, 'decideApplication→lock bed');
    }
  });
}

/** onboardWalkIn — desk RLS: bed upsert first (application FKs to it). */
export function liveOnboardWalkIn(bed: RoomBed, app: StudentApplication): Promise<void> {
  return op('onboardWalkIn', async (sb) => {
    const bedRes = await sb.from('beds')
      .upsert(bedToRow(bed), { onConflict: 'id' })
      .select('id');
    if (bedRes.error) throw bedRes.error;
    const { error } = await sb.from('applications').insert(appToRow(app));
    if (error) throw error;
  });
}

/** bookToken — insert the Held booking, then lock the bed (as local does). */
export function liveBookToken(booking: TokenBooking): Promise<void> {
  return op('bookToken', async (sb) => {
    const { error } = await sb.from('bookings').insert(bookingToRow(booking));
    if (error) throw error;
    const bedRes = await sb.from('beds')
      .update({ status: 'Locked' })
      .eq('id', booking.bedId)
      .select('id');
    assertOneAffected(bedRes, 'bookToken→lock bed');
  });
}

/** confirmArrival — flip booking → Confirmed and bed → Booked. */
export function liveConfirmArrival(booking: TokenBooking): Promise<void> {
  return op('confirmArrival', async (sb) => {
    const res = await sb.from('bookings')
      .update({
        status: 'Confirmed',
        actual_arrival: new Date().toISOString()
      })
      .eq('id', booking.id)
      .select('id');
    assertOneAffected(res, 'confirmArrival');
    const bedRes = await sb.from('beds')
      .update({ status: 'Booked' })
      .eq('id', booking.bedId)
      .select('id');
    assertOneAffected(bedRes, 'confirmArrival→book bed');
  });
}

/* ---------- write ops: fees, gate passes, bed matrix ---------- */

/** buildInvoice — fee desk RLS (management/admin) issues the bill. */
export function liveBuildInvoice(invoice: FeeInvoice): Promise<void> {
  return op('buildInvoice', async (sb) => {
    const { error } = await sb.from('invoices').insert(invoiceToRow(invoice));
    if (error) throw error;
  });
}

/** markInvoicePaid — allowed for the desk on any bill AND for the student
 *  on their OWN bill (RLS `invoices_update_own` — the ledger's "Mark as
 *  paid" demo action; a real gateway would settle server-side). */
export function liveMarkInvoicePaid(invoiceId: string): Promise<void> {
  return op('markInvoicePaid', async (sb) => {
    const res = await sb.from('invoices')
      .update({ paid: true })
      .eq('id', invoiceId)
      .select('id');
    assertOneAffected(res, 'markInvoicePaid');
  });
}

/** requestGatePass — students insert for THEIR roll number (RLS
 *  `gate_passes_insert_own`); the desk can issue walk-ins. */
export function liveRequestGatePass(gp: GatePass): Promise<void> {
  return op('requestGatePass', async (sb) => {
    const { error } = await sb.from('gate_passes').insert(passToRow(gp));
    if (error) throw error;
  });
}

/** setGatePassStatus — desk transitions anything; a student driving their
 *  own pass (Out → Returned) is allowed by RLS, but `with check` forbids
 *  them forging Approved/Rejected — that surfaces as "no row updated". */
export function liveSetGatePassStatus(
  id: string, status: GatePass['status'], actualReturn: number | null
): Promise<void> {
  return op('setGatePassStatus', async (sb) => {
    const res = await sb.from('gate_passes')
      .update({
        status,
        actual_return: status === 'Returned' ? new Date().toISOString()
          : actualReturn != null ? new Date(actualReturn).toISOString() : null
      })
      .eq('id', id)
      .select('id');
    assertOneAffected(res, 'setGatePassStatus');
  });
}

/** setBedStatus — bed matrix edits are desk RLS (management/admin);
 *  `Booked` beds are protected by the local guard BEFORE this is called. */
export function liveSetBedStatus(bedId: string, status: RoomBed['status']): Promise<void> {
  return op('setBedStatus', async (sb) => {
    const res = await sb.from('beds')
      .update({ status })
      .eq('id', bedId)
      .select('id');
    assertOneAffected(res, 'setBedStatus');
  });
}

/* ---------- hydration: overwrite Phase-5 slices from the DB ---------- */

/**
 * Loads owners/branches/beds/applications/bookings/invoices/gate passes from
 * Supabase and overlays them onto the snapshot (called by store-api's
 * combined `hydrateFromLive` AFTER Phase 4 + the profile role sync).
 *
 * RLS shapes what you get back — by design:
 *   • branches/beds   → public reads, full data for everyone
 *   • owners          → staff-only; a student session hydrates [] (they
 *                       never render owners — only the admin console does)
 *   • apps/bookings/invoices/passes → own rows for students, everything
 *                       for the desk once ensureProfileSynced() has run
 * Any failed query keeps the local slice (logged warning, no crash).
 * An *empty successful* read replaces the slice — the DB is the source of
 * truth in live mode; run scripts/seed-supabase.ts for demo content.
 */
export async function hydrateOperations(base: DbSnapshot): Promise<DbSnapshot> {
  if (!isLiveMode()) return base;
  await ensureProfileSynced();
  const ident = await liveIdentity();
  if (!ident) return base;
  const { sb } = ident;

  try {
    const [owners, branches, beds, apps, bookings, invoices, passes] =
      await Promise.all([
        sb.from('owners').select('*'),
        sb.from('branches').select('*').order('created_at', { ascending: false }),
        sb.from('beds').select('*').order('branch_id', { ascending: true })
          .order('room_no', { ascending: true }).order('bed_no', { ascending: true }),
        sb.from('applications').select('*').order('created_at', { ascending: false }),
        sb.from('bookings').select('*').order('booked_at', { ascending: false }),
        sb.from('invoices').select('*').order('created_at', { ascending: false }),
        sb.from('gate_passes').select('*').order('out_at', { ascending: false })
      ]);

    const next: DbSnapshot = { ...base };

    if (owners.error) {
      console.warn('[live] hydrate: owners slice skipped', owners.error);
    } else {
      next.owners = ((owners.data ?? []) as unknown as OwnerRow[]).map(ownerFromRow);
    }
    if (branches.error) {
      console.warn('[live] hydrate: branches slice skipped', branches.error);
    } else {
      next.branches = ((branches.data ?? []) as unknown as BranchRow[]).map(branchFromRow);
    }
    if (beds.error) {
      console.warn('[live] hydrate: beds slice skipped', beds.error);
    } else {
      next.beds = ((beds.data ?? []) as unknown as BedRow[]).map(bedFromRow);
    }
    if (apps.error) {
      console.warn('[live] hydrate: applications slice skipped', apps.error);
    } else {
      next.applications = ((apps.data ?? []) as unknown as AppRow[]).map(appFromRow);
    }
    if (bookings.error) {
      console.warn('[live] hydrate: bookings slice skipped', bookings.error);
    } else {
      next.bookings = ((bookings.data ?? []) as unknown as BookingRow[]).map(bookingFromRow);
    }
    if (invoices.error) {
      console.warn('[live] hydrate: invoices slice skipped', invoices.error);
    } else {
      next.invoices = ((invoices.data ?? []) as unknown as InvoiceRow[]).map(invoiceFromRow);
    }
    if (passes.error) {
      console.warn('[live] hydrate: gate passes slice skipped', passes.error);
    } else {
      next.gatepasses = ((passes.data ?? []) as unknown as GatePassRow[]).map(passFromRow);
    }

    return next;
  } catch (err) {
    console.warn('[live] hydrateOperations failed — using local snapshot', err);
    return base;
  }
}





