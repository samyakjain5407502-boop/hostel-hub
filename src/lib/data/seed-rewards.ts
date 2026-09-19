import type { LeaderboardEntry, Poll, RewardTxn } from '@/types';

const H = 3_600_000;
const DAY = 24 * H;
const now = Date.now();

/**
 * Seeded reward history. `label`/`meta` hold i18n keys (not raw copy) so the
 * store stays language-agnostic — components resolve them with `tr()`,
 * which passes any non-key string through untouched.
 */
export const seedRewardHistory: RewardTxn[] = [
  { id: 'rx-1', kind: 'eco', points: 15, label: 'reward.optOutBreakfast', at: now - 4 * H, meta: 'reward.meta.saved04' },
  { id: 'rx-2', kind: 'discipline', points: 20, label: 'reward.photoVerified', at: now - 1 * DAY, meta: 'reward.meta.photoProof' },
  { id: 'rx-3', kind: 'eco', points: 10, label: 'reward.rating', at: now - 1 * DAY - 5 * H, meta: 'reward.meta.dinner' },
  { id: 'rx-4', kind: 'discipline', points: 30, label: 'reward.streak', at: now - 2 * DAY, meta: 'reward.meta.weekly' },
  { id: 'rx-5', kind: 'eco', points: 10, label: 'reward.optOutSnacks', at: now - 2 * DAY - 6 * H, meta: 'reward.meta.saved02' },
  { id: 'rx-6', kind: 'discipline', points: 50, label: 'reward.giftRare', at: now - 3 * DAY, meta: 'reward.meta.scratch' }
];

export const seedPoll: Poll = {
  id: 'poll-weekend-1',
  titleKey: 'poll.weekend.title',
  closesAt: now + 2 * DAY,
  userVoted: null,
  options: [
    { id: 'po-1', dish: 'Butter Paneer Do Pyaza', emoji: '🍛', votes: 186 },
    { id: 'po-2', dish: 'Veg Biryani + Raita', emoji: '🍚', votes: 214 },
    { id: 'po-3', dish: 'Chole Chawal with Amritsari Kulcha', emoji: '🥘', votes: 158 },
    { id: 'po-4', dish: 'Veg Manchurian + Fried Rice', emoji: '🥡', votes: 121 }
  ]
};

export const seedLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'Ananya Joshi', studentId: 'STU-23012', points: 640, streak: 12, badges: ['🌱', '🏆', '⭐'] },
  { rank: 2, name: 'Vikram Rathore', studentId: 'STU-23771', points: 590, streak: 9, badges: ['🌱', '⚡'] },
  { rank: 3, name: 'Sara Fernandes', studentId: 'STU-22914', points: 555, streak: 11, badges: ['🌱', '🏆'] },
  { rank: 4, name: 'Arjun Patil', studentId: 'STU-24108', points: 520, streak: 6, badges: ['🌱'] },
  { rank: 5, name: 'Neha Gupta', studentId: 'STU-23455', points: 505, streak: 8, badges: ['🌱', '⭐'] },
  { rank: 6, name: 'Riya Kapoor', studentId: 'STU-24077', points: 470, streak: 5, badges: ['🌱'] },
  { rank: 7, name: 'Dev Sharma', studentId: 'STU-23890', points: 455, streak: 7, badges: ['🌱'] },
  { rank: 8, name: 'Meher Kaur', studentId: 'STU-22210', points: 430, streak: 4, badges: ['🌱'] }
];

/** Seeded alerts. Titles/bodies are i18n keys — rendered through `tr()`. */
export const seedNotifications = [
  { id: 'n1', title: 'notify.tech.title', body: 'notify.tech.body', at: now - 1 * H, read: false, tone: 'info' as const },
  { id: 'n2', title: 'notify.reward.title', body: 'notify.reward.body', at: now - 4 * H, read: false, tone: 'success' as const },
  { id: 'n3', title: 'notify.poll.title', body: 'notify.poll.body', at: now - 8 * H, read: true, tone: 'info' as const }
];