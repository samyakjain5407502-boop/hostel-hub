'use client';

import { motion } from 'framer-motion';
import { Gift, ShieldCheck, TrendingUp, UtensilsCrossed } from 'lucide-react';
import { useLang, type TKey } from '@/i18n';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STEPS: { n: string; icon: typeof Gift; title: TKey; desc: TKey }[] = [
  { n: '01', icon: ShieldCheck, title: 'landing.how.s1t', desc: 'landing.how.s1d' },
  { n: '02', icon: UtensilsCrossed, title: 'landing.how.s2t', desc: 'landing.how.s2d' },
  { n: '03', icon: Gift, title: 'landing.how.s3t', desc: 'landing.how.s3d' },
  { n: '04', icon: TrendingUp, title: 'landing.how.s4t', desc: 'landing.how.s4d' }
];

/**
 * The operating loop, told as a numbered rail.
 * No bounding cards on purpose: four bare columns separated by white space read
 * calmer than four more boxes, and the oversized ghost numeral gives the section
 * its rhythm without adding another surface.
 */
export function HowItWorks() {
  const { t } = useLang();

  return (
    /* Canonical anchor: `#how-it-works` (the navbar "How it works" link and the
       footer deep links both resolve here; `#platform` was the old id). */
    <section id="how-it-works" className="scroll-mt-24 border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 sm:py-24">
        <header className="grid gap-5 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">{t('landing.nav.how')}</p>
            <h2 className="mt-3 text-balance font-display text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              {t('landing.how.title')}
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base lg:col-span-6 lg:pb-1">
            {t('landing.how.sub')}
          </p>
        </header>

        <ol className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ n, icon: Icon, title, desc }, i) => (
            <motion.li
              key={n}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.07, ease: EASE }}
              className="group relative"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-3 right-0 font-display text-5xl font-black leading-none tracking-tighter text-slate-300 opacity-70 transition-opacity duration-300 group-hover:opacity-100"
              >
                {n}
              </span>

              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-brand-600 shadow-panel transition-colors duration-300 group-hover:border-brand-200 group-hover:text-brand-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>

              <h3 className="mt-6 font-display text-base font-extrabold tracking-tight text-slate-900">{t(title)}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600">{t(desc)}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
