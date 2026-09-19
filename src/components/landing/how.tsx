'use client';

import { ShieldCheck, UtensilsCrossed, Gift, TrendingUp } from 'lucide-react';
import { LogoMark } from '@/components/brand';
import { useLang, type TKey } from '@/i18n';

const STEPS: { n: string; icon: typeof Gift; title: TKey; desc: TKey }[] = [
  { n: '01', icon: ShieldCheck, title: 'landing.how.s1t', desc: 'landing.how.s1d' },
  { n: '02', icon: UtensilsCrossed, title: 'landing.how.s2t', desc: 'landing.how.s2d' },
  { n: '03', icon: Gift, title: 'landing.how.s3t', desc: 'landing.how.s3d' },
  { n: '04', icon: TrendingUp, title: 'landing.how.s4t', desc: 'landing.how.s4d' }
];

export function HowItWorks() {
  const { t } = useLang();
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-16">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">{t('landing.how.title')}</h2>
          <p className="mt-2 text-slate-500">{t('landing.how.sub')}</p>
          <ul className="mt-6 space-y-3">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.n} className="flex gap-4 rounded-xl border border-slate-200 bg-white/80 p-4">
                  <span className="text-sm font-black text-brand-600">{s.n}</span>
                  <div>
                    <p className="flex items-center gap-2 font-semibold text-slate-800">
                      <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" /> {t(s.title)}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">{t(s.desc)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <AppPreviewCard />
      </div>
    </section>
  );
}

/** Decorative product mock-up — aria-hidden, so it only needs translated copy. */
function AppPreviewCard() {
  const { t } = useLang();
  return (
    <div aria-hidden="true" className="relative overflow-hidden rounded-3xl border border-brand-200 bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <LogoMark />
        <span className="font-display text-sm font-extrabold">HostelHub</span>
        <span className="ml-auto rounded-full bg-success-100 px-2 py-0.5 text-[11px] font-semibold text-success-700">● Live</span>
      </div>
      <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-slate-400">{t('landing.preview.slot')}</p>
            <p className="text-lg font-bold text-slate-800">{t('landing.preview.dish')}</p>
          </div>
          <span className="rounded-lg bg-success-100 px-3 py-1.5 text-xs font-bold text-success-700">{t('landing.preview.optin')}</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-200">
          <div className="h-2.5 w-[72%] rounded-full bg-gradient-to-r from-brand-500 to-violet-500" />
        </div>
        <p className="text-xs text-slate-500">{t('landing.preview.stats')}</p>
      </div>
      <div className="mt-3 space-y-3">
        {([
          ['🎁', t('landing.preview.gift')],
          ['🛠️', t('landing.preview.fixed')],
          ['🏆', t('landing.preview.rank')]
        ] as const).map(([emoji, label]) => (
          <div key={label} className="grid grid-cols-3 items-center gap-1 rounded-xl border border-slate-200 p-3">
            <span className="text-2xl">{emoji}</span>
            <span className="col-span-2 text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}