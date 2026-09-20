/**
 * Role-based redirect middleware (Next.js App Router) — 4-tier edition.
 *  - /auth/*        → redirects already signed-in users to their portal home
 *  - /dashboard     → student-only
 *  - /mess          → mess-operator-only
 *  - /management    → management-desk-only
 *  - /admin/*       → super-admin-only
 * Each role can never reach another role's portal. Legacy paths
 * (`/mess-operator`, `/admin/admissions`, `/admin/inventory`) are rewritten
 * to their new homes so old bookmarks keep working and keep their RBAC.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession, COOKIE } from '@/lib/auth';
import type { Role } from '@/types';

const PORTAL_HOME: Record<Role, string> = {
  student: '/dashboard',
  operator: '/mess',
  management: '/management',
  admin: '/admin'
};

const PORTAL_AUTH: Record<Role, string> = {
  student: '/auth/student',
  operator: '/auth/mess',
  management: '/auth/management',
  admin: '/auth/admin'
};

/** Old route → new route. Kept in sync with `LEGACY_ROUTES` in lib/portals. */
const LEGACY: Record<string, string> = {
  '/mess-operator': '/mess',
  '/admin/admissions': '/management/admissions',
  '/admin/inventory': '/management/inventory',
  '/admin/complaints': '/management/complaints',
  '/admin/gatepass': '/management/gatepass',
  '/admin/operators': '/management/operators',
  '/admin/headcount': '/mess',
  '/admin/menu': '/mess/menu'
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Legacy paths are transparently rewritten before any RBAC runs, so the
  //    guard below still evaluates them against their *new* portal.
  const legacy = LEGACY[pathname.replace(/\/$/, '')];
  if (legacy) {
    return NextResponse.redirect(new URL(legacy, request.url));
  }

  const token = request.cookies.get(COOKIE)?.value;
  const session = await verifySession(token);

  const isStudentArea = pathname.startsWith('/dashboard');
  const isOperatorArea = pathname.startsWith('/mess');
  const isManagementArea = pathname.startsWith('/management');
  const isAdminArea = pathname.startsWith('/admin');
  const isAuthArea = pathname.startsWith('/auth');

  // Signed-in users skip the login screens entirely — straight to their portal.
  if (isAuthArea) {
    if (!session) return NextResponse.next();
    return NextResponse.redirect(new URL(PORTAL_HOME[session.role], request.url));
  }

  if (!isStudentArea && !isOperatorArea && !isManagementArea && !isAdminArea) {
    return NextResponse.next();
  }

  // Unauthenticated visitors are sent to the matching portal login.
  if (!session) {
    const target = isAdminArea
      ? PORTAL_AUTH.admin
      : isManagementArea
        ? PORTAL_AUTH.management
        : isOperatorArea
          ? PORTAL_AUTH.operator
          : PORTAL_AUTH.student;
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Cross-portal access is blocked in every direction.
  const guard: Array<[boolean, Role]> = [
    [isStudentArea, 'student'],
    [isOperatorArea, 'operator'],
    [isManagementArea, 'management'],
    [isAdminArea, 'admin']
  ];
  for (const [isArea, role] of guard) {
    if (isArea && session.role !== role) {
      return NextResponse.redirect(new URL(PORTAL_HOME[session.role] ?? PORTAL_AUTH[role], request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/mess/:path*',
    '/mess-operator',
    '/management/:path*',
    '/admin/:path*',
    '/auth/:path*'
  ]
};

