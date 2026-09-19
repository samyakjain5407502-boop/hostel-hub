'use client';

import type {
  Branch, Complaint, CreditWallet, DailyPlan, FeeInvoice, GatePass, GiftBoxState, Meal,
  NotificationItem, OwnerProfile, PlateSelection, Poll, RewardTxn, RoomBed,
  StudentApplication, TokenBooking
} from '@/types';
import { buildWeek, TODAY_KEY } from '@/lib/data/seed-meals';
import { seedComplaints } from '@/lib/data/seed-complaints';
import { seedComplaints2 } from '@/lib/data/seed-complaints2';
import { seedLeaderboard, seedNotifications, seedPoll, seedRewardHistory } from '@/lib/data/seed-rewards';
import { seedBranches, seedOwners } from '@/lib/data/seed-hostels';
import { seedBeds, seedApplications, seedBookings, seedInvoices, seedGatePasses } from '@/lib/data/seed-hostels2';

export const LS = 'hostelhub.db.v1';

/**
 * Points granted by each eco/discipline action. Lives here (not in the React
 * layer) so the data seed and the store API share one source of truth and
 * `store-api` never has to import from a component module.
 */
export const TAIL = { opt: 18, rate: 10, comp: 5 } as const;

export type PersistFn = (next: DbSnapshot) => void;

export interface PerkType {
  id: string; emoji: string; titleKey: string; descKey: string; rarity: 'common' | 'rare' | 'epic'; costCredits: number;
}

/**
 * Perk catalogue. `titleKey`/`descKey` hold i18n keys (not raw copy) so the
 * store stays language-agnostic — components resolve them with `t()`.
 */
export const PERK_LIST: PerkType[] = [
  { id: 'pk-sunday', emoji: '🍰', titleKey: 'perk.sunday.title', descKey: 'perk.sunday.desc', rarity: 'epic', costCredits: 0 },
  { id: 'pk-merch', emoji: '👕', titleKey: 'perk.merch.title', descKey: 'perk.merch.desc', rarity: 'rare', costCredits: 40 },
  { id: 'pk-laundry', emoji: '🧺', titleKey: 'perk.laundry.title', descKey: 'perk.laundry.desc', rarity: 'common', costCredits: 25 },
  { id: 'pk-fridays', emoji: '🍉', titleKey: 'perk.fruit.title', descKey: 'perk.fruit.desc', rarity: 'common', costCredits: 0 },
  { id: 'pk-earlybath', emoji: '🚿', titleKey: 'perk.geyser.title', descKey: 'perk.geyser.desc', rarity: 'rare', costCredits: 30 }
];

export interface DbSnapshot {
  wallet: CreditWallet;
  rewards: RewardTxn[];
  gifts: GiftBoxState;
  notifications: NotificationItem[];
  complaints: Complaint[];
  poll: Poll;
  week: DailyPlan[];
  leaderboard: typeof seedLeaderboard;
  owners: OwnerProfile[];
  branches: Branch[];
  beds: RoomBed[];
  applications: StudentApplication[];
  bookings: TokenBooking[];
  plates: PlateSelection[];
  invoices: FeeInvoice[];
  gatepasses: GatePass[];
}

export const demoTodaysMeals: Meal[] = [
  {
    id: 'today-breakfast', label: 'Seasonal Breakfast', slot: 'breakfast', time: '7:30 – 9:30',
    status: 'done', items: ['Poha', 'Jalebi', 'Masala Chai', 'Banana'], credits: 6,
    veg: true, participating: 328, optedOut: 41, ratings: { hygiene: 4, taste: 3, temperature: 4, count: 187, tags: ['#TooOily', '#Delicious'] }, userOpt: null
  },
  {
    id: 'today-lunch', label: 'Full Veg Thali', slot: 'lunch', time: '12:30 – 14:30',
    status: 'active', items: ['Dal Makhani', 'Saffron Rice', 'Veg Kofta', 'Butter Naan', 'Raita', 'Ice Cream'], credits: 10,
    veg: true, participating: 402, optedOut: 58, ratings: null, userOpt: 'optin'
  },
  {
    id: 'today-snacks', label: 'Evening Snacks', slot: 'snacks', time: '17:00 – 18:00',
    status: 'upcoming', items: ['Vada Pav', 'Cold Coffee'], credits: 5,
    veg: true, participating: 233, optedOut: 72, ratings: null, userOpt: null
  },
  {
    id: 'today-dinner', label: 'Comfort Dinner', slot: 'dinner', time: '19:30 – 21:30',
    status: 'upcoming', items: ['Aloo Jeera', 'Paneer Butter Masala', 'Chapati', 'Salad', 'Gulab Jamun'], credits: 10,
    veg: true, participating: 372, optedOut: 49, ratings: null, userOpt: null
  }
];

export function weekSeed(): DailyPlan[] {
  return buildWeek(demoTodaysMeals);
}

export function defaultSnapshot(_old?: DbSnapshot | null): DbSnapshot {
  return {
    wallet: { monthlyAllocation: 120, used: 38, onMeal: 20, redeemedRewards: 12 },
    rewards: seedRewardHistory.map((r) => ({ ...r })),
    gifts: { lastScratchAt: null, scratchLeft: 3 },
    notifications: seedNotifications.map((n) => ({ ...n })),
    complaints: [...seedComplaints, ...seedComplaints2],
    poll: JSON.parse(JSON.stringify(seedPoll)),
    week: weekSeed(),
    leaderboard: seedLeaderboard.map((l) => ({ ...l })),
    owners: seedOwners.map((o) => ({ ...o })),
    branches: seedBranches.map((b) => ({ ...b, roomFees: b.roomFees.map((f) => ({ ...f })), amenities: [...b.amenities], photos: [...b.photos] })),
    beds: seedBeds.map((b) => ({ ...b })),
    applications: seedApplications.map((a) => ({ ...a })),
    bookings: seedBookings.map((b) => ({ ...b })),
    plates: [],
    invoices: seedInvoices.map((i) => ({ ...i, lines: i.lines.map((l) => ({ ...l })) })),
    gatepasses: seedGatePasses.map((g) => ({ ...g }))
  };
}

export function load(): DbSnapshot {
  try {
    const raw = window.localStorage.getItem(LS);
    if (raw) {
      const parsed = JSON.parse(raw) as DbSnapshot;
      if (parsed.week[0]?.date !== TODAY_KEY) parsed.week = weekSeed();
      return parsed;
    }
  } catch {
    /* corrupt cache — rebuild fresh */
  }
  return defaultSnapshot();
}

export function persist(s: DbSnapshot) {
  try {
    window.localStorage.setItem(LS, JSON.stringify(s));
  } catch {
    /* quota errors are non-fatal in demo */
  }
}