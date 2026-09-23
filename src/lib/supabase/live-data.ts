/**
 * Live-mode persistence — PHASE 4 entity set only:
 *   mess plans/opt-ins (meal_plans, meal_opt_ins), wallet, rewards, complaints.
 * (Hostels/bookings/etc. arrive in Phase 5; plates, notifications, gifts,
 * polls and leaderboard remain mock-only for now — untouched by this file.)
 *
 * ============================================================================
 * MOCK-SAFETY CONTRACT (keeps NEXT_PUBLIC_DATA_MODE=mock untouched):
 *   • Every write starts with `getSupabaseBrowserClient()` which returns
 *     `null` in mock mode → immediate return, zero side effects, no env read.
 *   • store-api.tsx only calls these inside `if (isLiveMode())` blocks.
 *
 * DESIGN — "Supabase = source of truth, local slice = render cache":
 *   The store API is synchronous (pages do `db.optMeal(...)` and render from
 *   the return value), so live writes mirror async: the same computed result
 *   commits locally for instant UI, then is pushed to Supabase; the next
 *   load's `hydrateFromLive()` overwrites those slices from the DB. Two
 *   devices racing final-value writes can clobber each other (no RPC deltas)
 *   — acceptable for this demo; flagged inline.
 *
 * IDENTITY: RLS attributes rows via auth.uid(). We reuse an existing
 * Supabase session; otherwise a one-shot anonymous sign-in gives this browser
 * a profile row (handle_new_user trigger) that can own rows. If anonymous
 * sign-ins are disabled we log ONE actionable error and skip live persistence
 * (never crash the UI).
 * ============================================================================
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseBrowserClient } from './client';
import { isLiveMode } from '../data-mode';
import type {
  Branch, Complaint, CreditWallet, FeeInvoice, GatePass, Meal, OwnerProfile,
  RateStats, RewardTxn, RoomBed, StudentApplication, TokenBooking
} from '../../types';
import type { DbSnapshot } from '../store-core';

export type LiveIdentity = { sb: SupabaseClient; userId: string };

/** One-shot anonymous sign-in attempt (memoized — no retry storms). */
let anonAttempt: Promise<LiveIdentity | null> | null = null;

/**
 * Resolves the Supabase identity for this browser, or `null`.
 * - mock mode / missing env → `null` (client.ts bails before touching env)
 * - existing session → its user id; no session → one anon sign-in attempt
 */
export async function liveIdentity(): Promise<LiveIdentity | null> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return null;

  try {
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    const user = data.session?.user;
    if (user) return { sb, userId: user.id };

    if (!anonAttempt) {
      anonAttempt = sb.auth
        .signInAnonymously()
        .then((res) => {
          if (res.error) throw res.error;
          const u = res.data.user;
          return u ? { sb, userId: u.id } : null;
        })
        .catch((err: unknown) => {
          console.error(
            '[live] Supabase anonymous sign-in failed — live writes are ' +
              'skipped. Enable the "Anonymous" provider in Supabase ' +
              'Auth → Providers, or establish a Supabase Auth session.',
            err
          );
          return null;
        });
    }
    return await anonAttempt;
  } catch (err) {
    console.error('[live] could not resolve Supabase session', err);
    return null;
  }
}

/** ISO string for a millisecond epoch (timestamptz columns). */
const iso = (ms: number): string => new Date(ms).toISOString();

/** Millisecond epoch from a timestamptz string (or pass numbers through). */
const msOf = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') return value;
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
};

/**
 * Live PK for a meal_plans row. The mock `Meal.id` is a label slug
 * (`lunch-full-veg-thali`) that REPEATS every day of the week, so it can
 * never be a table PK. `${date}__${slot}` matches `unique (date, slot)` and
 * resolves to/from mock ids through the current `db.week` snapshot.
 */
export const liveMealId = (date: string, slot: string): string => `${date}__${slot}`;

type MatchedMeal = { liveId: string; meal: Meal };

/** Find every meal in `week` whose mock id equals `mockMealId`, with its live id. */
function resolveMeals(week: DbSnapshot['week'], mockMealId: string): MatchedMeal[] {
  const out: MatchedMeal[] = [];
  for (const day of week) {
    for (const meal of day.meals) {
      if (meal.id === mockMealId) out.push({ liveId: liveMealId(day.date, meal.slot), meal });
    }
  }
  return out;
}

/** Partial meal_plans upsert — only the columns this op owns (+ NOT NULLs). */
function mealRow(m: MatchedMeal, patch: Record<string, unknown>): Record<string, unknown> {
  return { id: m.liveId, date: m.liveId.split('__')[0], slot: m.meal.slot, label: m.meal.label, ...patch };
}

/**
 * Upserts the signed-in student's wallet row touching ONLY the columns this
 * operation owns (inserts fall back to table defaults for the rest — Phase 7
 * seeds the demo values, so live state matches the mock demo).
 */
async function upsertWalletColumns(ident: LiveIdentity, patch: Record<string, unknown>): Promise<void> {
  const { error } = await ident.sb
    .from('wallets')
    .upsert({ student: ident.userId, updated_at: iso(Date.now()), ...patch }, { onConflict: 'student' });
  if (error) throw error;
}

/** Inserts one reward ledger row (RewardTxn → rewards). */
async function insertReward(ident: LiveIdentity, txn: RewardTxn): Promise<void> {
  const { error } = await ident.sb.from('rewards').insert({
    id: txn.id,
    student: ident.userId,
    kind: txn.kind,
    points: txn.points,
    label: txn.label,
    meta: txn.meta ?? null,
    created_at: iso(txn.at)
  });
  if (error) throw error;
}

/** Runs a live write, logging failures loudly but never throwing at the UI. */
async function persist(tag: string, fn: (ident: LiveIdentity) => Promise<void>): Promise<void> {
  if (!isLiveMode()) return; // belt & braces — mock can never reach a write
  const ident = await liveIdentity();
  if (!ident) return;
  try {
    await fn(ident);
  } catch (err) {
    console.error(`[live] ${tag} failed — change not persisted to Supabase`, err);
  }
}

// ── Phase-4 write ops (called from store-api.tsx inside isLiveMode) ──

/** optMeal → meal_plans counts + meal_opt_ins rows + wallet.on_meal + reward (optout). */
export function liveOptMeal(
  week: DbSnapshot['week'],
  mockMealId: string,
  choice: 'optin' | 'optout',
  wallet: CreditWallet,
  txn: RewardTxn | null
): Promise<void> {
  return persist('optMeal', async (ident) => {
    const matches = resolveMeals(week, mockMealId);
    if (matches.length) {
      // meal_plans first (rows must exist for the meal_opt_ins FK)…
      const { error: mpErr } = await ident.sb.from('meal_plans').upsert(
        matches.map((m) =>
          mealRow(m, { participating: m.meal.participating, opted_out: m.meal.optedOut })
        ),
        { onConflict: 'id' }
      );
      if (mpErr) throw mpErr;
      // …then the student's choice per affected date (the mock sets userOpt
      // on every day sharing this id — mirrored as one row per date).
      const { error: oiErr } = await ident.sb
        .from('meal_opt_ins')
        .upsert(
          matches.map((m) => ({ student: ident.userId, meal_plan: m.liveId, choice })),
          { onConflict: 'student,meal_plan' }
        );
      if (oiErr) throw oiErr;
    }
    // Wallet: only the column this op owns — mirrors the mock's ±5 math.
    await upsertWalletColumns(ident, { on_meal: wallet.onMeal });
    if (txn) await insertReward(ident, txn);
  });
}

/** rateMeal → meal_plans.ratings for the slot (+10 eco reward). */
export function liveRateMeal(
  week: DbSnapshot['week'],
  mockMealId: string,
  ratings: RateStats,
  txn: RewardTxn
): Promise<void> {
  return persist('rateMeal', async (ident) => {
    const matches = resolveMeals(week, mockMealId);
    if (matches.length) {
      const { error } = await ident.sb
        .from('meal_plans')
        .upsert(matches.map((m) => mealRow(m, { ratings: { ...ratings } })), { onConflict: 'id' });
      if (error) throw error;
    }
    await insertReward(ident, txn);
  });
}

/** updateMenuItem → meal_plans.items + menu_meta (mess console edits). */
export function liveUpdateMenuItem(week: DbSnapshot['week'], mockMealId: string): Promise<void> {
  return persist('updateMenuItem', async (ident) => {
    const matches = resolveMeals(week, mockMealId);
    if (!matches.length) return;
    const { error } = await ident.sb.from('meal_plans').upsert(
      matches.map((m) => mealRow(m, { items: m.meal.items, menu_meta: m.meal.menuMeta ?? {} })),
      { onConflict: 'id' }
    );
    if (error) throw error;
  });
}

/** setMealStatus → meal_plans.status (active/closed/upcoming/done). */
export function liveSetMealStatus(week: DbSnapshot['week'], mockMealId: string): Promise<void> {
  return persist('setMealStatus', async (ident) => {
    const matches = resolveMeals(week, mockMealId);
    if (!matches.length) return;
    const { error } = await ident.sb
      .from('meal_plans')
      .upsert(matches.map((m) => mealRow(m, { status: m.meal.status })), { onConflict: 'id' });
    if (error) throw error;
  });
}

/** claimPerk → wallet.redeemed (only that column — see upsertWalletColumns). */
export function liveClaimPerk(wallet: CreditWallet): Promise<void> {
  return persist('claimPerk', (ident) => upsertWalletColumns(ident, { redeemed: wallet.redeemedRewards }));
}

/**
 * broadcast → one rewards row (matches the mock, which appends a single txn
 * to the visible ledger). RLS only lets admin/management sessions insert;
 * a student session logs a permission error and the UI keeps its local state.
 */
export function liveBroadcast(txn: RewardTxn): Promise<void> {
  return persist('broadcast', (ident) => insertReward(ident, txn));
}

/** Complaint → complaints row. Mock `author` is a *display name*, so it maps
 * to `author_name`; `author` (uuid) is the signed-in profile for RLS. */
function complaintRow(c: Complaint, userId: string): Record<string, unknown> {
  return {
    id: c.id,
    author: userId,
    author_name: c.author,
    category: c.category,
    title: c.title,
    description: c.description,
    priority: c.priority,
    status: c.status,
    photo_url: c.photo ?? null,
    assignee: c.assignee ?? null,
    feedback: c.feedback ?? null,
    sla_seconds: c.slaSeconds ?? null,
    votes: c.votes,
    created_at: iso(c.createdAt),
    updated_at: iso(c.updatedAt)
  };
}

type ComplaintRow = {
  id: string;
  author_name: string | null;
  category: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  photo_url: string | null;
  assignee: string | null;
  feedback: string | null;
  sla_seconds: number | null;
  votes: number | null;
  created_at: string;
  updated_at: string;
};

/** complaints row → Complaint (author round-trips through author_name). */
function complaintFromRow(row: ComplaintRow): Complaint {
  return {
    id: row.id,
    category: row.category as Complaint['category'],
    title: row.title,
    description: row.description ?? '',
    status: row.status as Complaint['status'],
    priority: row.priority as Complaint['priority'],
    createdAt: msOf(row.created_at),
    updatedAt: msOf(row.updated_at),
    photo: row.photo_url,
    assignee: row.assignee,
    slaSeconds: row.sla_seconds ?? undefined,
    author: row.author_name ?? 'Resident',
    feedback: row.feedback,
    votes: row.votes ?? 0
  };
}

/** addComplaint → complaints row + its discipline reward.
 * NOTE: the demo id scheme ('CM-1042'+count) can collide if two browsers file
 * at once — the PK error is logged, the UI still shows the local ticket. */
export function liveAddComplaint(complaint: Complaint, txn: RewardTxn): Promise<void> {
  return persist('addComplaint', async (ident) => {
    const { error } = await ident.sb.from('complaints').insert(complaintRow(complaint, ident.userId));
    if (error) throw error;
    await insertReward(ident, txn);
  });
}

/** upvoteComplaint → votes (final-value write; races possible — demo trade-off). */
export function liveUpvoteComplaint(id: string, votes: number): Promise<void> {
  return persist('upvoteComplaint', async (ident) => {
    const { error } = await ident.sb.from('complaints').update({ votes }).eq('id', id);
    if (error) throw error;
  });
}

/** setComplaintStatus → workflow fields on the ticket row
 * (the in-app notification created alongside stays local — out of Phase 4 scope). */
export function liveSetComplaintStatus(next: Complaint): Promise<void> {
  return persist('setComplaintStatus', async (ident) => {
    const { error } = await ident.sb
      .from('complaints')
      .update({
        status: next.status,
        assignee: next.assignee ?? null,
        feedback: next.feedback ?? null,
        updated_at: iso(next.updatedAt)
      })
      .eq('id', next.id);
    if (error) throw error;
  });
}

// ── Hydration (live reads) ──────────────────────────────────────────

type MealRow = {
  date: string;
  slot: string;
  label: string | null;
  status: string | null;
  items: string[] | null;
  menu_meta: Meal['menuMeta'] | null;
  credits: number | null;
  veg: boolean | null;
  participating: number | null;
  opted_out: number | null;
  ratings: RateStats | null;
};

type RewardRow = {
  id: string;
  kind: string;
  points: number;
  label: string;
  meta: string | null;
  created_at: string;
};

/**
 * Overwrites the Phase-4 slices of `base` (week, wallet, rewards, complaints)
 * with live rows. Best-effort by design: each query failing only skips ITS
 * slice — hydration can never crash the app, and mock mode never reaches it.
 *
 * Notes:
 *  • `userOpt` comes ONLY from this student's meal_opt_ins rows — meals
 *    without a row get `null` (DB is the source of truth in live mode).
 *  • complaints are RLS-scoped: a student session sees its own tickets,
 *    staff sessions see the queue (per Phase 3 policies).
 *  • one-shot on mount (store.tsx) — no realtime subscriptions yet.
 */
export async function hydrateFromLive(base: DbSnapshot): Promise<DbSnapshot> {
  if (!isLiveMode()) return base;

  let ident: LiveIdentity | null = null;
  try {
    ident = await liveIdentity();
  } catch {
    ident = null;
  }
  if (!ident) return base;
  const { sb, userId } = ident;

  try {
    const dates = base.week.map((d) => d.date);
    const min = dates[0] ?? '';
    const max = dates[dates.length - 1] ?? '';

    const [meals, opts, wallet, rewards, complaints] = await Promise.all([
      sb.from('meal_plans').select('*').gte('date', min).lte('date', max),
      sb.from('meal_opt_ins').select('meal_plan, choice').eq('student', userId),
      sb.from('wallets').select('*').eq('student', userId).maybeSingle(),
      sb.from('rewards').select('*').eq('student', userId).order('created_at', { ascending: false }).limit(40),
      sb.from('complaints').select('*').order('created_at', { ascending: false })
    ]);

    const next: DbSnapshot = { ...base };

    if (meals.error || opts.error) {
      console.warn('[live] hydrate: meal slices skipped', meals.error ?? opts.error);
    } else {
      const rowByKey = new Map<string, MealRow>(
        ((meals.data ?? []) as unknown as MealRow[]).map((r) => [`${r.date}__${r.slot}`, r])
      );
      const optByLiveId = new Map<string, 'optin' | 'optout'>(
        ((opts.data ?? []) as { meal_plan: string; choice: 'optin' | 'optout' }[]).map((r) => [
          r.meal_plan,
          r.choice
        ])
      );
      next.week = base.week.map((day) => ({
        ...day,
        meals: day.meals.map((localMeal) => {
          const key = `${day.date}__${localMeal.slot}`;
          const row = rowByKey.get(key);
          const userOpt = optByLiveId.get(key) ?? null;
          if (!row) return { ...localMeal, userOpt };
          return {
            ...localMeal,
            label: row.label ?? localMeal.label,
            status: (row.status ?? localMeal.status) as Meal['status'],
            items: row.items ?? localMeal.items,
            menuMeta: row.menu_meta ?? localMeal.menuMeta,
            credits: row.credits ?? localMeal.credits,
            veg: row.veg ?? localMeal.veg,
            participating: row.participating ?? localMeal.participating,
            optedOut: row.opted_out ?? localMeal.optedOut,
            ratings: row.ratings ?? null,
            userOpt
          };
        })
      }));
    }

    if (wallet.error) {
      console.warn('[live] hydrate: wallet slice skipped', wallet.error);
    } else if (wallet.data) {
      const w = wallet.data as unknown as {
        allocation: number;
        used: number;
        on_meal: number;
        redeemed: number;
      };
      next.wallet = {
        monthlyAllocation: w.allocation,
        used: w.used,
        onMeal: w.on_meal,
        redeemedRewards: w.redeemed
      };
    }

    if (rewards.error) {
      console.warn('[live] hydrate: rewards slice skipped', rewards.error);
    } else {
      next.rewards = ((rewards.data ?? []) as unknown as RewardRow[]).map((r) => ({
        id: r.id,
        kind: r.kind as RewardTxn['kind'],
        points: r.points,
        label: r.label,
        at: msOf(r.created_at),
        meta: r.meta ?? undefined
      }));
    }

    if (complaints.error) {
      console.warn('[live] hydrate: complaints slice skipped', complaints.error);
    } else {
      next.complaints = ((complaints.data ?? []) as unknown as ComplaintRow[]).map(complaintFromRow);
    }

    return next;
  } catch (err) {
    console.warn('[live] hydrate failed — using local snapshot', err);
    return base;
  }
}




