'use client';

import { motion } from 'framer-motion';
import { Coins, Flame, Gift, TrendingUp, type LucideIcon } from 'lucide-react';
import { useLang, type TKey } from '@/i18n';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STATS: [string, TKey][] = [
  ['−38%', 'landing.stats.l1'],
  ['+1.2k', 'landing.stats.l2'],
  ['98%', 'landing.stats.l3'],
  ['3', 'landing.stats.l4']
];

/**
 * The gamified reward loop shown under the ledger.
 * Three mechanics, in the order a student meets them: an action, the streak it
 * feeds, and what the points actually buy. This is what `/#rewards` scrolls to,
 * so the anchor never lands on a row of numbers with no explanation.
 */
const MECHANICS: { icon: LucideIcon; key: TKey }[] = [
  { icon: Coins, key: 'landing.rewards.mech1' },
  { icon: Flame, key: 'landing.rewards.mech2' },
  { icon: Gift, key: 'landing.rewards.mech3' }
];

/**
 * Impact band (`#rewards`).
 * One saturated indigo→violet panel against an otherwise pure-white page: the
 * single moment of colour on the page, with a hairline grid for texture and a
 * divided metric row so the numbers read as a ledger, not a stat salad.
 */
export function ImpactBand() {
  const { t } = useLang();

  return (
    <section id="rewards" className="scroll-mt-24 bg-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 sm:py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-800 via-brand-700 to-violet-700 px-6 py-12 shadow-panel-hover sm:px-12 sm:py-14">
          <div aria-hidden="true" className="grid-lines pointer-events-none absolute inset-0 opacity-[0.14]" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-400/25 blur-3xl"
          />

          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white ring-1 ring-inset ring-white/20">
              <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t('landing.nav.rewards')}
            </p>

            <h2 className="mt-5 max-w-2xl text-balance font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              {t('landing.stats.sub')}
            </h2>

            <dl className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-white/20">
              {STATS.map(([value, key], i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: i * 0.07, ease: EASE }}
                  className="lg:px-8 lg:first:pl-0 lg:last:pr-0"
                >
                  <dd className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">{value}</dd>
                  <dt className="mt-2 text-xs font-semibold text-white/75">{t(key)}</dt>
                </motion.div>
              ))}
            </dl>

            {/* ── Streak & points mechanics ─────────────────────────── */}
            <p className="mt-12 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
              {t('landing.rewards.mechTitle')}
            </p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              {MECHANICS.map(({ icon: Icon, key }, i) => (
                <motion.li
                  key={key}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }}
                  className="flex items-center gap-2.5 rounded-2xl bg-white/10 px-3.5 py-3 ring-1 ring-inset ring-white/15"
                >
                  <Icon className="h-4 w-4 shrink-0 text-violet-200" aria-hidden="true" />
                  <span className="text-xs font-semibold text-white/90">{t(key)}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export { ImpactBand as StatsStrip };
