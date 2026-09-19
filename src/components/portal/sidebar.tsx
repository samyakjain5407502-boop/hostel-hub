'use client';

import {
  LayoutDashboard, UtensilsCrossed, Star, LifeBuoy, Gift, Trophy, Wallet,
  Users, Utensils, KanbanSquare, Radar, X, Receipt, QrCode, Grid3x3, UserPlus
} from 'lucide-react';
import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LogoMark } from '@/components/brand';
import { useLang, TKey } from '@/i18n';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

interface NavItem {
  href: string;
  key: TKey;
  icon: React.ComponentType<{ className?: string }>;
}

const STUDENT_NAV: NavItem[] = [
  { href: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/dashboard/mess', key: 'nav.mess', icon: UtensilsCrossed },
  { href: '/dashboard/plate', key: 'nav.plate', icon: Utensils },
  { href: '/dashboard/rate', key: 'nav.rating', icon: Star },
  { href: '/dashboard/complaints', key: 'nav.complaints', icon: LifeBuoy },
  { href: '/dashboard/rewards', key: 'nav.rewards', icon: Gift },
  { href: '/dashboard/leaderboard', key: 'nav.leaderboard', icon: Trophy },
  { href: '/dashboard/wallet', key: 'nav.wallet', icon: Wallet },
  { href: '/dashboard/ledger', key: 'nav.ledger', icon: Receipt },
  { href: '/dashboard/gatepass', key: 'nav.gatepass', icon: QrCode }
];

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', key: 'admin.title', icon: LayoutDashboard },
  { href: '/admin/headcount', key: 'nav.headcountAdmin', icon: Users },
  { href: '/admin/inventory', key: 'nav.inventory', icon: Grid3x3 },
  { href: '/admin/admissions', key: 'nav.admissions', icon: UserPlus },
  { href: '/admin/menu', key: 'nav.menuAdmin', icon: Utensils },
  { href: '/admin/complaints', key: 'nav.complaintsAdmin', icon: KanbanSquare },
  { href: '/admin/gatepass', key: 'nav.gatepass', icon: QrCode },
  { href: '/admin/rewards', key: 'nav.rewardsAdmin', icon: Radar }
];

export function Sidebar({ role, pathname, open, onClose }: {
  role: Role; pathname: string; open: boolean; onClose: () => void;
}) {
  const { t } = useLang();
  const nav = role === 'admin' ? ADMIN_NAV : STUDENT_NAV;
  const home = role === 'admin' ? '/admin' : '/dashboard';

  /* Escape closes the drawer — keyboard parity with tapping the backdrop. */
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Desktop rail — sticky and independently scrollable so a long nav
          never stretches the page or hangs past the viewport. */}
      <aside
        className="sticky top-[4.5rem] hidden max-h-[calc(100dvh-6rem)] w-60 shrink-0 flex-col gap-1 overflow-y-auto p-3 lg:flex"
        aria-label={t('a11y.primaryNav')}
      >
        <NavList nav={nav} t={t} pathname={pathname} />
      </aside>

      {/* Mobile / tablet: full-bleed slide-over drawer */}
      <AnimatePresence>
        {open && (
          <div className="lg:hidden">
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm"
              aria-hidden="true"
            />

            <motion.aside
              key="panel"
              role="dialog"
              aria-modal="true"
              aria-label={t('a11y.primaryNav')}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.24, ease: 'easeOut' }}
              className="drawer-panel fixed inset-y-0 left-0 z-[75] flex h-dvh w-full max-w-full flex-col overflow-hidden bg-white shadow-soft sm:w-80"
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <a href={home} onClick={onClose} className="flex min-w-0 items-center gap-2">
                  <LogoMark />
                  <span className="truncate font-display text-base font-extrabold tracking-tight text-slate-900">
                    Hostel<span className="text-brand-600">Hub</span>
                  </span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 transition active:scale-95"
                  aria-label={t('a11y.closeMenu')}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="safe-bottom min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3">
                <NavList nav={nav} t={t} pathname={pathname} onClick={onClose} />
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavList({ nav, t, pathname, onClick }: {
  nav: NavItem[]; t: (k: TKey) => string; pathname: string; onClick?: () => void;
}) {
  return (
    <nav className="flex w-full max-w-full flex-col gap-1">
      {nav.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <a
            key={item.href}
            href={item.href}
            onClick={onClick}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              active
                ? 'bg-brand-100 text-brand-800 shadow-soft'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            )}
          >
            <Icon className={cn('h-4.5 w-4.5 shrink-0', active ? 'text-brand-600' : 'text-slate-400')} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{t(item.key)}</span>
            {active && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />
            )}
          </a>
        );
      })}
    </nav>
  );
}