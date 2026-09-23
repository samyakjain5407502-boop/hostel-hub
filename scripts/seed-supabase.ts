/**
 * scripts/seed-supabase.ts — Phase 7 · one-time demo seed (LIVE MODE).
 * ============================================================================
 * Pushes the exact demo data the mock store ships with into the real Supabase
 * tables created by `supabase/schema.sql`, so a fresh live database starts with
 * the same content as the mock demo.
 *
 * Sources (single source of truth — nothing is duplicated here):
 *   • src/lib/data/seed-hostels.ts     → owners, branches
 *   • src/lib/data/seed-operations.ts  → beds, applications, bookings, invoices, passes
 *   • src/lib/data/seed-meals.ts       → meal_plans (via store-core weekSeed)
 *   • src/lib/data/seed-complaints*.ts → complaints
 *   • src/lib/data/seed-rewards.ts     → rewards, notifications, leaderboard, poll
 *   • store-core (defaultSnapshot)     → wallet, gift box, perk catalogue
 *   • college-select MOCK_COLLEGES     → colleges
 *   • supabase/mapping.ts              → domain ⇄ row mappers (shared with the app)
 *
 * Usage
 *   1. Apply supabase/schema.sql to your project (tables + RLS + functions).
 *   2. In .env.local set:
 *        NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=eyJ…     # server-only; bypasses RLS
 *   3. npx tsx scripts/seed-supabase.ts      # or: npm run seed:supabase
 *
 * Behaviour
 *   • Idempotent — every write is an UPSERT on the table's primary key, so it
 *     is safe to re-run (seeded rows are overwritten with the same values).
 *   • Credentials are read ONLY from the environment via @next/env (never
 *     hardcoded). Missing vars produce a clear message — no stack trace, no
 *     partial write.
 *   • MOCK MODE IS UNTOUCHED. This script is never imported by the app; the
 *     default demo keeps working with zero environment variables set.
 *
 * Identity note
 *   Per-student demo rows (wallet, rewards, notifications, gift box, the demo
 *   student's complaints/opt-ins) are owned by a dedicated "content" profile
 *   with a FIXED uuid and `student_id = NULL`. Leaving student_id NULL is
 *   deliberate: when a real student signs in as STU-23045, profile-sync claims
 *   that roll number for THEIR profile without a unique-constraint clash, so
 *   text-keyed entities (applications, gate passes) still resolve to them via
 *   RLS. Shared tables (hostels, beds, menu, invoices, gate passes, colleges,
 *   leaderboard, perks, polls…) are visible to everyone, exactly like the demo.
 * ============================================================================
 */

import { loadEnvConfig } from '@next/env';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { NotificationItem } from '@/types';
import { seedOwners, seedBranches } from '@/lib/data/seed-hostels';
import {
  seedBeds, seedApplications, seedBookings, seedInvoices, seedGatePasses
} from '@/lib/data/seed-operations';
import { seedComplaints } from '@/lib/data/seed-complaints';
import { seedComplaintsExtra } from '@/lib/data/seed-complaints-extra';
import {
  seedRewardHistory, seedPoll, seedLeaderboard, seedNotifications
} from '@/lib/data/seed-rewards';
import { defaultSnapshot, PERK_LIST } from '@/lib/store-core';
import { MOCK_COLLEGES } from '@/components/auth/college-select';
import { liveMealId } from '@/lib/supabase/live-data';
import {
  ownerToRow, branchToRow, bedToRow, appToRow, bookingToRow, invoiceToRow, passToRow
} from '@/lib/supabase/mapping';

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

/** Fixed uuid for the per-student demo content (idempotent across re-runs). */
const DEMO_PROFILE_ID = '11111111-1111-4111-8111-111111111111';

type Row = Record<string, unknown>;
// Loose client type: this seed has no generated Database types, so we type the
// client with `any` schema generics to keep `.from(table)` / `.upsert(rows)`
// fully dynamic (table names and row shapes are assembled at runtime here).
type Supabase = SupabaseClient<any, any, any>;

const iso = (epochMs: number): string => new Date(epochMs).toISOString();

/** Staff onboarding queue — mirrors the demo list on /management/operators. */
const DEMO_OPERATORS = [
  { id: 'REQ-101', name: 'Ramesh Yadav', college: 'College of Engineering',
    requestedAt: Date.now() - 26 * 3_600_000 },
  { id: 'REQ-102', name: 'Priya Kulkarni', college: 'Arts & Science College',
    requestedAt: Date.now() - 5 * 3_600_000 }
];

/**
 * Article-level stock register. `inventory_items` has no seed in src/lib/data
 * (the app's inventory page renders beds), so this is an illustrative register
 * for the first marketplace branch — one row per status for easy testing.
 */
function demoInventory(branchId: string): Row[] {
  return [
    { id: 'INV-ITEM-001', branch_id: branchId, name: 'Rice (basmati)', category: 'grocery', unit: 'kg', quantity: 120, reorder_level: 50, unit_cost: 62, status: 'In Stock' },
    { id: 'INV-ITEM-002', branch_id: branchId, name: 'Toor dal', category: 'grocery', unit: 'kg', quantity: 45, reorder_level: 40, unit_cost: 140, status: 'In Stock' },
    { id: 'INV-ITEM-003', branch_id: branchId, name: 'Cooking oil', category: 'grocery', unit: 'L', quantity: 18, reorder_level: 20, unit_cost: 120, status: 'Low' },
    { id: 'INV-ITEM-004', branch_id: branchId, name: 'CFL bulbs', category: 'electrical', unit: 'pcs', quantity: 0, reorder_level: 10, unit_cost: 90, status: 'Out of Stock' },
    { id: 'INV-ITEM-005', branch_id: branchId, name: 'Bedsheets (single)', category: 'linen', unit: 'pcs', quantity: 64, reorder_level: 30, unit_cost: 220, status: 'In Stock' }
  ];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

let totalRows = 0;

function report(table: string, n: number): void {
  totalRows += n;
  console.log(`  ✓ ${table.padEnd(20)} ${n} row${n === 1 ? '' : 's'}`);
}

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

/** Upsert on a primary/unique key so re-runs never duplicate rows. */
async function upsert(sb: Supabase, table: string, rows: Row[], onConflict?: string): Promise<void> {
  if (rows.length === 0) {
    report(table, 0);
    return;
  }
  const { error } = await sb.from(table).upsert(rows, onConflict ? { onConflict } : undefined);
  if (error) fail(`${table}: ${error.message}`);
  report(table, rows.length);
}

function requireEnv(): { url: string; serviceKey: string } {
  loadEnvConfig(process.cwd());
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing = [!url && 'NEXT_PUBLIC_SUPABASE_URL', !serviceKey && 'SUPABASE_SERVICE_ROLE_KEY']
    .filter(Boolean) as string[];
  if (missing.length) {
    fail(
      `Missing required environment variable(s): ${missing.join(', ')}\n` +
      '    Copy .env.example → .env.local and fill in your Supabase project URL and\n' +
      '    service-role key (Project Settings → API). The seed needs the SERVICE key\n' +
      '    so it can write past RLS. Never commit these values.'
    );
  }
  return { url: url as string, serviceKey: serviceKey as string };
}

/* ------------------------------------------------------------------ */
/* Seed                                                                */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  console.log('\nHostelHub · Supabase demo seed');
  console.log('──────────────────────────────');
  const { url, serviceKey } = requireEnv();
  const sb: Supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const snap = defaultSnapshot();
  const firstBranchId = seedBranches[0]?.id ?? 'BR-SUN-BOYS';

  console.log('\nSeeding (parents first to satisfy foreign keys)…');

  // ── Identity ────────────────────────────────────────────────────────
  await upsert(sb, 'profiles', [{
    id: DEMO_PROFILE_ID, auth_id: null, role: 'student', name: 'Aarav Mehta',
    student_id: null, email: null, mobile: null, college_id: null,
    college_name: null, avatar_hue: 248, created_at: iso(Date.now())
  }], 'id');

  // ── Marketplace: owners → branches → beds ───────────────────────────
  await upsert(sb, 'owners', seedOwners.map(ownerToRow), 'id');
  await upsert(sb, 'branches', seedBranches.map(branchToRow), 'id');
  await upsert(sb, 'beds', seedBeds.map(bedToRow), 'id');

  // ── Admissions: applications → token bookings ───────────────────────
  await upsert(sb, 'applications', seedApplications.map(appToRow), 'id');
  await upsert(sb, 'bookings', seedBookings.map(bookingToRow), 'id');

  // ── Fees & gate ─────────────────────────────────────────────────────
  await upsert(sb, 'invoices', seedInvoices.map(invoiceToRow), 'id');
  await upsert(sb, 'gate_passes', seedGatePasses.map(passToRow), 'id');

  // ── Mess: weekly meal plans + the demo student's opt-in ─────────────
  const mealRows: Row[] = [];
  const optRows: Row[] = [];
  for (const day of snap.week) {
    for (const m of day.meals) {
      const id = liveMealId(day.date, m.slot);
      mealRows.push({
        id, date: day.date, slot: m.slot, label: m.label, time: m.time,
        credits: m.credits, status: m.status, items: m.items,
        menu_meta: m.menuMeta ?? {}, veg: m.veg,
        participating: m.participating, opted_out: m.optedOut,
        ratings: m.ratings, special: m.special ?? false
      });
      if (m.userOpt) {
        optRows.push({ student: DEMO_PROFILE_ID, meal_plan: id, choice: m.userOpt });
      }
    }
  }
  await upsert(sb, 'meal_plans', mealRows, 'id');
  await upsert(sb, 'meal_opt_ins', optRows, 'student,meal_plan');

  // ── Per-student content (owned by the fixed demo profile) ───────────
  await upsert(sb, 'wallets', [{
    student: DEMO_PROFILE_ID, allocation: snap.wallet.monthlyAllocation,
    used: snap.wallet.used, on_meal: snap.wallet.onMeal,
    redeemed: snap.wallet.redeemedRewards, updated_at: iso(Date.now())
  }], 'student');

  await upsert(sb, 'gift_state', [{
    student: DEMO_PROFILE_ID, scratch_left: snap.gifts.scratchLeft,
    last_scratch: snap.gifts.lastScratchAt ? iso(snap.gifts.lastScratchAt) : null
  }], 'student');

  await upsert(sb, 'rewards', seedRewardHistory.map((r) => ({
    id: r.id, student: DEMO_PROFILE_ID, kind: r.kind, points: r.points,
    label: r.label, meta: r.meta ?? null, created_at: iso(r.at)
  })), 'id');

  await upsert(sb, 'notifications', (seedNotifications as NotificationItem[]).map((n) => ({
    id: n.id, student: DEMO_PROFILE_ID, title: n.title, body: n.body,
    at: iso(n.at), is_read: n.read, tone: n.tone, meta: n.meta ?? null
  })), 'id');

  await upsert(sb, 'complaints', [...seedComplaints, ...seedComplaintsExtra].map((c) => ({
    id: c.id,
    author: c.author === 'Aarav Mehta' ? DEMO_PROFILE_ID : null,
    author_name: c.author, category: c.category, title: c.title,
    description: c.description, priority: c.priority, status: c.status,
    photo_url: c.photo ?? null, assignee: c.assignee ?? null,
    feedback: c.feedback ?? null, sla_seconds: c.slaSeconds ?? null,
    votes: c.votes, created_at: iso(c.createdAt), updated_at: iso(c.updatedAt)
  })), 'id');

  // ── Shared catalogues (visible to everyone) ─────────────────────────
  await upsert(sb, 'leaderboard_entries', seedLeaderboard.map((l) => ({
    student_id: l.studentId, rank: l.rank, name: l.name,
    points: l.points, streak: l.streak, badges: l.badges
  })), 'student_id');

  await upsert(sb, 'polls', [{
    id: seedPoll.id, title_key: seedPoll.titleKey,
    closes_at: iso(seedPoll.closesAt), options: seedPoll.options
  }], 'id');

  await upsert(sb, 'poll_votes', seedPoll.userVoted ? [{
    poll: seedPoll.id, student: DEMO_PROFILE_ID, option_id: seedPoll.userVoted,
    created_at: iso(Date.now())
  }] : [], 'poll,student');

  await upsert(sb, 'perks', PERK_LIST.map((p) => ({
    id: p.id, emoji: p.emoji, title_key: p.titleKey, desc_key: p.descKey,
    rarity: p.rarity, cost_credits: p.costCredits
  })), 'id');

  await upsert(sb, 'colleges', MOCK_COLLEGES.map((c) => ({
    id: c.id, name: c.name, status: c.status ?? 'approved',
    source: c.source ?? 'directory'
  })), 'id');

  await upsert(sb, 'operators', DEMO_OPERATORS.map((o) => ({
    id: o.id, profile: null, name: o.name, college: o.college,
    role: 'operator', status: 'pending', requested_at: iso(o.requestedAt),
    decided_at: null
  })), 'id');

  await upsert(sb, 'inventory_items', demoInventory(firstBranchId), 'id');

}

main()
  .then(() => {
    console.log(`\n✓ Seed complete — ${totalRows} rows upserted.\n`);
    process.exit(0);
  })
  .catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n✗ Seed failed: ${msg}\n`);
    process.exit(1);
  });


