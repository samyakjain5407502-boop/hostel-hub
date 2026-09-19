'use client';

import { motion } from 'framer-motion';
import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import { Menu, LogOut, UserRound, Home, ShieldCheck } from 'lucide-react';
import * as React from 'react';
import { LogoMark } from '@/components/brand';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme/toggle';
import { NotificationBell } from '@/components/notification-bell';
import { Avatar } from '@/components/ui/avatar';
import { useLang } from '@/i18n';
import { clientSignOut } from '@/lib/client-session';
import { PORTAL_HOME, PORTAL_LABEL } from '@/lib/portals';
import type { Role } from '@/types';

export function Topbar({ role, name, onMenuClick }: { role: Role; name: string; onMenuClick: () => void }) {
  const { t } = useLang();
  const home = PORTAL_HOME[role];
  const portalLabel = role === 'admin' ? t('nav.adminPortal') : role === 'operator' ? PORTAL_LABEL.operator : t('nav.studentPortal');
  const homeLabel = role === 'admin' ? t('admin.title') : role === 'operator' ? 'Operator Console' : t('nav.dashboard');

  return (
    <header className="glass-header sticky top-0 z-40 w-full max-w-full overflow-x-clip">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition active:scale-95 lg:hidden"
          aria-label={t('a11y.openMenu')}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <a href={home} className="flex min-w-0 items-center gap-2">
          <LogoMark />
          <span className="truncate font-display text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
            Hostel<span className="text-brand-600">Hub</span>
          </span>
          <span className="ml-1 hidden rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 md:inline-flex">
            {portalLabel}
          </span>
        </a>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <ThemeToggle />
          <LanguageSwitcher />
          <NotificationBell />
          <UserMenu role={role} name={name} portalLabel={portalLabel} home={home} homeLabel={homeLabel} />
        </div>
      </div>
    </header>
  );
}

function UserMenu({ role, name, portalLabel, home, homeLabel }: {
  role: Role; name: string; portalLabel: string; home: string; homeLabel: string;
}) {
  const { t } = useLang();
  return (
    <RadixDropdown.Root>
      <RadixDropdown.Trigger className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-3 py-1 shadow-lift hover:border-brand-300" aria-label="Account menu">
        <Avatar name={name} size="sm" ring />
        <span className="hidden max-w-[140px] truncate text-sm font-medium text-slate-700 sm:flex items-center gap-1">{name}<UserRound className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /></span>
      </RadixDropdown.Trigger>
      <RadixDropdown.Portal>
        <RadixDropdown.Content
          sideOffset={8}
          align="end"
          className="z-[60] w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-soft"
        >
          <div className="flex items-center gap-2 px-2.5 py-2">
            <Avatar name={name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
              <p className="text-[11px] text-slate-400">{portalLabel}</p>
            </div>
          </div>
          <RadixDropdown.Separator className="mx-2 my-1 h-px bg-slate-200" />
          <RadixDropdown.Item
            onSelect={() => { window.location.href = home; }}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-brand-50"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            {homeLabel}
          </RadixDropdown.Item>
          <RadixDropdown.Item
            onSelect={clientSignOut}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-rose-600 outline-none data-[highlighted]:bg-rose-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t('nav.signOut')}
          </RadixDropdown.Item>
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    </RadixDropdown.Root>
  );
}