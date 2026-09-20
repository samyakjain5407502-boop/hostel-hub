'use client';

import {
  LayoutDashboard, UtensilsCrossed, Star, LifeBuoy, Gift, Trophy, Wallet,
  Users, Utensils, KanbanSquare, Radar, X, Receipt, QrCode, Grid3x3, UserPlus,
  Building2, UserCog, ScrollText, ChefHat, Leaf, ClipboardList, BarChart3,
  type LucideIcon
} from 'lucide-react';
import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LogoMark } from '@/components/brand';
import { useLang, TKey } from '@/i18n';
import { cn } from '@/lib/utils';
import { PORTAL_HOME } from '@/lib/portals';
import type { Role } from '@/types';

interface NavItem {
  href: string;
  /** i18n key — omit and set `label` for plain-text items. */
  key?: TKey;
  label?: string;
  icon: LucideIcon;
  /** Renders a small pulse dot (live surfaces). */
  live?: boolean;
}

/** Optional heading inside a portal rail. */
interface NavGroup {
  section?: TKey;
  items: NavItem[];
}

const STUDENT_NAV: NavGroup[] = [
  {
    items: [
      { href: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
      { href: '/dashboard/mess', key: 'nav.mess', icon: UtensilsCrossed, live: true },
      { href: '/dashboard/plate', key: 'nav.plate', icon: Utensils },
      { href: '/dashboard/rate', key: 'nav.rating', icon: Star }
    ]
  },
  {
    section: 'nav.section.you',
    items: [
      { href: '/dashboard/rewards', key: 'nav.rewards', icon: Gift },
      { href: '/dashboard/leaderboard', key: 'nav.leaderboard', icon: Trophy },
      { href: '/dashboard/wallet', key: 'nav.wallet', icon: Wallet }
    ]
  },
  {
    section: 'nav.section.management',
    items: [
      { href: '/dashboard/ledger', key: 'nav.ledger', icon: Receipt },
      { href: '/dashboard/gatepass', key: 'nav.gatepass', icon: QrCode },
      { href: '/dashboard/complaints', key: 'nav.complaints', icon: LifeBuoy },
      { href: '/dashboard/book', key: 'nav.booking', icon: Building2 }
    ]
  }
];


const OPERATOR_NAV: NavGroup[] = [
  {
    items: [
      { href: '/mess', key: 'nav.messConsole', icon: ChefHat, live: true },
      { href: '/mess/menu', key: 'nav.messMenu', icon: UtensilsCrossed },
      { href: '/mess/ingredients', key: 'nav.messIngredients', icon: ClipboardList }
    ]
  }
];

const MANAGEMENT_NAV: NavGroup[] = [
  {
    items: [
      { href: '/management', key: 'nav.mgmtDashboard', icon: LayoutDashboard },
      { href: '/management/admissions', key: 'nav.mgmtAdmissions', icon: UserPlus },
      { href: '/management/walkin', key: 'nav.mgmtWalkin', icon: ClipboardList }
    ]
  },
  {
    section: 'nav.section.management',
    items: [
      { href: '/management/inventory', key: 'nav.mgmtInventory', icon: Grid3x3 },
      { href: '/management/invoices', key: 'nav.mgmtInvoices', icon: Receipt }
    ]
  }
];

const ADMIN_NAV: NavGroup[] = [
  {
    items: [
      { href: '/admin', key: 'admin.title', icon: LayoutDashboard },
      { href: '/admin/branches', key: 'nav.adminBranches', icon: Building2 },
      { href: '/admin/analytics', key: 'nav.adminAnalytics', icon: BarChart3, live: true },
      { href: '/admin/rewards', key: 'nav.rewardsAdmin', icon: Radar }
    ]
  },
  {
    section: 'nav.section.mess',
    items: [
      { href: '/admin/headcount', key: 'nav.headcountAdmin', icon: Users },
      { href: '/admin/menu', key: 'nav.menuAdmin', icon: Utensils }
    ]
  },
  {
    section: 'nav.section.admin',
    items: [
      { href: '/admin/complaints', key: 'nav.complaintsAdmin', icon: KanbanSquare },
      { href: '/admin/gatepass', key: 'nav.gatepass', icon: QrCode },
      { href: '/admin/operators', label: 'Operator Onboarding', icon: UserCog },
      { href: '/admin/colleges', label: 'Colleges & Approvals', icon: Leaf },
      { href: '/admin/logs', label: 'System Logs', icon: ScrollText }
    ]
  }
];

const NAV: Record<Role, NavGroup[]> = {
  student: STUDENT_NAV,
  operator: OPERATOR_NAV,
  management: MANAGEMENT_NAV,
  admin: ADMIN_NAV
};

export function Sidebar({ role, pathname, open, onClose }: {
  role: Role; pathname: string; open: boolean; onClose: () => void;
}) {
  const { t } = useLang();
  const nav = NAV[role];
  const home = PORTAL_HOME[role];

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
        className="sticky top-[4.5rem] hidden max-h-[calc(100dvh-6rem)] w-64 shrink-0 flex-col gap-1 overflow-y-auto p-3 lg:flex"
        aria-label={t('a11y.primaryNav')}
      >
        <NavList groups={nav} t={t} pathname={pathname} />
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
                <NavList groups={nav} t={t} pathname={pathname} onClick={onClose} />
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavList({ groups, t, pathname, onClick }: {
  groups: NavGroup[]; t: (k: TKey) => string; pathname: string; onClick?: () => void;
}) {
  return (
    <nav className="flex w-full max-w-full flex-col gap-1">
      {groups.map((group, gi) => (
        <div key={group.section ?? `g${gi}`} className="flex flex-col gap-1">
          {group.section && (
            <p className="mt-3 px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {t(group.section)}
            </p>
          )}
          {group.items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={onClick}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'bg-brand-100 font-semibold text-brand-800 shadow-soft'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon
                  className={cn(
                    'h-[18px] w-[18px] shrink-0 transition',
                    active ? 'text-brand-600' : 'text-slate-500 group-hover:text-brand-600'
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{item.key ? t(item.key) : item.label}</span>
                {item.live && !active && (
                  <span className="live-halo h-1.5 w-1.5 shrink-0 rounded-full bg-success-500 text-success-500" aria-hidden="true" />
                )}
                {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />}
              </a>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
