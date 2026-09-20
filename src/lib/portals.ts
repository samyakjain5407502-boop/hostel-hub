import type { Role } from '@/types';

/**
 * Portal registry (4-tier architecture).
 * Single source of truth for each role's home, login route and label.
 * The middleware keeps its own copy (edge runtime, zero deps).
 */
export const PORTAL_HOME: Record<Role, string> = {
  student: '/dashboard',
  operator: '/mess',
  management: '/management',
  admin: '/admin'
};

export const PORTAL_AUTH: Record<Role, string> = {
  student: '/auth/student',
  operator: '/auth/mess',
  management: '/auth/management',
  admin: '/auth/admin'
};

export const PORTAL_LABEL: Record<Role, string> = {
  student: 'Student Portal',
  operator: 'Mess Operator',
  management: 'Management Desk',
  admin: 'Admin Command'
};

/** Short blurb used by the landing portal chooser. */
export const PORTAL_BLURB: Record<Role, string> = {
  student: 'Mess, plate, rewards, fees & gate pass',
  operator: 'Headcount, meal slots, ingredients',
  management: 'Admissions, beds & fee invoices',
  admin: 'Branches, BI analytics & system logs'
};

/**
 * Legacy routes kept alive for bookmarks and stale links. The middleware
 * and the page tree both honour these, so an old `/mess-operator` bookmark
 * never dead-ends.
 */
export const LEGACY_ROUTES: Record<string, string> = {
  '/mess-operator': '/mess',
  '/admin/admissions': '/management/admissions',
  '/admin/inventory': '/management/inventory'
};

