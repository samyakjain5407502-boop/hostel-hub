'use client';

import { verifySession, issueSession, COOKIE } from '@/lib/auth';
import type { Session, User } from '@/types';

export const SESSION_COOKIE = COOKIE;

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^\-])/g, '\\$1') + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function writeCookie(name: string, value: string, hours: number) {
  const d = new Date();
  d.setTime(d.getTime() + hours * 3600 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${d.toUTCString()}; samesite=${'Lax'}`;
}

export async function getClientSession(): Promise<Session | null> {
  return verifySession(readCookie(COOKIE));
}

export async function clientLogin(user: User): Promise<Session> {
  const session = await issueSession(user);
  writeCookie(COOKIE, session.token, 12);
  return session;
}

export function clientSignOut() {
  document.cookie = `${COOKIE}=; path=/; max-age=0`;
  window.location.href = '/';
}