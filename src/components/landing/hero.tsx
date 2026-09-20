'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Users, Leaf, ShieldCheck, Clock } from 'lucide-react';
import { useLang, type TKey } from '@/i18n';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Hero — deeply engaging, asymmetrical grid that draws the eye.
 *
 * Craft notes:
 *  • The whole headline is one deep indigo→violet gradient that holds 5.7:1–11.4:1
 *    contrast on pure white, and the body copy sits on slate-700 (10.4:1) so the
 *    description stays razor sharp against the pure-white page.
 *  • The eyebrow states the product category up front — a multi-tenant hostel
 *    operations platform — straight from the dictionaries (`landing.badge`).
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
              href="/auth/student"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.16, ease: EASE }}
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 px-7 py-3.5 text-sm font-bold text-white shadow-btn-strong transition-shadow duration-300 hover:shadow-btn-hover"
            >
              {t('landing.hero.ctaDemo')}
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
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-slate-800 shadow-btn transition duration-300 hover:border-brand-200 hover:text-brand-700 hover:shadow-btn-hover"
            >
              {t('landing.hero.ctaSecondary')}
            </motion.a>
          </motion.div>

          <p className="mt-4 text-xs font-semibold text-slate-600">{t('landing.hero.note')}</p>

          <ul className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-slate-600">
            {(['landing.hero.chip1', 'landing.hero.chip2', 'landing.hero.chip3', 'landing.hero.chip4'] as const).map((key, i) => (
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

/**
 * Live console mock — the product surface that sits to the right of the copy.
 * Deliberately compact so the hero reads as one editorial flow, not two separate
 * blocks glued together.
 */
function LiveConsole() {
  const { t } = useLang();

  return (
    <div className="sheen rounded-[1.75rem] border border-slate-200 bg-white shadow-panel-hover">
      {/* Header strip */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-success-500" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600">{t('landing.mock.title')}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-slate-500">Live</span>
        </div>
      </div>

      {/* Body — six compact metric rows, no clutter */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3 rounded-xl bg-brand-50 p-3">
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600">{t('nav.headcount')}</span>
            <span className="font-display text-2xl font-black tracking-tight text-slate-900">402</span>
            <span className="text-[10px] font-semibold text-success-600">+{12} now</span>
          </div>
          <div className="h-px bg-brand-200 col-span-1" />
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600">{t('landing.mock.waste')}</span>
            <span className="font-display text-2xl font-black tracking-tight text-slate-900">2.1 kg</span>
            <span className="text-[10px] font-semibold text-success-600">this shift</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-500" aria-hidden="true" />
            <span className="text-xs font-semibold text-slate-700">{t('nav.mess')}</span>
          </div>
          <span className="text-xs font-bold text-slate-900">87%</span>
        </div>

        <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-success-500" aria-hidden="true" />
            <span className="text-xs font-semibold text-slate-700">{t('game.eco')}</span>
          </div>
          <span className="text-xs font-bold text-slate-900">A+</span>
        </div>

        <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-500" aria-hidden="true" />
            <span className="text-xs font-semibold text-slate-700">{t('nav.complaints')}</span>
          </div>
          <span className="text-xs font-bold text-slate-900">0 open</span>
        </div>

        {/* Mini activity line */}
        <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
          {t('landing.hero.liveNow', { n: 402 })} · {t('landing.mock.waste')} 2.1 kg
        </div>
      </div>
    </div>
  );
}

