'use client';

import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import { ChevronDown, GraduationCap, Landmark, ChefHat } from 'lucide-react';
import { LogoMark } from '@/components/brand';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme/toggle';
import { useLang } from '@/i18n';

/**
 * Landing navigation — portal chooser (3-portal architecture).
 * The "Sign in" control offers all three portals: Student, Mess Operator
 * and Admin / Management, each with its own auth route.
 */
export function LandingNav() {
  const { t } = useLang();

  const portals = [
    { href: '/auth/student', icon: GraduationCap, title: 'Student Login', sub: 'Mess, complaints, rewards' },
    { href: '/auth/mess', icon: ChefHat, title: 'Mess Operator Login', sub: 'Headcount, plates, service' },
    { href: '/auth/admin', icon: Landmark, title: 'Admin / Management Login', sub: 'Colleges, operators, system' }
  ];

  return (
    <header className="glass-header sticky top-0 z-40 w-full max-w-full overflow-x-clip">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-5">
        <a href="/" className="flex min-w-0 items-center gap-2">
          <LogoMark />
          <span className="truncate font-display text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">Hostel<span className="text-brand-600">Hub</span></span>
        </a>
        <nav className="ml-6 hidden gap-6 text-sm text-slate-600 md:flex" aria-label={t('landing.nav.features')}>
          <a href="#features" className="hover:text-brand-700">{t('landing.nav.features')}</a>
          <a href="/#how" className="hover:text-brand-700">{t('landing.nav.how')}</a>
          <a href="/#rewards" className="hover:text-brand-700">{t('landing.nav.rewards')}</a>
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <LanguageSwitcher />

          {/* Portal switcher */}
          <RadixDropdown.Root>
            <RadixDropdown.Trigger className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-soft transition hover:opacity-90 sm:px-4 sm:text-sm">
              Sign in
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </RadixDropdown.Trigger>
            <RadixDropdown.Portal>
              <RadixDropdown.Content
                align="end"
                sideOffset={8}
                className="z-[60] w-72 rounded-xl border border-slate-200 bg-white p-1.5 shadow-soft"
              >
                <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Choose your portal
                </p>
                {portals.map(({ href, icon: Icon, title, sub }) => (
                  <RadixDropdown.Item
                    key={href}
                    onSelect={() => { window.location.href = href; }}
                    className="flex cursor-pointer select-none items-start gap-3 rounded-lg px-2.5 py-2.5 text-sm outline-none data-[highlighted]:bg-brand-50"
                  >
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-slate-800">{title}</span>
                      <span className="block text-xs text-slate-500">{sub}</span>
                    </span>
                  </RadixDropdown.Item>
                ))}
              </RadixDropdown.Content>
            </RadixDropdown.Portal>
          </RadixDropdown.Root>
        </div>
      </div>
    </header>
  );
}
