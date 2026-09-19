'use client';

import { LogoMark } from '@/components/brand';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme/toggle';
import { useLang } from '@/i18n';

export function LandingNav() {
  const { t } = useLang();
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
          <a href="/auth/student" className="hidden whitespace-nowrap text-sm font-semibold text-slate-700 hover:text-brand-700 sm:inline-flex">
            {t('nav.studentPortal')}
          </a>
          <a href="/auth/admin" className="whitespace-nowrap rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-soft transition hover:opacity-90 sm:px-4 sm:text-sm">
            {t('nav.adminPortal')}
          </a>
        </div>
      </div>
    </header>
  );
}