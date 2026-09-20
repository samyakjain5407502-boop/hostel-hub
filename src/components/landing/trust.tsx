'use client';

import { motion } from 'framer-motion';
import { BadgeCheck, GraduationCap } from 'lucide-react';
import { useLang, type TKey } from '@/i18n';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Campus operators the demo dataset represents — proper nouns, kept verbatim. */
const PARTNERS = [
  'Medi-Caps University',
  'LNCT Boys Hostel',
  'Symbiosis Residency',
  'VIT PG Block',
  'DAVV Girls Hostel',
  'IIT Indore Hostel Office'
];

const METRICS: [string, TKey][] = [
  ['−38%', 'landing.trust.metric1'],
  ['+1.2k', 'landing.trust.metric2'],
  ['98%', 'landing.trust.metric3'],
  ['99.9%', 'landing.trust.metric4']
];

/**
 * Social-proof rail under the hero.
 * Four measured outcomes first (they carry the meaning), then the operator
 * marquee as a decorative `aria-hidden` band — duplicated once and translated
 * -50% for a seamless loop.
 */
export function TrustRail() {
  const { t } = useLang();

  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 sm:py-14">
        <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-slate-200">
          {METRICS.map(([value, key], i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: EASE }}
              className="lg:px-10 lg:first:pl-0 lg:last:pr-0"
            >
              <dd className="font-display text-3xl font-black tracking-tight text-slate-900">{value}</dd>
              <dt className="mt-1.5 text-xs font-semibold text-slate-600">{t(key)}</dt>
            </motion.div>
          ))}
        </dl>

        <div className="mt-12 flex flex-col gap-5 border-t border-slate-200 pt-7 lg:flex-row lg:items-center lg:gap-10">
          <p className="flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
            <BadgeCheck className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
            {t('landing.trust.partners')}
          </p>

          <div className="marquee-mask w-full overflow-hidden" aria-hidden="true">
            <div className="marquee-track gap-10">
              {[...PARTNERS, ...PARTNERS].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="flex shrink-0 items-center gap-2 whitespace-nowrap font-display text-sm font-bold text-slate-600"
                >
                  <GraduationCap className="h-4 w-4 shrink-0 text-brand-500" />
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { TrustRail as TrustBar };
