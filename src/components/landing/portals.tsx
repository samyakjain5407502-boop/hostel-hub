'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  Plus,
  Sparkles,
  Building2,
  ChefHat,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  UtensilsCrossed,
  Gift,
  Wallet,
  QrCode,
  ClipboardList,
  CalendarDays,
  Calculator,
  UserCheck,
  BedDouble,
  ScrollText,
  BarChart3,
  type LucideIcon
} from 'lucide-react';
import * as React from 'react';
import { useLang, type TKey } from '@/i18n';
import { cn } from '@/lib/utils';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type PortalCard = {
  role: 'student' | 'operator' | 'management' | 'admin';
  href: string;
  icon: LucideIcon;
  accent: string;
  titleKey: TKey;
  descKey: TKey;
  span: string;
  chips: Array<{ icon: LucideIcon; key: TKey }>;
};

const PORTALS: PortalCard[] = [
    {
      role: 'student' as const,
      href: '/auth/student',
      icon: GraduationCap,
      accent: 'from-brand-600 to-violet-600',
      titleKey: 'portal.student',
      descKey: 'landing.portals.p1d',
      span: 'lg:col-span-3',
      chips: [
        { icon: LayoutDashboard, key: 'nav.dashboard' },
        { icon: UtensilsCrossed, key: 'nav.mess' },
        { icon: Gift, key: 'nav.rewards' },
        { icon: Wallet, key: 'nav.wallet' },
        { icon: QrCode, key: 'nav.gatepass' }
      ]
    },
    {
      role: 'operator' as const,
      href: '/auth/operator',
      icon: ChefHat,
      accent: 'from-amber-500 to-orange-600',
      titleKey: 'portal.operator',
      descKey: 'landing.portals.p2d',
      span: 'lg:col-span-3',
      chips: [
        { icon: ClipboardList, key: 'nav.messConsole' },
        { icon: CalendarDays, key: 'nav.messMenu' },
        { icon: Calculator, key: 'nav.messIngredients' }
      ]
    },
    {
      role: 'management' as const,
      href: '/auth/management',
      icon: Building2,
      accent: 'from-sky-500 to-indigo-600',
      titleKey: 'portal.management',
      descKey: 'landing.portals.p3d',
      span: 'lg:col-span-3',
      chips: [
        { icon: UserCheck, key: 'nav.mgmtAdmissions' },
        { icon: BedDouble, key: 'nav.mgmtInventory' },
        { icon: ScrollText, key: 'nav.mgmtInvoices' }
      ]
    },
    {
      role: 'admin' as const,
      href: '/auth/admin',
      icon: Landmark,
      accent: 'from-violet-600 to-fuchsia-600',
      titleKey: 'portal.admin',
      descKey: 'landing.portals.p4d',
      span: 'lg:col-span-3',
      chips: [
        { icon: Building2, key: 'nav.adminBranches' },
        { icon: BarChart3, key: 'nav.adminAnalytics' },
        { icon: ScrollText, key: 'nav.logsAdmin' }
      ]
    }
  ];

/**
 * The 4-portal hub — the core experience.
 *
 * A stunning, interactive bento grid showcasing all four portals:
 * Student, Mess Operator, Management Desk, and Admin Command.
 *
 * Each card is a tactile, elevated surface with a clean slate-200 border.
 * On hover, cards elevate smoothly and cast a soft, premium shadow.
 *
 * The Admin/Developer card has a clear, prominent link to the
 * "New College / Branch Registration" module.
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

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {PORTALS.map((portal, i) => (
            <PortalTile key={portal.role} portal={portal} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * One tactile bento tile.
 * Elevation is Framer Motion (`whileHover` spring on `y`), shadow + border swap
 * on the CSS beat, and a cursor-tracked indigo spotlight written straight to the
 * node so hovering never triggers a React render.
 */
function PortalTile({ portal, index }: { portal: PortalCard; index: number }) {
  const { t } = useLang();
  const elRef = React.useRef<HTMLElement | null>(null);
  const Icon = portal.icon;
  const isAdmin = portal.role === 'admin';

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
        portal.span
      )}
    >
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              'grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lift transition-transform duration-300 group-hover:scale-[1.06]',
              portal.accent
            )}
          >
            <Icon className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-6" aria-hidden="true" />
          </span>
          <span className="font-display text-[11px] font-black tracking-[0.3em] text-slate-300 transition-colors duration-300 group-hover:text-brand-300">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        <h3 className="mt-5 font-display text-lg font-extrabold tracking-tight text-slate-900">
          {t(portal.titleKey)}
        </h3>
        <p className={cn('mt-2 max-w-xl text-sm leading-relaxed text-slate-600')}>
          {t(portal.descKey)}
        </p>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {portal.chips.map(({ icon: ChipIcon, key }) => (
            <li
              key={key}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
            >
              <ChipIcon className="h-3 w-3 shrink-0 text-brand-500" aria-hidden="true" />
              {t(key)}
            </li>
          ))}
        </ul>

        <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700">
          {t('landing.portals.open')}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>

      {/* Admin card gets a prominent registration CTA */}
      {isAdmin && (
        <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <div className="flex items-start gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-violet-600 shadow-lift">
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
            className="relative z-30 mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-btn transition hover:bg-violet-700 active:scale-[.98]"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t('branches.register')}
          </a>
        </div>
      )}

      {/* Stretched hit area: the whole tile opens the portal. */}
      <a
        href={portal.href}
        aria-label={`${t(portal.titleKey)} — ${t('landing.portals.open')}`}
        className="absolute inset-0 z-20 rounded-[1.75rem]"
      />
    </motion.article>
  );
}
