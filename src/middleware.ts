/**
 * Role-based redirect middleware (Next.js App Router) — 3-portal edition.
 *  - /auth/*        → redirects already signed-in users to their portal home
 *  - /dashboard     → student-only
 *  - /mess-operator → mess-operator-only
 *  - /admin/*       → super-admin-only
 * Each role can never reach another role's portal.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession, COOKIE } from '@/lib/auth';
import type { Role } from '@/types';

const PORTAL_HOME: Record<Role, string> = {
  student: '/dashboard',
  operator: '/mess-operator',
  admin: '/admin'
};

const PORTAL_AUTH: Record<Role, string> = {
  student: '/auth/student',
  operator: '/auth/mess',
  admin: '/auth/admin'
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE)?.value;
  const session = await verifySession(token);

  const isStudentArea = pathname.startsWith('/dashboard');
  const isOperatorArea = pathname.startsWith('/mess-operator');
  const isAdminArea = pathname.startsWith('/admin');
  const isAuthArea = pathname.startsWith('/auth');

  // Signed-in users skip the login screens entirely — straight to their portal.
  if (isAuthArea) {
    if (!session) return NextResponse.next();
    return NextResponse.redirect(new URL(PORTAL_HOME[session.role], request.url));
  }

  if (!isStudentArea && !isOperatorArea && !isAdminArea) return NextResponse.next();

  // Unauthenticated visitors are sent to the matching portal login.
  if (!session) {
    const target = isAdminArea
      ? PORTAL_AUTH.admin
      : isOperatorArea
        ? PORTAL_AUTH.operator
        : PORTAL_AUTH.student;
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Cross-portal access is blocked in every direction.
  const guard: Array<[boolean, Role]> = [
    [isStudentArea, 'student'],
    [isOperatorArea, 'operator'],
    [isAdminArea, 'admin']
  ];
  for (const [isArea, role] of guard) {
    if (isArea && session.role !== role) {
      return NextResponse.redirect(new URL(PORTAL_AUTH[role], request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/mess-operator/:path*', '/admin/:path*', '/auth/:path*']
};
