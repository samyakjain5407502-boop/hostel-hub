'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Building2 } from 'lucide-react';
import { useLang } from '@/i18n';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Closing call to action.
 * One white panel with a hairline grid and two soft brand washes — the quiet
 * counterpart to the saturated impact band above it. The registration module
 * reappears here as a third, deliberately lesser door.
 */
export function FinalCta() {
  const { t } = useLang();

  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 sm:py-24">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-6 py-14 text-center shadow-panel sm:px-14">
          <div aria-hidden="true" className="grid-lines grid-fade pointer-events-none absolute inset-0 opacity-70" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-brand-400/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-violet-400/15 blur-3xl"
          />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance font-display text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              {t('landing.cta.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-700 sm:text-base">
              {t('landing.cta.sub')}
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <motion.a
                href="/auth/student"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.16, ease: EASE }}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-btn-strong transition-shadow duration-300 hover:shadow-btn-hover"
              >
                {t('landing.cta.primary')}
                <ArrowRight
                  className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </motion.a>

              <motion.a
                href="/auth"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.16, ease: EASE }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-btn transition duration-300 hover:border-brand-200 hover:text-brand-700 hover:shadow-btn-hover"
              >
                {t('landing.cta.secondary')}
              </motion.a>
            </div>

            <p className="mt-5 text-xs font-semibold text-slate-600">{t('landing.cta.foot')}</p>

            <a
              href="/onboard"
              className="mt-7 inline-flex items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-xs font-bold text-slate-900 transition duration-200 hover:border-brand-300 active:scale-[.98]"
            >
              <Building2 className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />
              {t('landing.portals.register')}
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
