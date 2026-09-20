'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CirclePlay, Sparkles } from 'lucide-react';
import { useLang, type TKey } from '@/i18n';
import { LiveConsole } from './console';

const CHIPS: TKey[] = ['landing.hero.chip1', 'landing.hero.chip2', 'landing.hero.chip3', 'landing.hero.chip4'];
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Hero — deliberately asymmetrical (7/5 split: copy left, live console right) so
 * the eye lands on the headline first and then travels into the product.
 *
 * Craft notes:
 *  • The whole headline is one deep indigo→violet gradient that holds 5.7:1–11.4:1
 *    contrast on pure white, and the body copy sits on slate-700 (10.4:1) so the
 *    description stays razor sharp against the pure-white page.
 *  • The eyebrow states ownership up front — Medi-Caps University · Cause ’26 —
 *    straight from the dictionaries (`landing.badge`).
 *  • The live badge is a status bar, not a floating sticker: pulsing green ring,
 *    live headcount and saved waste read as one live sentence.
 *  • Buttons use hand-tuned elevation (`shadow-btn*`) and answer a press with a
 *    Framer Motion scale rather than a CSS-only jump.
 */
export function Hero() {
  const { t } = useLang();

  return (
    <section className="relative isolate overflow-hidden bg-white">
      {/* Hairline grid, two slow brand washes and a calm fade into the page. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="grid-lines grid-fade absolute inset-0 opacity-80" />
        <div className="drift absolute -left-32 -top-28 h-80 w-80 rounded-full bg-brand-400/20 blur-3xl" />
        <div
          className="drift absolute -right-24 top-6 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl"
          style={{ animationDelay: '2.6s' }}
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-white" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:pb-24 lg:pt-20">
        {/* ── Copy column ────────────────────────────────────────────── */}
        <div className="lg:col-span-7 lg:pr-6">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600 shadow-panel"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />
            {t('landing.badge')}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease: EASE }}
            className="text-gradient-indigo mt-6 text-balance font-display text-[2.6rem] font-black leading-[1.03] tracking-[-0.03em] sm:text-5xl lg:text-[3.9rem]"
          >
            {t('landing.hero.titleA')} {t('landing.hero.titleHi')} {t('landing.hero.titleB')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: EASE }}
            className="mt-5 max-w-xl text-base leading-relaxed text-slate-700 sm:text-lg"
          >
            {t('landing.hero.sub')}
          </motion.p>

          {/* Live status bar — one sentence, three live facts. */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
            className="mt-7 inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-panel"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
              <span aria-hidden="true" className="live-halo absolute inset-0 rounded-full bg-current text-success-500" />
              <span aria-hidden="true" className="relative h-2.5 w-2.5 rounded-full bg-success-500 ring-4 ring-success-100" />
            </span>
            <span className="text-xs font-bold text-slate-900">{t('landing.hero.live')}</span>
            <span aria-hidden="true" className="hidden h-4 w-px bg-slate-200 sm:block" />
            <span className="text-xs font-semibold text-slate-600">{t('landing.hero.liveNow', { n: 402 })}</span>
            <span aria-hidden="true" className="hidden h-4 w-px bg-slate-200 sm:block" />
            <span className="text-xs font-semibold text-slate-600">2.1 kg · {t('landing.mock.waste')}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24, ease: EASE }}
            className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center"
          >
            <motion.a
              href="/auth"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.16, ease: EASE }}
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-btn-strong transition-shadow duration-300 hover:shadow-btn-hover"
            >
              {t('landing.hero.ctaExplore')}
              <ArrowRight
                className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </motion.a>

            <motion.a
              href="/auth/student"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.16, ease: EASE }}
              className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-btn transition duration-300 hover:border-brand-200 hover:text-brand-700 hover:shadow-btn-hover"
            >
              <CirclePlay className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
              {t('landing.hero.ctaDemo')}
            </motion.a>
          </motion.div>

          <p className="mt-4 text-xs font-semibold text-slate-600">{t('landing.hero.note')}</p>

          <ul className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-slate-600">
            {CHIPS.map((key, i) => (
              <li key={key} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slate-300" />}
                {t(key)}
              </li>
            ))}
          </ul>

        </div>

        {/* ── Product column ─────────────────────────────────────────── */}
        <div className="relative w-full lg:col-span-5 lg:-mt-4">
          <LiveConsole />
        </div>
      </div>
    </section>
  );
}
