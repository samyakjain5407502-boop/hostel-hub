'use client';

/**
 * Auth hub — the "Choose your portal" entry point (4-tier architecture).
 * Signed-in users never see this screen (middleware bounces them to their
 * portal home); anonymous visitors pick between all four portals here.
 */

import { motion } from 'framer-motion';
import { GraduationCap, ChefHat, Building2, Landmark, ArrowRight } from 'lucide-react';
import { LogoMark } from '@/components/brand';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme/toggle';
import { Footer } from '@/components/footer';
import { useLang } from '@/i18n';
import { DEMO_STUDENT, DEMO_OPERATOR, DEMO_MANAGER, DEMO_ADMIN } from '@/lib/auth';

const PORTALS = [
  {
    href: '/auth/student',
    icon: GraduationCap,
    accent: 'from-brand-500 to-emerald-500',
    portalKey: 'portal.student',
    sub: 'Mess plates, absence skips, rewards & scratch cards, fee ledger, gate pass QR, complaints',
    cred: `Demo: ${DEMO_STUDENT.id} · ${DEMO_STUDENT.password}`
  },
  {
    href: '/auth/mess',
    icon: ChefHat,
    accent: 'from-amber-500 to-orange-600',
    portalKey: 'portal.operator',
    sub: 'Live kitchen headcount, meal slots (Breakfast → Dinner), ingredient calculator, meal status toggle',
    cred: `Demo: ${DEMO_OPERATOR.id} · ${DEMO_OPERATOR.passkey}`
  },
  {
    href: '/auth/management',
    icon: Building2,
    accent: 'from-violet-500 to-fuchsia-600',
    portalKey: 'portal.management',
    sub: 'Application verification queue, walk-in admissions, room & bed matrix, fee invoices',
    cred: `Demo: ${DEMO_MANAGER.key} · ${DEMO_MANAGER.id} · ${DEMO_MANAGER.passkey}`
  },
  {
    href: '/auth/admin',
    icon: Landmark,
    accent: 'from-sky-500 to-indigo-600',
    portalKey: 'portal.admin',
    sub: 'College & branch registration, occupancy & wastage BI, rewards engine, diagnostic logs',
    cred: `Demo: ${DEMO_ADMIN.key} · ${DEMO_ADMIN.id} · ${DEMO_ADMIN.passkey}`
  }
] as const;

export default function AuthHubPage() {
  const { t } = useLang();

  return (
    <div className="mesh-bg flex min-h-dvh w-full max-w-full flex-col overflow-x-clip">
      <div className="glass-header sticky top-0 z-40 flex w-full max-w-full items-center justify-between gap-2 px-4 py-3 sm:px-5">
        <a href="/" className="flex min-w-0 items-center gap-2">
          <LogoMark />
          <span className="truncate font-display text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
            Hostel<span className="text-brand-600">Hub</span>
          </span>
        </a>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-10 sm:px-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center"
        >
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            {t('portal.choose')}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">{t('portal.chooseHint')}</p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {PORTALS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.a
                key={p.href}
                href={p.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 * i }}
                className="lift group flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-lift transition hover:border-brand-300"
              >
                <div className="flex items-center gap-3">
                  <span className={`glow-brand grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white ${p.accent}`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-display text-base font-extrabold text-slate-900">
                      {t(p.portalKey as Parameters<typeof t>[0])}
                    </span>
                    <span className="block text-xs font-medium text-slate-500">{p.cred}</span>
                  </span>
                  <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{p.sub}</p>
              </motion.a>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
