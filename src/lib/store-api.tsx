'use client';

import type {
  ApplicationStatus, BedStatus, Branch, Complaint, ComplaintStatus, GatePass, GatePassStatus, Meal, OwnerProfile,
  RateStats, RewardTxn, RoomBed, StudentApplication, TokenBooking, PlateSelection, FeeInvoice
} from '@/types';
import { hashId } from '@/lib/utils';
import { isLiveMode } from './data-mode';
import {
  hydrateFromLive as hydratePhase4,
  liveAddComplaint,
  liveBroadcast,
  liveClaimPerk,
  liveOptMeal,
  liveRateMeal,
  liveSetComplaintStatus,
  liveSetMealStatus,
  liveUpvoteComplaint,
  liveUpdateMenuItem
} from './supabase/live-data';
import {
  hydrateOperations,
  liveApplyForHostel,
  liveBookToken,
  liveBuildInvoice,
  liveConfirmArrival,
  liveDecideApplication,
  liveMarkInvoicePaid,
  liveOnboardWalkIn,
  liveRegisterBranch,
  liveRegisterOwner,
  liveRequestGatePass,
  liveSetBedStatus,
  liveSetGatePassStatus,
  liveToggleSponsor
} from './supabase/live-ops';
import { ensureProfileSynced } from './supabase/profile-sync';

/**
 * Combined live hydration (Phase 4 + Phase 5). Order matters:
 *   1. ensureProfileSynced() — bridge the app session's role/name/roll
 *      number into `profiles` so the RLS-scoped reads below see staff/own
 *      rows (no-op in mock mode; memoized in live mode);
 *   2. Phase-4 slices (week / wallet / rewards / complaints);
 *   3. Phase-5 slices (owners / branches / beds / applications / bookings /
 *      invoices / gate passes).
 * store.tsx guards the call with isLiveMode() — in mock mode none of this
 * runs and behavior stays byte-for-byte identical.
 */
export async function hydrateFromLive(base: DbSnapshot): Promise<DbSnapshot> {
  await ensureProfileSynced();
  return hydrateOperations(await hydratePhase4(base));
}
import { defaultSnapshot, PERK_LIST, TAIL, type DbSnapshot } from './store-core';

export interface PerkInline {
  id: string; emoji: string; titleKey: string; descKey: string; rarity: 'common' | 'rare' | 'epic'; costCredits: number;
}

export function buildApi(
  db: DbSnapshot,
  commit: (next: DbSnapshot) => void,
  award: (rewards: RewardTxn[], txn: RewardTxn) => RewardTxn[]
) {
  function optMeal(mealId: string, choice: 'optin' | 'optout'): RewardTxn | null {
    const week = db.week.map((day) => ({
      ...day,
      meals: day.meals.map((m) => {
        if (m.id !== mealId) return m;
        const wasOut = m.userOpt === 'optout';
        return {
          ...m,
          userOpt: choice,
          optedOut: Math.max(0, m.optedOut + (choice === 'optout' ? 1 : wasOut ? -1 : 0)),
          participating: Math.max(0, m.participating + (choice === 'optout' ? -1 : wasOut ? 1 : 0))
        };
      })
    }));
    let txn: RewardTxn | null = null;
    if (choice === 'optout') {
      txn = { id: 'rx-' + hashId('opt' + Date.now()), kind: 'eco', points: 18, label: 'reward.optOut', at: Date.now(), meta: 'reward.meta.savedFood' };
      commit({ ...db, week, wallet: { ...db.wallet, onMeal: Math.max(0, db.wallet.onMeal - 5) }, rewards: award(db.rewards, txn) });
    } else {
      commit({ ...db, week, wallet: { ...db.wallet, onMeal: db.wallet.onMeal + 5 } });
    }

    // LIVE: mirror this choice to Supabase — meal_plans head-counts, this
    // student's meal_opt_ins rows, wallet.on_meal and the reward txn.
    // (Mock path above is untouched; this block never runs in mock mode.)
    if (isLiveMode()) {
      const finalWallet =
        choice === 'optout'
          ? { ...db.wallet, onMeal: Math.max(0, db.wallet.onMeal - 5) }
          : { ...db.wallet, onMeal: db.wallet.onMeal + 5 };
      void liveOptMeal(week, mealId, choice, finalWallet, txn);
    }
    return txn;
  }

  function rateMeal(mealId: string, stats: Omit<RateStats, 'count'>): RewardTxn | null {
    const week = db.week.map((day) => ({
      ...day,
      meals: day.meals.map((m) => (m.id === mealId ? { ...m, ratings: { ...stats, count: 1 } } : m))
    }));
    const txn: RewardTxn = { id: 'rx-' + hashId('rate' + Date.now()), kind: 'eco', points: 10, label: 'reward.rating', at: Date.now(), meta: 'reward.meta.verified' };
    commit({ ...db, week, rewards: award(db.rewards, txn) });

    // LIVE: persist the rating (meal_plans.ratings) + the +10 eco reward.
    if (isLiveMode()) void liveRateMeal(week, mealId, { ...stats, count: 1 }, txn);
    return txn;
  }

  function addComplaint(c: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'votes' | 'slaSeconds' | 'assignee'>): Complaint {
    const id = 'CM-' + (1042 + db.complaints.filter((x) => x.id.startsWith('CM-')).length + 1);
    const complaint: Complaint = {
      ...c,
      id,
      status: 'Submitted',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      votes: 0,
      slaSeconds: c.priority === 'Urgent' ? 4 * 3600 : 24 * 3600,
      assignee: null,
      photo: null
    };
    const txn: RewardTxn = { id: 'rx-' + hashId('comp' + Date.now()), kind: 'discipline', points: TAIL.comp, label: 'reward.ticket', at: Date.now(), meta: 'reward.meta.pending' };
    commit({ ...db, complaints: [complaint, ...db.complaints], rewards: award(db.rewards, txn) });

    // LIVE: insert the ticket (author uuid = signed-in profile) + its reward.
    if (isLiveMode()) void liveAddComplaint(complaint, txn);
    return complaint;
  }

  function upvoteComplaint(id: string) {
    commit({ ...db, complaints: db.complaints.map((c) => (c.id === id ? { ...c, votes: c.votes + 1 } : c)) });
    // LIVE: push the incremented vote count for that ticket.
    if (isLiveMode()) {
      const next = db.complaints.find((c) => c.id === id);
      if (next) void liveUpvoteComplaint(id, next.votes + 1);
    }
  }

  function votePoll(optionId: string) {
    const poll = { ...db.poll, userVoted: optionId, options: db.poll.options.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o)) };
    commit({ ...db, poll });
  }

  /**
   * Mess Operator "Edit Today's Menu": rename an item, toggle it in/out of
   * stock, or set its extra price (₹). Written straight into the shared
   * snapshot so the student Mess/Plate pages update in real time.
   */
  function updateMenuItem(
    mealId: string,
    item: string,
    patch: { name?: string; available?: boolean; price?: number }
  ) {
    const week = db.week.map((day) => ({
      ...day,
      meals: day.meals.map((m) => {
        if (m.id !== mealId) return m;
        const index = m.items.indexOf(item);
        if (index === -1) return m;
        const meta = { ...(m.menuMeta ?? {}) };
        const prev = meta[item] ?? { available: true, price: 0 };
        const next = {
          name: (patch.name ?? item).trim() || item,
          available: patch.available ?? prev.available,
          price: Math.max(0, Math.round(patch.price ?? prev.price))
        };
        delete meta[item];
        meta[next.name] = next;
        const items = [...m.items];
        items[index] = next.name;
        return { ...m, items, menuMeta: meta };
      })
    }));
    commit({ ...db, week });

    // LIVE: persist items + menu_meta for every day sharing this mock id.
    if (isLiveMode()) void liveUpdateMenuItem(week, mealId);
  }

  /**
   * Mess Operator "Instant meal status": flip a slot between Active (open for
   * service) and Closed. Students see the change immediately on their plate
   * and mess screens because the store is shared.
   */
  function setMealStatus(mealId: string, status: Meal['status']) {
    const week = db.week.map((day) => ({
      ...day,
      meals: day.meals.map((m) => (m.id === mealId ? { ...m, status } : m))
    }));
    commit({ ...db, week });

    // LIVE: persist the new slot status to meal_plans.
    if (isLiveMode()) void liveSetMealStatus(week, mealId);
  }

  function scratchGift(): { perk: PerkInline; points: number } | null {
    if (db.gifts.scratchLeft <= 0) return null;
    const perk = PERK_LIST[Math.floor(Math.random() * PERK_LIST.length)];
    const points = perk.rarity === 'epic' ? 60 : perk.rarity === 'rare' ? 40 : 25;
    // The perk's own title key becomes the history label, so the row reads in
    // whichever language is active at render time.
    const txn: RewardTxn = { id: 'rx-' + hashId('gift' + Date.now()), kind: 'discipline', points, label: perk.titleKey, at: Date.now(), meta: 'reward.meta.scratch' };
    commit({
      ...db,
      gifts: { lastScratchAt: Date.now(), scratchLeft: db.gifts.scratchLeft - 1 },
      rewards: award(db.rewards, txn)
    });
    return { perk, points };
  }

  function claimPerk(perkId: string) {
    const perk = PERK_LIST.find((p) => p.id === perkId);
    if (!perk) return;
    const wallet = { ...db.wallet, redeemedRewards: db.wallet.redeemedRewards + (perk.costCredits || 0) };
    commit({ ...db, wallet });

    // LIVE: persist wallet.redeemed for this student.
    if (isLiveMode()) void liveClaimPerk(wallet);
  }

  function markRead() {
    commit({ ...db, notifications: db.notifications.map((n) => ({ ...n, read: true })) });
  }

  /**
   * Move a ticket along the SLA pipeline and push an in-app notification so
   * the student sees the change without refreshing.
   */
  function setComplaintStatus(id: string, status: ComplaintStatus, assignee?: string | null) {
    const complaints = db.complaints.map((c) => {
      if (c.id !== id) return c;
      const next: Complaint = {
        ...c, status, updatedAt: Date.now(),
        assignee: assignee !== undefined ? assignee : c.assignee
      };
      if (status === 'Technician Assigned' && !next.assignee) next.assignee = 'R. Sharma (Electrician)';
      if (status === 'Resolved') next.feedback = 'complaints.resolvedNote';
      return next;
    });

    const moved = complaints.find((c) => c.id === id);
    const notifications = moved
      ? [
          {
            id: 'n-' + hashId('st' + Date.now()),
            title: status === 'Resolved' ? 'notify.resolved.title' : 'notify.status.title',
            body: status === 'Resolved' ? 'notify.resolved.body' : 'notify.status.body',
            at: Date.now(),
            read: false,
            tone: status === 'Resolved' ? ('success' as const) : ('info' as const),
            meta: { id, status, assignee: moved.assignee ?? '' }
          },
          ...db.notifications
        ].slice(0, 20)
      : db.notifications;

    commit({ ...db, complaints, notifications });

    // LIVE: persist the ticket's workflow fields (notification stays local).
    if (isLiveMode() && moved) void liveSetComplaintStatus(moved);
  }

  function broadcast(points: number, label: string) {
    const txn: RewardTxn = { id: 'rx-' + hashId('bc' + Date.now()), kind: 'discipline', points, label, at: Date.now(), meta: 'reward.meta.broadcast' };
    commit({ ...db, rewards: award(db.rewards, txn) });

    // LIVE: one rewards row (RLS: admin/management sessions only).
    if (isLiveMode()) void liveBroadcast(txn);
  }

  function adjustPoll(optionId: string, delta: number) {
    const poll = { ...db.poll, options: db.poll.options.map((o) => (o.id === optionId ? { ...o, votes: Math.max(0, o.votes + delta) } : o)) };
    commit({ ...db, poll });
  }

  function addPollOption(dish: string, emoji: string) {
    const poll = { ...db.poll, options: [...db.poll.options, { id: 'po-' + hashId('o' + Date.now()), dish, emoji, votes: 1 }] };
    commit({ ...db, poll });
  }

  function resetDemo() {
    commit(defaultSnapshot());
  }

  function bookToken(input: Omit<TokenBooking, 'id' | 'bookedAt' | 'actualArrival' | 'status' | 'addonRent'> & { addonRent?: number }): TokenBooking | null {
    const bed = db.beds.find((candidate) => candidate.id === input.bedId);
    if (!bed || (bed.status !== 'Vacant' && bed.status !== 'Locked')) return null;
    const booking: TokenBooking = {
      ...input,
      id: 'BK-' + (5000 + db.bookings.length + 1),
      bookedAt: Date.now(),
      actualArrival: null,
      addonRent: input.addonRent ?? 0,
      status: 'Held'
    };
    commit({
      ...db,
      bookings: [booking, ...db.bookings],
      beds: db.beds.map((candidate) => candidate.id === bed.id ? { ...candidate, status: 'Locked' } : candidate)
    });

    // LIVE: insert the Held booking, then lock the bed.
    if (isLiveMode()) void liveBookToken(booking);
    return booking;
  }

  function confirmArrival(bookingId: string): TokenBooking | null {
    const booking = db.bookings.find((candidate) => candidate.id === bookingId);
    if (!booking || booking.status !== 'Held') return null;
    const nextBooking = { ...booking, status: 'Confirmed' as const, actualArrival: Date.now() };
    commit({
      ...db,
      bookings: db.bookings.map((candidate) => candidate.id === bookingId ? nextBooking : candidate),
      beds: db.beds.map((bed) => bed.id === booking.bedId ? { ...bed, status: 'Booked' as const } : bed)
    });

    // LIVE: booking → Confirmed and bed → Booked.
    if (isLiveMode()) void liveConfirmArrival(nextBooking);
    return nextBooking;
  }

  function holdingRate(branchId?: string): number {
    const bookings = db.bookings.filter((booking) => !branchId || booking.branchId === branchId);
    if (!bookings.length) return 0;
    return Math.round((bookings.filter((booking) => booking.status === 'Held').length / bookings.length) * 100);
  }

  function setPlate(mealId: string, items: string[], sweetOptIn = false) {
    const next: PlateSelection = {
      mealId, items: [...items], sweetOptIn, skipped: false,
      absenceDays: db.plates.find((plate) => plate.mealId === mealId)?.absenceDays ?? []
    };
    commit({ ...db, plates: [...db.plates.filter((plate) => plate.mealId !== mealId), next] });
    return next;
  }

  function toggleAbsence(mealId: string, date: string) {
    const current = db.plates.find((plate) => plate.mealId === mealId);
    const absenceDays = current?.absenceDays ?? [];
    const nextAbsenceDays = absenceDays.includes(date)
      ? absenceDays.filter((day) => day !== date)
      : [...absenceDays, date];
    const next: PlateSelection = {
      mealId, items: current?.items ?? [], sweetOptIn: current?.sweetOptIn ?? false,
      skipped: nextAbsenceDays.length > 0, absenceDays: nextAbsenceDays
    };
    commit({ ...db, plates: [...db.plates.filter((plate) => plate.mealId !== mealId), next] });
    return next;
  }

  function absenceDeduction(foodCharge: number, absentDays: number, daysInMonth = 30): number {
    if (foodCharge <= 0 || absentDays <= 0 || daysInMonth <= 0) return 0;
    return Math.min(foodCharge, Math.round((foodCharge / daysInMonth) * absentDays));
  }

  function buildInvoice(input: Omit<FeeInvoice, 'id' | 'total' | 'paid' | 'lines'> & { absentDays?: number }): FeeInvoice {
    const deduction = input.absenceDeduction || absenceDeduction(input.foodCharge, input.absentDays ?? 0);
    const total = input.roomRent + input.foodCharge - deduction + input.addonRent;
    const invoice: FeeInvoice = {
      ...input,
      id: 'INV-' + hashId(input.branchId + input.month + Date.now()).toUpperCase(),
      absenceDeduction: deduction,
      total, paid: false,
      lines: [
        { label: 'Room rent', amount: input.roomRent },
        { label: 'Food charge', amount: input.foodCharge },
        { label: 'Absence deduction', amount: -deduction },
        { label: 'Add-on rent', amount: input.addonRent }
      ]
    };
    commit({ ...db, invoices: [invoice, ...db.invoices] });

    // LIVE: fee desk inserts the bill (staff RLS after role sync).
    if (isLiveMode()) void liveBuildInvoice(invoice);
    return invoice;
  }

  function markInvoicePaid(invoiceId: string): FeeInvoice | null {
    const invoice = db.invoices.find((candidate) => candidate.id === invoiceId);
    if (!invoice) return null;
    const next = { ...invoice, paid: true };
    commit({ ...db, invoices: db.invoices.map((candidate) => candidate.id === invoiceId ? next : candidate) });

    // LIVE: flip paid (own bill as student, any bill as the fee desk).
    if (isLiveMode()) void liveMarkInvoicePaid(invoiceId);
    return next;
  }

  /* ----- Multi-hostel: owners & branches ----- */

  function registerOwner(o: Omit<OwnerProfile, 'id' | 'createdAt' | 'verified'>): OwnerProfile {
    const owner: OwnerProfile = {
      ...o,
      id: 'OWN-' + (1000 + db.owners.length + 1),
      verified: o.aadhaarLast4.length === 4,
      createdAt: Date.now()
    };
    commit({ ...db, owners: [owner, ...db.owners] });

    // LIVE: owner KYC row (public insert policy — /onboard is signed out).
    if (isLiveMode()) void liveRegisterOwner(owner);
    return owner;
  }

  function registerBranch(b: Omit<Branch, 'id' | 'createdAt' | 'rating' | 'reviews' | 'photos'> & { photos?: string[] }): Branch {
    const branch: Branch = {
      ...b,
      id: 'BR-' + hashId(b.name + Date.now()).toUpperCase(),
      rating: 4.0, reviews: 0, photos: b.photos ?? [], createdAt: Date.now()
    };
    commit({ ...db, branches: [branch, ...db.branches] });

    // LIVE: listing row (public insert — onboarding funnel / admin console).
    if (isLiveMode()) void liveRegisterBranch(branch);
    return branch;
  }

  function toggleSponsor(branchId: string) {
    commit({ ...db, branches: db.branches.map((b) => (b.id === branchId ? { ...b, sponsored: !b.sponsored } : b)) });

    // LIVE: flip the sponsor flag (staff RLS — admin/management after sync).
    if (isLiveMode()) {
      const target = db.branches.find((b) => b.id === branchId);
      if (target) void liveToggleSponsor(branchId, !target.sponsored);
    }
  }

  /* ----- Applications & verification ----- */

  function applyForHostel(a: Omit<StudentApplication, 'id' | 'status' | 'createdAt' | 'decidedAt'>): StudentApplication {
    const app: StudentApplication = {
      ...a,
      id: 'APP-' + (9000 + db.applications.length + 1),
      status: 'Waiting for Admin Approval',
      verified: a.aadhaarLast4.length === 4,
      createdAt: Date.now(), decidedAt: null
    };
    const notifications = [{
      id: 'n-' + hashId('ap' + Date.now()),
      title: 'notify.application.title', body: 'notify.application.body',
      at: Date.now(), read: false, tone: 'info' as const,
      meta: { name: a.studentName }
    }, ...db.notifications].slice(0, 20);
    commit({ ...db, applications: [app, ...db.applications], notifications });

    // LIVE: applications insert keyed by the student's own roll number.
    if (isLiveMode()) void liveApplyForHostel(app);
    return app;
  }

  function decideApplication(id: string, status: ApplicationStatus, bedId?: string | null) {
    commit({
      ...db,
      applications: db.applications.map((a) => (a.id === id ? { ...a, status, bedId: bedId ?? a.bedId, decidedAt: Date.now() } : a)),
      beds: bedId ? db.beds.map((b) => (b.id === bedId ? { ...b, status: status === 'Approved' ? 'Locked' as BedStatus : b.status } : b)) : db.beds
    });

    // LIVE: desk decision + conditional bed lock (mirrors the local math).
    if (isLiveMode()) void liveDecideApplication(id, status, bedId ?? null);
  }

  function onboardWalkIn(input: { studentName: string; studentId: string; branchId: string; roomNo: string; bedNo: number; monthlyFee: number }): RoomBed {
    const bed: RoomBed = {
      id: `BED-${input.branchId}-${input.roomNo}-${input.bedNo}`,
      branchId: input.branchId, roomNo: input.roomNo, config: '2-Bed',
      bedNo: input.bedNo, status: 'Booked', occupantId: input.studentId,
      monthlyFee: input.monthlyFee
    };
    const app: StudentApplication = {
      id: 'APP-' + (9000 + db.applications.length + 1),
      studentName: input.studentName, studentId: input.studentId,
      aadhaarLast4: '0000', verified: false, branchId: input.branchId,
      bedId: bed.id, status: 'Approved', createdAt: Date.now(), decidedAt: Date.now()
    };
    commit({ ...db, beds: [bed, ...db.beds.filter((b) => b.id !== bed.id)], applications: [app, ...db.applications] });

    // LIVE: bed upsert + approved application (desk RLS; FK order matters).
    if (isLiveMode()) void liveOnboardWalkIn(bed, app);
    return bed;
  }

  /* ----- Smart gate passes ----- */

  function requestGatePass(p: { reason: string; destination: string; hours: number }): GatePass {
    const gp: GatePass = {
      id: 'GP-' + (7000 + db.gatepasses.length + 1),
      studentName: 'Aarav Mehta',
      studentId: 'STU-23045',
      branchId: 'BR-SUN-BOYS',
      reason: p.reason,
      destination: p.destination,
      outAt: Date.now(),
      expectedReturn: Date.now() + p.hours * 3_600_000,
      actualReturn: null,
      status: 'Requested',
      code: Array.from({ length: 6 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('')
    };
    commit({ ...db, gatepasses: [gp, ...db.gatepasses] });

    // LIVE: pass insert (own roll number as student / desk walk-in).
    if (isLiveMode()) void liveRequestGatePass(gp);
    return gp;
  }

  function setGatePassStatus(id: string, status: GatePassStatus) {
    commit({
      ...db,
      gatepasses: db.gatepasses.map((g) =>
        g.id === id
          ? { ...g, status, actualReturn: status === 'Returned' ? Date.now() : g.actualReturn }
          : g
      )
    });

    // LIVE: persist the transition (desk RLS; students can't forge Approved).
    if (isLiveMode()) {
      const current = db.gatepasses.find((g) => g.id === id);
      if (current) {
        void liveSetGatePassStatus(
          id, status,
          status === 'Returned' ? Date.now() : current.actualReturn ?? null
        );
      }
    }
  }

  /**
   * Lock / release a single bed. `Booked` beds are owned by a student so the
   * UI never offers this for them — the guard lives here too so a stray call
   * can't silently evict someone.
   */
  function setBedStatus(bedId: string, status: BedStatus): RoomBed | null {
    const bed = db.beds.find((b) => b.id === bedId);
    if (!bed || bed.status === 'Booked') return null;
    const beds = db.beds.map((b) => (b.id === bedId ? { ...b, status } : b));
    commit({ ...db, beds });

    // LIVE: bed matrix edit (desk RLS — the local guard already ran above).
    if (isLiveMode()) void liveSetBedStatus(bedId, status);
    return { ...bed, status };
  }

  return {
    ...db, optMeal, rateMeal, addComplaint, upvoteComplaint, votePoll, updateMenuItem, setMealStatus,
    scratchGift, claimPerk, markRead, setComplaintStatus, broadcast,
    adjustPoll, addPollOption, resetDemo,
    registerOwner, registerBranch, toggleSponsor,
    applyForHostel, decideApplication, onboardWalkIn,
    bookToken, confirmArrival, holdingRate,
    setPlate, toggleAbsence, absenceDeduction, buildInvoice, markInvoicePaid,
    requestGatePass, setGatePassStatus, setBedStatus
  };
}