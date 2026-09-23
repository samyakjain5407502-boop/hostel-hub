import { NextResponse, type NextRequest } from 'next/server';

import { COOKIE, verifySession } from '@/lib/auth';
import { isLiveMode } from '@/lib/data-mode';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/profile/sync — LIVE MODE ONLY (no-op / 400 in mock).
 * Bridges the app's verified session cookie into `profiles` so Supabase RLS
 * (`current_app_role()` / `current_student_id()` / `current_profile_name()`)
 * sees the same role/name/roll-number the app does.
 *
 * Trust model — the client sends NOTHING but the request itself:
 *   • role/name/studentId/… are read from the app-session cookie, verified
 *     server-side with AUTH_SECRET (same check middleware performs);
 *   • the Supabase identity is validated via the cookie-backed server
 *     client's auth.getUser() — you can only sync YOUR profile row;
 *   • the write uses the service-role key, the only context allowed to set
 *     `role` (see the profiles_block_self_role_change trigger).
 */
export async function POST(request: NextRequest) {
  if (!isLiveMode()) {
    return NextResponse.json({ ok: false, reason: 'mock mode' }, { status: 400 });
  }

  // 1. Verify the app session (HS256 cookie signed with AUTH_SECRET).
  const session = await verifySession(request.cookies.get(COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ ok: false, reason: 'no app session' }, { status: 401 });
  }

  // 2. Validate the caller's Supabase session (anon sign-in from the browser)
  //    — identifies WHICH profile row may be updated.
  const sb = getSupabaseServerClient();
  if (!sb) {
    return NextResponse.json(
      { ok: false, reason: 'supabase server client unavailable' },
      { status: 503 }
    );
  }
  const { data: authData, error: authError } = await sb.auth.getUser();
  const uid = authData.user?.id;
  if (authError || !uid) {
    return NextResponse.json(
      { ok: false, reason: 'no supabase session' },
      { status: 401 }
    );
  }

  // 3. Service-role upsert of the profile (creates it on first sync if the
  //    handle_new_user trigger hasn't fired yet, otherwise updates in place).
  const svc = getSupabaseServiceClient();
  if (!svc) {
    return NextResponse.json(
      { ok: false, reason: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
      { status: 503 }
    );
  }
  const u = session.user;
  const { error } = await svc.from('profiles').upsert(
    {
      id: uid,
      auth_id: uid,
      role: u.role,
      name: u.name,
      student_id: u.studentId ?? null,
      mobile: u.mobile ?? null,
      college_id: u.collegeId ?? null,
      college_name: u.collegeName ?? null,
    },
    { onConflict: 'id' }
  );
  if (error) {
    return NextResponse.json(
      { ok: false, reason: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, role: u.role });
}