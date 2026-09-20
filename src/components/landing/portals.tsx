'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BedDouble,
  Building2,
  Calculator,
  CalendarDays,
  ChefHat,
  ClipboardList,
  Gift,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Plus,
  QrCode,
  ScrollText,
  Sparkles,
  UserCheck,
  UtensilsCrossed,
  Wallet,
  type LucideIcon
} from 'lucide-react';
import * as React from 'react';
import { useLang, type TKey } from '@/i18n';
import { PORTAL_AUTH } from '@/lib/portals';
import { cn } from '@/lib/utils';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export interface PortalCard {
  /** Login route for the portal (registry-driven). */
  href: string;
  icon: LucideIcon;
  /** Icon-tile gradient. */
  accent: string;
  titleKey: TKey;
  descKey: TKey;
  /** Bento placement at `lg` — the 7/5 · 5/7 rhythm is the whole asymmetry. */
  span: string;
  /** Capability chips — real navigation strings, so they stay translated. */
  chips: { icon: LucideIcon; key: TKey }[];
}

/**
 * The 4-tier portal chooser.
 * Routes come from the portal registry (`lib/portals`) and labels from the
 * dictionaries (`portal.*` / `nav.*`), so a route or wording change never has to
 * be mirrored here. `PORTAL_CARDS` is also consumed by the landing nav dropdown.
 */
export const PORTAL_CARDS: PortalCard[] = [
  {
    href: PORTAL_AUTH.student,
    icon: GraduationCap,
    accent: 'from-brand-600 to-violet-600',
    titleKey: 'portal.student',
    descKey: 'landing.portals.p1d',
    span: 'lg:col-span-7',
    chips: [
      { icon: LayoutDashboard, key: 'nav.dashboard' },
      { icon: UtensilsCrossed, key: 'nav.mess' },
      { icon: Gift, key: 'nav.rewards' },
      { icon: Wallet, key: 'nav.wallet' },
      { icon: QrCode, key: 'nav.gatepass' }
    ]
  },
  {
    href: PORTAL_AUTH.operator,
    icon: ChefHat,
    accent: 'from-amber-500 to-orange-600',
    titleKey: 'portal.operator',
    descKey: 'landing.portals.p2d',
    span: 'lg:col-span-5',
    chips: [
      { icon: ClipboardList, key: 'nav.messConsole' },
      { icon: CalendarDays, key: 'nav.messMenu' },
      { icon: Calculator, key: 'nav.messIngredients' }
    ]
  },
  {
    href: PORTAL_AUTH.management,
    icon: Building2,
    accent: 'from-sky-500 to-indigo-600',
    titleKey: 'portal.management',
    descKey: 'landing.portals.p3d',
    span: 'lg:col-span-5',
    chips: [
      { icon: UserCheck, key: 'nav.mgmtAdmissions' },
      { icon: BedDouble, key: 'nav.mgmtInventory' },
      { icon: ScrollText, key: 'nav.mgmtInvoices' }
    ]
  },
  {
    href: PORTAL_AUTH.admin,
    icon: Landmark,
    accent: 'from-violet-600 to-fuchsia-600',
    titleKey: 'portal.admin',
    descKey: 'landing.portals.p4d',
    span: 'lg:col-span-7',
    chips: [
      { icon: Building2, key: 'nav.adminBranches' },
      { icon: BarChart3, key: 'nav.adminAnalytics' },
      { icon: ScrollText, key: 'nav.logsAdmin' }
    ]
  }
];

/**
 * The 4-portal hub.
 * A bento grid, not a row of equal cards: 7/5 then 5/7 so the eye zig-zags, and
 * the admin tile carries the registration module inline instead of hiding it
 * behind a click.
 */
export function Portals() {
  const { t } = useLang();

  return (
    <section id="portals" className="relative scroll-mt-24 border-y border-slate-200 bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 sm:py-24">
        <header className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
              {t('landing.nav.portals')}
            </p>
            <h2 className="mt-3 text-balance font-display text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              {t('landing.portals.title')}
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base lg:col-span-5 lg:pb-1">
            {t('landing.portals.sub')}
          </p>
        </header>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
          {PORTAL_CARDS.map((card, i) => (
            <PortalTile key={card.href} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * One tactile bento tile.
 * Elevation is Framer Motion (`whileHover` spring on `y`), the shadow + border
 * swap on the CSS beat, and a cursor-tracked indigo spotlight is written
 * straight to the node so hovering never triggers a React render.
 */
function PortalTile({ card, index }: { card: PortalCard; index: number }) {
  const { t } = useLang();
  const elRef = React.useRef<HTMLElement | null>(null);
  const Icon = card.icon;
  const isAdmin = card.href === PORTAL_AUTH.admin;

  function trackSpotlight(event: React.MouseEvent<HTMLElement>) {
    const el = elRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    el.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  }

  return (
    <motion.article
      ref={(node) => {
        elRef.current = node;
      }}
      onMouseMove={trackSpotlight}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: EASE }}
      whileHover={{ y: -6 }}
      className={cn(
        'spotlight group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-panel transition-shadow duration-300 hover:shadow-panel-hover',
        card.span
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            'grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lift transition-transform duration-300 group-hover:scale-[1.06]',
            card.accent
          )}
        >
          <Icon className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-6" aria-hidden="true" />
        </span>
        <span className="font-display text-[11px] font-black tracking-[0.3em] text-slate-300 transition-colors duration-300 group-hover:text-brand-300">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <h3 className="mt-5 font-display text-lg font-extrabold tracking-tight text-slate-900">{t(card.titleKey)}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(card.descKey)}</p>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {card.chips.map(({ icon: ChipIcon, key }) => (
          <li
            key={key}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
          >
            <ChipIcon className="h-3 w-3 shrink-0 text-brand-500" aria-hidden="true" />
            {t(key)}
          </li>
        ))}
      </ul>

      {isAdmin && <RegisterModule />}

      <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-xs font-bold text-brand-700">
        {t('landing.portals.open')}
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden="true"
        />
      </span>

      {/* Stretched hit area: the whole tile opens the portal. Rendered last so it
          paints above the copy, while the registration CTA sits above *it*. */}
      <a
        href={card.href}
        aria-label={`${t(card.titleKey)} — ${t('landing.portals.open')}`}
        className="absolute inset-0 z-20 rounded-[1.75rem]"
      />
    </motion.article>
  );
}

/**
 * The registration module that lives inside the admin tile — the one door on the
 * landing page that a *new* college or branch can walk through without an
 * account (`/onboard`).
 */
function RegisterModule() {
  const { t } = useLang();

  return (
    <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 p-3.5 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-lift">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-slate-900">{t('landing.portals.register')}</p>
          <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-600">
            {t('landing.portals.registerSub')}
          </p>
        </div>
      </div>

      <a
        href="/onboard"
        className="relative z-30 mt-3 inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white shadow-btn transition hover:bg-brand-700 active:scale-[.98] sm:mt-0 sm:w-auto"
      >
        <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {t('branches.register')}
      </a>
    </div>
  );
}
