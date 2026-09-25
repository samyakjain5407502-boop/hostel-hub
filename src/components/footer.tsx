'use client';

import { ArrowUp, Mail, MapPin, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { LogoMark } from '@/components/brand';
import { useLang, type TKey } from '@/i18n';
import { getClientSession } from '@/lib/client-session';
import { PORTAL_HOME } from '@/lib/portals';
import { useToast } from '@/components/ui/toast';
import type { Role } from '@/types';

/**
 * Global footer.
 * Alignment is deliberate: one 12-column grid (4 / 2 / 2 / 4) so the brand block,
 * both link columns and the contact card all start on the same baseline, and
 * every column heading uses the identical 11px uppercase treatment.
 * Ownership is stated once, plainly — Medi-Caps University | Cause ’26 — with the
 * two contact details that actually reach a human.
 *
 * The three Platform links point at student-only screens. An anonymous visitor
 * would be bounced by the middleware with no explanation, so `onPlatformClick`
 * sends them to `/auth/student?redirect=<path>` instead and says out loud that
 * the demo login is a single click. Signed-in staff are routed to their own
 * portal home rather than into a role they cannot open.
 */
const CONTACT = { email: 'Samyakthora@gmail.com', phone: '+91 9098088466', tel: '+919098088466' };

const PLATFORM_LINKS: { href: string; key: TKey }[] = [
  { href: '/dashboard/mess', key: 'footer.messPlanning' },
  { href: '/dashboard/rewards', key: 'footer.rewards' },
  { href: '/dashboard/complaints', key: 'footer.complaintCenter' }
];

const LEARNING_LINKS: { href: string; key: TKey }[] = [
  { href: '/#faq', key: 'footer.docs' },
  { href: '/#features', key: 'footer.ecoGuide' },
  { href: '/privacy', key: 'footer.privacy' },
  { href: '/terms', key: 'footer.terms' }
];

/** Where a Platform link should actually go for the current visitor. */
function targetFor(role: Role | null, path: string): string {
  if (!role) return `/auth/student?redirect=${encodeURIComponent(path)}`;
  return role === 'student' ? path : PORTAL_HOME[role];
}

export function Footer() {
  const { t } = useLang();
  const router = useRouter();
  const toast = useToast();
  /* `null` = still resolving (server render + first paint). */
  const [role, setRole] = React.useState<Role | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getClientSession()
      .then((session) => {
        if (!cancelled) setRole(session?.role ?? null);
      })
      .catch(() => {
        if (!cancelled) setRole(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Keep the real `href` on the anchor (right-click / middle-click / "open in
   * new tab" still work), but intercept a plain left click so the friendly
   * notification survives the navigation.
   */
  function onPlatformClick(event: React.MouseEvent<HTMLAnchorElement>, path: string) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (!role) {
      toast.push({
        title: t('footer.demoNotice.title'),
        body: t('footer.demoNotice.body'),
        tone: 'info'
      });
    }
    event.preventDefault();
    router.push(targetFor(role, path));
  }

  return (
    <footer className="w-full max-w-full overflow-x-clip border-t border-slate-200 bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-6">
        <div className="grid w-full gap-10 lg:grid-cols-12 lg:gap-8">
          {/* ── Brand + ownership ─────────────────────────────────────── */}
          <div className="lg:col-span-4">
            <a href="/" className="flex items-center gap-2.5" aria-label={t('app.name')}>
              <LogoMark />
              <span className="font-display text-lg font-extrabold tracking-tight text-slate-900">
                Hostel<span className="text-brand-600">Hub</span>
              </span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">{t('app.tagline')}.</p>
            <p className="mt-5 font-display text-[11px] font-black uppercase tracking-[0.2em] text-brand-700">
              {t('footer.brandLine')}
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-600">{t('footer.tagline2')}</p>
          </div>

          {/* ── Platform ──────────────────────────────────────────────── */}
          <nav className="lg:col-span-2" aria-label={t('footer.platform')}>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">{t('footer.platform')}</h3>
            <ul className="mt-4 space-y-2.5">
              {PLATFORM_LINKS.map(({ href, key }) => (
                <li key={href}>
                  <a
                    href={targetFor(role, href)}
                    onClick={(event) => onPlatformClick(event, href)}
                    className="text-sm font-medium text-slate-700 transition-colors hover:text-brand-700"
                  >
                    {t(key)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Learning ──────────────────────────────────────────────── */}
          <nav className="lg:col-span-2" aria-label={t('footer.learning')}>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">{t('footer.learning')}</h3>
            <ul className="mt-4 space-y-2.5">
              {LEARNING_LINKS.map(({ href, key }) => (
                <li key={href}>
                  <a href={href} className="text-sm font-medium text-slate-700 transition-colors hover:text-brand-700">
                    {t(key)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Contact ───────────────────────────────────────────────── */}
          <div className="lg:col-span-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">{t('footer.contact')}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 transition-colors hover:text-brand-700"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-brand-600 shadow-panel">
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="break-anywhere">{CONTACT.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT.tel}`}
                  className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 transition-colors hover:text-brand-700"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-brand-600 shadow-panel">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="break-anywhere">{CONTACT.phone}</span>
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-brand-600 shadow-panel">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="break-anywhere">{t('footer.campus')}</span>
              </li>
            </ul>

            <p className="mt-5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[11px] font-semibold text-slate-600">
              {t('footer.contactLine')}
            </p>
          </div>

        </div>

        <div className="mt-12 flex flex-col-reverse items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-center text-xs font-medium text-slate-600 sm:text-left">
            © 2026 HostelHub · {t('footer.brandLine')}. {t('footer.rights')}
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-panel transition hover:border-brand-200 hover:text-brand-700 active:scale-[.98]"
          >
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            {t('footer.backToTop')}
          </button>
        </div>
      </div>
    </footer>
  );
}
