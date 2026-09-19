'use client';

import {
  LayoutDashboard, UtensilsCrossed, Star, LifeBuoy, Gift, Trophy, Wallet,
  Users, Utensils, KanbanSquare, Radar, X, Receipt, QrCode, Grid3x3, UserPlus
} from 'lucide-react';
import * as React from 'react';
import { motion } from 'framer-motion';
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

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden w-60 shrink-0 lg:flex lg:flex-col gap-1 p-3" aria-label="Primary">
        <NavList nav={nav} t={t} pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      <div className="lg:hidden">
        <motion.div
          initial={false}
          animate={open ? { opacity: 1 } : { opacity: 0 }}
          onClick={onClose}
          className={cn('fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm transition-opacity', !open && 'pointer-events-none opacity-0')}
        />
        <motion.div
          initial={{ x: -260 }}
          animate={open ? { x: 0 } : { x: -260 }}
          transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
          className="fixed left-0 top-0 z-[75] flex h-dvh w-72 flex-col gap-1 bg-white p-3 pt-6 shadow-soft"
        >
          <button onClick={onClose} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500" aria-label="Close menu">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <NavList nav={nav} t={t} pathname={pathname} onClick={onClose} />
        </motion.div>
      </div>
    </>
  );
}

function NavList({ nav, t, pathname, onClick }: {
  nav: NavItem[]; t: (k: TKey) => string; pathname: string; onClick?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
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
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              active
                ? 'bg-brand-100 text-brand-800 shadow-soft'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            )}
          >
            <Icon className={cn('h-4.5 w-4.5', active ? 'text-brand-600' : 'text-slate-400')} aria-hidden="true" />
            {t(item.key)}
            {active && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-600" aria-hidden="true" />
            )}
          </a>
        );
      })}
    </nav>
  );
}