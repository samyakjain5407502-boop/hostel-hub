'use client';

import { useLang, type TKey } from '@/i18n';

const STATS: [string, TKey][] = [
  ['−38%', 'landing.stats.l1'],
  ['+1.2k', 'landing.stats.l2'],
  ['98%', 'landing.stats.l3'],
  ['3', 'landing.stats.l4']
];

export function StatsStrip() {
  const { t } = useLang();
  return (
    <section id="rewards" className="mx-auto max-w-6xl px-5 py-16">
      <div className="rounded-3xl bg-gradient-to-r from-brand-600 via-violet-600 to-purple-700 p-8 text-center text-white shadow-soft md:p-12">
        <p className="text-sm font-medium opacity-90">{t('landing.stats.sub')}</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map(([value, labelKey]) => (
            <div key={labelKey}>
              <p className="text-3xl font-black">{value}</p>
              <p className="mt-1 text-xs opacity-80">{t(labelKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}