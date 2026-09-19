'use client';

import { motion } from 'framer-motion';
import { UtensilsCrossed, Gift, LifeBuoy, Star } from 'lucide-react';
import { useLang, type TKey } from '@/i18n';

const FEATURES: { icon: typeof Gift; title: TKey; desc: TKey }[] = [
  { icon: UtensilsCrossed, title: 'landing.features.f1t', desc: 'landing.features.f1d' },
  { icon: Gift, title: 'landing.features.f2t', desc: 'landing.features.f2d' },
  { icon: LifeBuoy, title: 'landing.features.f3t', desc: 'landing.features.f3d' },
  { icon: Star, title: 'landing.features.f4t', desc: 'landing.features.f4d' }
];

export function Features() {
  const { t } = useLang();
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-16">
      <h2 className="text-center text-2xl font-extrabold text-slate-900">{t('landing.features.title')}</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lift"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-base font-bold text-slate-800">{t(f.title)}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{t(f.desc)}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}