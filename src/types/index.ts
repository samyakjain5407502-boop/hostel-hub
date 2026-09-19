/* Domain types for HostelHub */

export type Role = 'student' | 'operator' | 'admin';

export type Lang = 'en' | 'hi' | 'hinglish';

export type MessSlot = 'breakfast' | 'lunch' | 'snacks' | 'dinner';
export type MealStatus = 'active' | 'closed' | 'upcoming' | 'done';
export type OptChoice = 'optin' | 'optout' | null;

export type ComplaintStatus = 'Submitted' | 'In Review' | 'Technician Assigned' | 'Resolved' | 'Closed';
export type Priority = 'Urgent' | 'Normal';

export type Category =
  | 'Mess/Food Quality'
  | 'Room Maintenance'
  | 'Electrical'
  | 'Plumbing'
  | 'Hygiene/Cleaning'
  | 'Wi-Fi';

/* Sign-in: college directory entry (mock directory in `CollegeSelect`). */
export interface College {
  id: string;
  name: string;
  /** `pending` = manually added, awaiting Super-Admin approval. */
  status?: 'approved' | 'pending';
  /** Where the entry came from. */
  source?: 'directory' | 'manual';
}

export interface User {
  id: string;
  name: string;
  role: Role;
  email?: string;
  studentId?: string;
  /** College affiliation carried with the login request + session. */
  collegeId?: string;
  collegeName?: string;
  mobile?: string;
  avatarHue?: number;
}

export interface Session {
  token: string;
  role: Role;
  user: User;
  iat: number;
  exp: number;
}

/* Dining credit system */
export interface CreditWallet {
  monthlyAllocation: number;
  used: number;
  onMeal: number; // reserved by opted-in upcoming meals
  redeemedRewards: number; // rewards bought with credits
}

export interface Meal {
  id: string;
  label: string;
  slot: MessSlot;
  time: string;
  status: MealStatus;
  items: string[];
  /**
   * Per-item service metadata maintained by the Mess Operator
   * ("Edit Today's Menu"): live availability and extra pricing (₹).
   * Keyed by item name; absent items default to available / ₹0.
   */
  menuMeta?: Record<string, { available: boolean; price: number }>;
  credits: number; // cost if dining without subscription diversion
  veg: boolean;
  participating: number;
  optedOut: number;
  ratings: RateStats | null;
  userOpt?: OptChoice;
  special?: boolean;
}

export interface RateStats {
  hygiene: number;
  taste: number;
  temperature: number;
  count: number;
  tags: string[];
}

export interface DailyPlan {
  date: string; // ISO yyyy-mm-dd
  meals: Meal[];
}

/* Public / poll */
export interface PollOption {
  id: string;
  dish: string;
  emoji: string;
  votes: number;
}
export interface Poll {
  id: string;
  titleKey: string;
  closesAt: number;
  options: PollOption[];
  userVoted?: string | null;
}

/* Complaints */
export interface Complaint {
  id: string;
  category: Category;
  title: string;
  description: string;
  status: ComplaintStatus;
  priority: Priority;
  createdAt: number;
  updatedAt: number;
  photo?: string | null; // data-url or demo image key
  assignee?: string | null;
  slaSeconds?: number;
  author: string;
  feedback?: string | null;
  votes: number;
}

/* Rewards & gamification */
export type RewardKind = 'eco' | 'discipline';
export interface RewardTxn {
  id: string;
  kind: RewardKind;
  points: number;
  label: string;
  at: number;
  meta?: string;
}
export interface PerkTemplate {
  id: string;
  emoji: string;
  titleKey: string;
  descKey: string;
  rarity: 'common' | 'rare' | 'epic';
  costCredits: number;
}
export interface GiftBoxState {
  lastScratchAt: number | null;
  scratchLeft: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  studentId: string;
  points: number;
  streak: number;
  badges: string[];
}

/* Admin */
export interface AdminAnalytics {
  totalSeats: number;
  currentSlot: MessSlot;
  eatingNow: number;
  optedOut: number;
  noShow: number;
  wastagePct: number;
  budgetDaily: number;
  spentDaily: number;
  openComplaints: number;
  avgResolutionHrs: number;
}

export interface NotificationItem {
  id: string;
  /** i18n key or plain text — resolve with `tr()`. */
  title: string;
  body: string;
  at: number;
  read: boolean;
  tone: 'info' | 'success' | 'warning' | 'reward';
  /** Optional interpolation payload (e.g. `{ id, status, name }`). */
  meta?: Record<string, string | number>;
}

/* ---------------- Multi-hostel marketplace ---------------- */

export type OwnerRole = 'owner';
export type GenderTag = 'Girls' | 'Boys' | 'Open to All';
export type FoodTag = 'Jain' | 'Pure Veg' | 'Non-Veg';
export type BedConfig = '1-Bed' | '2-Bed' | '3-Bed' | '4-Bed';
export type BedStatus = 'Vacant' | 'Locked' | 'Booked';
export type ApplicationStatus = 'Waiting for Admin Approval' | 'Approved' | 'Rejected';

export interface OwnerProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  age: number;
  aadhaarLast4: string;
  verified: boolean;
  createdAt: number;
}

export interface RoomFee {
  config: BedConfig;
  monthlyFee: number;
}

export interface Branch {
  id: string;
  ownerId: string;
  name: string;
  gender: GenderTag;
  food: FoodTag;
  address: string;
  amenities: string[];
  mealsPerDay: number;
  roomFees: RoomFee[];
  sponsored: boolean;
  rating: number;
  reviews: number;
  photos: string[];
  createdAt: number;
}

export interface RoomBed {
  id: string;
  branchId: string;
  roomNo: string;
  config: BedConfig;
  bedNo: number;
  status: BedStatus;
  occupantId?: string | null;
  monthlyFee: number;
}

export interface StudentApplication {
  id: string;
  studentName: string;
  studentId: string;
  aadhaarLast4: string;
  verified: boolean;
  branchId: string;
  bedId?: string | null;
  status: ApplicationStatus;
  createdAt: number;
  decidedAt?: number | null;
}

export interface TokenBooking {
  id: string;
  applicationId: string;
  branchId: string;
  bedId: string;
  tokenAmount: number;
  graceDays: number;
  bookedAt: number;
  expectedArrival: number;
  actualArrival?: number | null;
  addonRent: number;
  status: 'Held' | 'Confirmed' | 'Expired';
}

export interface PlateSelection {
  mealId: string;
  items: string[];
  sweetOptIn: boolean;
  skipped: boolean;
  absenceDays: string[];
}

export interface FeeLine {
  label: string;
  amount: number;
}

export interface FeeInvoice {
  id: string;
  studentName: string;
  branchId: string;
  month: string;
  roomRent: number;
  foodCharge: number;
  absenceDeduction: number;
  addonRent: number;
  total: number;
  paid: boolean;
  lines: FeeLine[];
}

/* ---------------- Smart gate pass ---------------- */

export type GatePassStatus = 'Requested' | 'Approved' | 'Out' | 'Returned' | 'Rejected';

export interface GatePass {
  id: string;
  studentName: string;
  studentId: string;
  branchId: string;
  reason: string;
  destination: string;
  outAt: number;
  expectedReturn: number;
  actualReturn?: number | null;
  status: GatePassStatus;
  /** 6-char code rendered into the QR-style visual. */
  code: string;
}