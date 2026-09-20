'use client';

import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import { Building2, ChevronDown } from 'lucide-react';
import { LogoMark } from '@/components/brand';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme/toggle';
import { useLang } from '@/i18n';
import { cn } from '@/lib/utils';
import { PORTAL_CARDS } from './portals';

/**
 * In-page destinations. Each href is rooted at `/` so the same header works on
 * the landing page *and* on /hostels, /onboard — the anchors resolve from home.
 */
const LINKS = [
  { href: '/#portals', key: 'landing.nav.portals' },
  { href: '/#features', key: 'landing.nav.features' },
  { href: '/#platform', key: 'landing.nav.how' },
  { href: '/#rewards', key: 'landing.nav.rewards' }
] as const;

/**
 * Landing navigation — sticky glass header.
 * Brand, four section links (with a hand-drawn underline that grows on hover),
 * a quiet "list your hostel" door for new colleges, the theme + language
 * controls, and one prominent primary action that opens the 4-tier chooser.
 */
export function LandingNav() {
  const { t } = useLang();

  return (
    <header className="glass-header sticky top-0 z-40 w-full max-w-full overflow-x-clip">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-3 sm:px-6">
        <a href="/" className="flex min-w-0 items-center gap-2.5" aria-label={t('app.name')}>
          <LogoMark />
          <span className="truncate font-display text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
            Hostel<span className="text-brand-600">Hub</span>
          </span>
        </a>

        <nav className="ml-8 hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex" aria-label={t('a11y.mainNav')}>
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="group relative transition-colors hover:text-brand-700">
              {t(link.key)}
              <span
                aria-hidden="true"
                className="absolute -bottom-1.5 left-0 h-0.5 w-0 rounded-full bg-brand-600 transition-all duration-300 group-hover:w-full"
              />
            </a>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <a
            href="/onboard"
            className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-white hover:text-brand-700 lg:inline-flex"
          >
            <Building2 className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
            {t('owner.title')}
          </a>
          <ThemeToggle />
          <LanguageSwitcher />
          <PortalMenu />
        </div>
      </div>

      {/* Phones: a slim scrollable rail keeps all four sections reachable. */}
      <nav
        className="no-scrollbar mx-auto flex w-full max-w-7xl gap-1.5 overflow-x-auto px-4 pb-2.5 sm:px-6 md:hidden"
        aria-label={t('a11y.mainNav')}
      >
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="whitespace-nowrap rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 backdrop-blur transition hover:border-brand-300 hover:text-brand-700"
          >
            {t(link.key)}
          </a>
        ))}
      </nav>
    </header>
  );
}

/** Primary action — opens all four portal logins, sourced from the registry. */
function PortalMenu() {
  const { t } = useLang();

  return (
    <RadixDropdown.Root>
      <RadixDropdown.Trigger className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 px-3.5 py-2 text-xs font-bold text-white shadow-btn transition hover:shadow-btn-hover active:scale-[.98] sm:px-4 sm:text-sm">
        {t('landing.nav.signIn')}
        <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      </RadixDropdown.Trigger>
      <RadixDropdown.Portal>
        <RadixDropdown.Content
          align="end"
          sideOffset={10}
          className="z-[60] w-80 max-w-[calc(100vw-1rem)] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-panel"
        >
          <RadixDropdown.Label className="px-2.5 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">
            {t('portal.choose')}
          </RadixDropdown.Label>
          {PORTAL_CARDS.map(({ href, icon: Icon, accent, titleKey, descKey }) => (
            <RadixDropdown.Item
              key={href}
              onSelect={() => {
                window.location.href = href;
              }}
              className="flex cursor-pointer select-none items-start gap-3 rounded-xl px-2.5 py-2.5 text-sm outline-none data-[highlighted]:bg-brand-50"
            >
              <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white', accent)}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-bold text-slate-800">{t(titleKey)}</span>
                <span className="block text-xs text-slate-600">{t(descKey)}</span>
              </span>
            </RadixDropdown.Item>
          ))}
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    </RadixDropdown.Root>
  );
}
