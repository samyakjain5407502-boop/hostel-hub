import type {
  BedConfig, Branch, FeeInvoice, FoodTag, GenderTag, GatePass, OwnerProfile,
  RoomBed, StudentApplication, TokenBooking
} from '@/types';

const DAY = 86_400_000;
const now = Date.now();

function bed(branchId: string, roomNo: string, config: BedConfig, bedNo: number, status: RoomBed['status'], monthlyFee: number, occupantId?: string): RoomBed {
  return { id: `BED-${branchId}-${roomNo}-${bedNo}`, branchId, roomNo, config, bedNo, status, occupantId: occupantId ?? null, monthlyFee };
}

export const seedBeds: RoomBed[] = [
  bed('BR-SUN-BOYS', '101', '2-Bed', 1, 'Booked', 7200, 'STU-23045'),
  bed('BR-SUN-BOYS', '101', '2-Bed', 2, 'Vacant', 7200),
  bed('BR-SUN-BOYS', '102', '3-Bed', 1, 'Booked', 5900, 'STU-23012'),
  bed('BR-SUN-BOYS', '102', '3-Bed', 2, 'Locked', 5900),
  bed('BR-SUN-BOYS', '102', '3-Bed', 3, 'Vacant', 5900),
  bed('BR-SUN-BOYS', '103', '4-Bed', 1, 'Vacant', 4800),
  bed('BR-SUN-BOYS', '103', '4-Bed', 2, 'Vacant', 4800),
  bed('BR-SUN-BOYS', '103', '4-Bed', 3, 'Booked', 4800, 'STU-23771'),
  bed('BR-SUN-BOYS', '103', '4-Bed', 4, 'Vacant', 4800),
  bed('BR-SUN-GIRLS', '201', '2-Bed', 1, 'Booked', 7800, 'STU-22914'),
  bed('BR-SUN-GIRLS', '201', '2-Bed', 2, 'Vacant', 7800),
  bed('BR-SUN-GIRLS', '202', '3-Bed', 1, 'Locked', 6400),
  bed('BR-SUN-GIRLS', '202', '3-Bed', 2, 'Vacant', 6400),
  bed('BR-SUN-GIRLS', '202', '3-Bed', 3, 'Vacant', 6400),
  bed('BR-GREEN-A', 'A-11', '4-Bed', 1, 'Vacant', 4400),
  bed('BR-GREEN-A', 'A-11', '4-Bed', 2, 'Vacant', 4400),
  bed('BR-GREEN-A', 'A-11', '4-Bed', 3, 'Locked', 4400),
  bed('BR-GREEN-A', 'A-11', '4-Bed', 4, 'Booked', 4400, 'STU-24108'),
  bed('BR-GREEN-A', 'A-12', '2-Bed', 1, 'Vacant', 6500),
  bed('BR-GREEN-A', 'A-12', '2-Bed', 2, 'Vacant', 6500)
];

export const seedApplications: StudentApplication[] = [
  {
    id: 'APP-9001', studentName: 'Aarav Mehta', studentId: 'STU-23045',
    aadhaarLast4: '2210', verified: true, branchId: 'BR-SUN-BOYS',
    bedId: 'BED-BR-SUN-BOYS-101-1', status: 'Approved',
    createdAt: now - 40 * DAY, decidedAt: now - 39 * DAY
  },
  {
    id: 'APP-9002', studentName: 'Kabir Singh', studentId: 'STU-24501',
    aadhaarLast4: '7788', verified: true, branchId: 'BR-SUN-BOYS',
    bedId: null, status: 'Waiting for Admin Approval',
    createdAt: now - 2 * DAY, decidedAt: null
  },
  {
    id: 'APP-9003', studentName: 'Ishita Verma', studentId: 'STU-24502',
    aadhaarLast4: '3312', verified: false, branchId: 'BR-SUN-GIRLS',
    bedId: null, status: 'Waiting for Admin Approval',
    createdAt: now - 1 * DAY, decidedAt: null
  },
  {
    id: 'APP-9004', studentName: 'Rohan Das', studentId: 'STU-24503',
    aadhaarLast4: '9902', verified: true, branchId: 'BR-GREEN-A',
    bedId: null, status: 'Rejected',
    createdAt: now - 9 * DAY, decidedAt: now - 8 * DAY
  }
];

export const seedBookings: TokenBooking[] = [
  {
    id: 'BK-5001', applicationId: 'APP-9001', branchId: 'BR-SUN-BOYS',
    bedId: 'BED-BR-SUN-BOYS-101-1', tokenAmount: 2000, graceDays: 7,
    bookedAt: now - 40 * DAY, expectedArrival: now - 33 * DAY,
    actualArrival: now - 35 * DAY, addonRent: 0, status: 'Confirmed'
  },
  {
    id: 'BK-5002', applicationId: 'APP-9002', branchId: 'BR-SUN-BOYS',
    bedId: 'BED-BR-SUN-BOYS-101-2', tokenAmount: 2000, graceDays: 7,
    bookedAt: now - 2 * DAY, expectedArrival: now + 5 * DAY,
    actualArrival: null, addonRent: 0, status: 'Held'
  }
];

export const seedInvoices: FeeInvoice[] = [
  {
    id: 'INV-2026-09-01', studentName: 'Aarav Mehta', branchId: 'BR-SUN-BOYS',
    month: 'September 2026', roomRent: 7200, foodCharge: 3600,
    absenceDeduction: 420, addonRent: 0, total: 10380, paid: false,
    lines: [
      { label: 'Room rent · 2-Bed / Room 101', amount: 7200 },
      { label: 'Food · 30 days × ₹120', amount: 3600 },
      { label: 'Absence deduction · 7 skipped meals', amount: -420 },
      { label: 'Token advance adjusted', amount: 0 }
    ]
  }
];

export type { Branch, FeeInvoice, OwnerProfile, RoomBed, StudentApplication, TokenBooking, BedConfig, GenderTag, FoodTag, GatePass };

/* ---------------- Smart gate passes ---------------- */

function pass(
  id: string, studentName: string, studentId: string, branchId: string,
  reason: string, destination: string, outOffsetH: number, returnH: number,
  status: GatePass['status'], code: string, actualReturnOffsetH?: number
): GatePass {
  const now = Date.now();
  return {
    id, studentName, studentId, branchId, reason, destination,
    outAt: now + outOffsetH * 3_600_000,
    expectedReturn: now + returnH * 3_600_000,
    actualReturn: actualReturnOffsetH !== undefined ? now + actualReturnOffsetH * 3_600_000 : null,
    status, code
  };
}

export const seedGatePasses: GatePass[] = [
  pass('GP-7001', 'Aarav Mehta', 'STU-23045', 'BR-SUN-BOYS', 'gate.reason.home', 'City Centre', -6, 4, 'Out', 'HX7K2M', undefined),
  pass('GP-7002', 'Vikram Rathore', 'STU-23771', 'BR-SUN-BOYS', 'gate.reason.medical', 'City Hospital', -30, -22, 'Returned', 'QP4N8T', -23),
  pass('GP-7003', 'Sara Fernandes', 'STU-22914', 'BR-SUN-GIRLS', 'gate.reason.family', 'Railway Station', 3, 10, 'Requested', 'ZL9D5W', undefined)
];