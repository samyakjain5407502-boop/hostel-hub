'use client';

import { LogoMark } from '@/components/brand';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme/toggle';
import { useLang } from '@/i18n';

export function LandingNav() {
  const { t } = useLang();
  return (
    <header className="glass-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
        <a href="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="font-display text-lg font-extrabold tracking-tight text-slate-900">Hostel<span className="text-brand-600">Hub</span></span>
        </a>
        <nav className="ml-6 hidden gap-6 text-sm text-slate-600 md:flex" aria-label={t('landing.nav.features')}>
          <a href="#features" className="hover:text-brand-700">{t('landing.nav.features')}</a>
          <a href="/#how" className="hover:text-brand-700">{t('landing.nav.how')}</a>
          <a href="/#rewards" className="hover:text-brand-700">{t('landing.nav.rewards')}</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          <a href="/auth/student" className="hidden text-sm font-semibold text-slate-700 hover:text-brand-700 sm:inline-flex">
            {t('nav.studentPortal')}
          </a>
          <a href="/auth/admin" className="rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:opacity-90">
            {t('nav.adminPortal')}
          </a>
        </div>
      </div>
    </header>
  );
}