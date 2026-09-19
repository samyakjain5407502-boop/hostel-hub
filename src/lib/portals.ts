import type { Role } from '@/types';

/**
 * Portal registry (3-portal architecture).
 * Single source of truth for each role's home, login route and label.
 * The middleware keeps its own copy (edge runtime, zero deps).
 */
export const PORTAL_HOME: Record<Role, string> = {
  student: '/dashboard',
  operator: '/mess-operator',
  admin: '/admin'
};

export const PORTAL_AUTH: Record<Role, string> = {
  student: '/auth/student',
  operator: '/auth/mess',
  admin: '/auth/admin'
};

export const PORTAL_LABEL: Record<Role, string> = {
  student: 'Student Portal',
  operator: 'Mess Operator',
  admin: 'Admin / Management'
};
