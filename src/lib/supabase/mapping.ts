/**
 * Supabase row mapping — pure, dependency-free.
 * ============================================================================
 * Domain type ⇄ snake_case row translation, shared by:
 *   • src/lib/supabase/live-ops.ts   (live-mode writes/reads in the app)
 *   • scripts/seed-supabase.ts       (Phase 7 one-time demo seed)
 * so the seed writes rows with EXACTLY the conventions the app reads back.
 *
 * Deliberately free of Supabase clients, React and browser APIs: it is safe to
 * import from a Node script (`npx tsx`) as well as from client components.
 * The only import is the domain type set from `src/types`.
 */

import type {
  Branch, FeeInvoice, GatePass, OwnerProfile, RoomBed, StudentApplication,
  TokenBooking
} from '@/types';

/* ---------- epoch helpers (same semantics as live-data.ts) ---------- */

export function ms(v: string | null | undefined): number {
  return v ? Date.parse(v) : 0;
}
export function iso(v: number | null | undefined): string | null {
  return v == null ? null : new Date(v).toISOString();
}

/* ---------- row types (snake_case mirrors of schema.sql) ---------- */

export interface OwnerRow {
  id: string; full_name: string; email: string; phone: string; age: number;
  aadhaar_last4: string; verified: boolean; created_at: string;
}
export interface BranchRow {
  id: string; owner_id: string; name: string; gender: string; food: string;
  address: string; amenities: string[] | null; meals_per_day: number;
  room_fees: unknown; sponsored: boolean; rating: number; reviews: number;
  photos: string[] | null; created_at: string;
}
export interface BedRow {
  id: string; branch_id: string; room_no: string; config: string; bed_no: number;
  status: string; occupant_id: string | null; monthly_fee: number;
}
export interface AppRow {
  id: string; student_name: string; student_id: string; aadhaar_last4: string;
  verified: boolean; branch_id: string; bed_id: string | null; status: string;
  created_at: string; decided_at: string | null;
}
export interface BookingRow {
  id: string; application_id: string; branch_id: string; bed_id: string;
  token_amount: number; grace_days: number; booked_at: string;
  expected_arrival: string; actual_arrival: string | null; addon_rent: number;
  status: string;
}
export interface InvoiceRow {
  id: string; student_name: string; branch_id: string; month: string;
  room_rent: number; food_charge: number; absence_deduction: number;
  addon_rent: number; total: number; paid: boolean;
  lines: FeeInvoice['lines'] | null; created_at: string;
}
export interface GatePassRow {
  id: string; student_name: string; student_id: string; branch_id: string;
  reason: string; destination: string; out_at: string; expected_return: string;
  actual_return: string | null; status: string; code: string;
}

/* ---------- mappers: domain type ⇄ row (owners/branches/beds/apps) ---------- */

export function ownerToRow(o: OwnerProfile): Record<string, unknown> {
  return {
    id: o.id, full_name: o.fullName, email: o.email, phone: o.phone, age: o.age,
    aadhaar_last4: o.aadhaarLast4, verified: o.verified, created_at: iso(o.createdAt)
  };
}
export function ownerFromRow(r: OwnerRow): OwnerProfile {
  return {
    id: r.id, fullName: r.full_name, email: r.email, phone: r.phone, age: r.age,
    aadhaarLast4: r.aadhaar_last4, verified: r.verified, createdAt: ms(r.created_at)
  };
}

export function branchToRow(b: Branch): Record<string, unknown> {
  return {
    id: b.id, owner_id: b.ownerId, name: b.name, gender: b.gender, food: b.food,
    address: b.address, amenities: b.amenities, meals_per_day: b.mealsPerDay,
    room_fees: b.roomFees, sponsored: b.sponsored, rating: b.rating,
    reviews: b.reviews, photos: b.photos, created_at: iso(b.createdAt)
  };
}
export function branchFromRow(r: BranchRow): Branch {
  return {
    id: r.id, ownerId: r.owner_id, name: r.name,
    gender: r.gender as Branch['gender'], food: r.food as Branch['food'],
    address: r.address, amenities: r.amenities ?? [], mealsPerDay: r.meals_per_day,
    roomFees: (r.room_fees ?? []) as Branch['roomFees'], sponsored: r.sponsored,
    rating: Number(r.rating), reviews: r.reviews, photos: r.photos ?? [],
    createdAt: ms(r.created_at)
  };
}

/* ---------- mappers: beds ---------- */

export function bedToRow(b: RoomBed): Record<string, unknown> {
  return {
    id: b.id, branch_id: b.branchId, room_no: b.roomNo, config: b.config,
    bed_no: b.bedNo, status: b.status, occupant_id: b.occupantId ?? null,
    monthly_fee: b.monthlyFee
  };
}
export function bedFromRow(r: BedRow): RoomBed {
  return {
    id: r.id, branchId: r.branch_id, roomNo: r.room_no,
    config: r.config as RoomBed['config'], bedNo: r.bed_no,
    status: r.status as RoomBed['status'], occupantId: r.occupant_id,
    monthlyFee: r.monthly_fee
  };
}

/* ---------- mappers: applications ---------- */

export function appToRow(a: StudentApplication): Record<string, unknown> {
  return {
    id: a.id, student_name: a.studentName, student_id: a.studentId,
    aadhaar_last4: a.aadhaarLast4, verified: a.verified, branch_id: a.branchId,
    bed_id: a.bedId ?? null, status: a.status, created_at: iso(a.createdAt),
    decided_at: iso(a.decidedAt)
  };
}
export function appFromRow(r: AppRow): StudentApplication {
  return {
    id: r.id, studentName: r.student_name, studentId: r.student_id,
    aadhaarLast4: r.aadhaar_last4, verified: r.verified, branchId: r.branch_id,
    bedId: r.bed_id, status: r.status as StudentApplication['status'],
    createdAt: ms(r.created_at), decidedAt: r.decided_at ? ms(r.decided_at) : null
  };
}

/* ---------- mappers: token bookings ---------- */

export function bookingToRow(k: TokenBooking): Record<string, unknown> {
  return {
    id: k.id, application_id: k.applicationId, branch_id: k.branchId,
    bed_id: k.bedId, token_amount: k.tokenAmount, grace_days: k.graceDays,
    booked_at: iso(k.bookedAt), expected_arrival: iso(k.expectedArrival),
    actual_arrival: iso(k.actualArrival), addon_rent: k.addonRent, status: k.status
  };
}
export function bookingFromRow(r: BookingRow): TokenBooking {
  return {
    id: r.id, applicationId: r.application_id, branchId: r.branch_id,
    bedId: r.bed_id, tokenAmount: r.token_amount, graceDays: r.grace_days,
    bookedAt: ms(r.booked_at), expectedArrival: ms(r.expected_arrival),
    actualArrival: r.actual_arrival ? ms(r.actual_arrival) : null,
    addonRent: r.addon_rent, status: r.status as TokenBooking['status']
  };
}

/* ---------- mappers: fee invoices ---------- */

export function invoiceToRow(i: FeeInvoice): Record<string, unknown> {
  return {
    id: i.id, student_name: i.studentName, branch_id: i.branchId, month: i.month,
    room_rent: i.roomRent, food_charge: i.foodCharge,
    absence_deduction: i.absenceDeduction, addon_rent: i.addonRent,
    total: i.total, paid: i.paid, lines: i.lines
  };
}
export function invoiceFromRow(r: InvoiceRow): FeeInvoice {
  return {
    id: r.id, studentName: r.student_name, branchId: r.branch_id, month: r.month,
    roomRent: r.room_rent, foodCharge: r.food_charge,
    absenceDeduction: r.absence_deduction, addonRent: r.addon_rent,
    total: r.total, paid: r.paid, lines: r.lines ?? []
  };
}

/* ---------- mappers: smart gate passes ---------- */

export function passToRow(g: GatePass): Record<string, unknown> {
  return {
    id: g.id, student_name: g.studentName, student_id: g.studentId,
    branch_id: g.branchId, reason: g.reason, destination: g.destination,
    out_at: iso(g.outAt), expected_return: iso(g.expectedReturn),
    actual_return: iso(g.actualReturn), status: g.status, code: g.code
  };
}
export function passFromRow(r: GatePassRow): GatePass {
  return {
    id: r.id, studentName: r.student_name, studentId: r.student_id,
    branchId: r.branch_id, reason: r.reason, destination: r.destination,
    outAt: ms(r.out_at), expectedReturn: ms(r.expected_return),
    actualReturn: r.actual_return ? ms(r.actual_return) : null,
    status: r.status as GatePass['status'],
    // char(6) may arrive space-padded depending on driver settings.
    code: String(r.code).trim()
  };
}

