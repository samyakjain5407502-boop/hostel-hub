import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession, COOKIE } from '@/lib/auth';

/**
 * Role-based redirect middleware (Next.js App Router).
 *  - /auth/*    → redirects already signed-in users to their home
 *  - /dashboard → student-only
 *  - /admin/*   → admin-only
 * Students can never reach admin routes and vice-versa.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE)?.value;
  const session = await verifySession(token);

  const isStudentArea = pathname.startsWith('/dashboard');
  const isAdminArea = pathname.startsWith('/admin');
  const isAuthArea = pathname.startsWith('/auth');

  // Signed-in users skip the login screens entirely.
  if (isAuthArea) {
    if (!session) return NextResponse.next();
    const home = session.role === 'admin' ? '/admin' : '/dashboard';
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (!isStudentArea && !isAdminArea) return NextResponse.next();

  // Unauthenticated visitors are sent to the matching portal login.
  if (!session) {
    const target = isAdminArea ? '/auth/admin' : '/auth/student';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Cross-portal access is blocked in both directions.
  if (isStudentArea && session.role !== 'student') {
    return NextResponse.redirect(new URL('/auth/student', request.url));
  }
  if (isAdminArea && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/auth/admin', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/auth/:path*']
};