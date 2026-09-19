'use client';

import { motion } from 'framer-motion';
import { ArrowRight, GraduationCap, Sparkles } from 'lucide-react';
import { useLang } from '@/i18n';

export function Hero() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-6xl px-5 pb-20 pt-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-700"
      >
        <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
        {t('app.institute')}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h1 className="mt-5 text-balance text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
          {t('landing.hero.titleA')}{' '}
          <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">{t('landing.hero.titleHi')}</span>
          <br /> {t('landing.hero.titleB')}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">{t('landing.hero.sub')}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mt-7 flex flex-wrap items-center justify-center gap-3"
      >
        <a href="/auth/student" className="group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-soft hover:bg-brand-700">
          {t('nav.studentPortal')}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </a>
        <a href="/auth/admin" className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-700">
          {t('nav.adminPortal')}
        </a>
      </motion.div>

      <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-slate-500">
        {HERO_CHIPS.map((key) => (
          <li key={key} className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-brand-500" aria-hidden="true" /> {t(key)}
          </li>
        ))}
      </ul>
    </section>
  );
}

const HERO_CHIPS = ['landing.hero.chip1', 'landing.hero.chip2', 'landing.hero.chip3', 'landing.hero.chip4'] as const;