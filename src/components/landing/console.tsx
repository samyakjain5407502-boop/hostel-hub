'use client';

import { motion } from 'framer-motion';
import { Gift, Lock, TrendingUp, UtensilsCrossed, Wrench } from 'lucide-react';
import { useLang } from '@/i18n';
import { cn } from '@/lib/utils';

/** Opt-in shape for the mini headcount chart (%). The tallest bar is "now". */
const BARS = [46, 58, 52, 74, 66, 88, 96];
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Hero product panel — the live mess counter rendered as an actual console:
 * window chrome, headcount headline, opt-in split, per-slot bars, reward queue.
 * Decorative by design (`aria-hidden`): every fact it shows already exists as
 * translatable copy in the hero column, so nothing is announced twice.
 */
export function LiveConsole() {
  return (
    <div className="relative">
      {/* Brand light behind the panel — this is what makes it float, not sit. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-6 -bottom-10 -top-6 -z-10 rounded-[3rem] bg-gradient-to-br from-brand-500/25 via-violet-500/15 to-transparent blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.18, ease: EASE }}
        aria-hidden="true"
        className="sheen relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-panel"
      >
        <Chrome />
        <Body />
      </motion.div>
    </div>
  );
}

/** Browser chrome: traffic lights, address pill and the integrated live chip. */
function Chrome() {
  const { t } = useLang();

  return (
    <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3.5 py-2.5 sm:px-4">
      <span className="flex shrink-0 items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-success-400" />
      </span>

      <span className="mx-auto hidden min-w-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold text-slate-600 sm:inline-flex">
        <Lock className="h-3 w-3 shrink-0 text-success-500" />
        <span className="truncate">hostelhub.app/mess/live</span>
      </span>

      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-success-700">
        <span className="live-halo h-1.5 w-1.5 rounded-full bg-current" />
        {t('common.live')}
      </span>
    </div>
  );
}

function Body() {
  const { t } = useLang();

  return (
    <div className="space-y-3 p-4 sm:p-5">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
            {t('mess.headcount')}
          </p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="font-display text-3xl font-black leading-none tracking-tight text-slate-900">402</span>
            <span className="text-xs font-semibold text-slate-600">{t('common.eating')}</span>
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">
          <TrendingUp className="h-3 w-3" />
          87%
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <motion.span
          className="block h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
          initial={{ width: 0 }}
          animate={{ width: '87%' }}
          transition={{ duration: 1, delay: 0.5, ease: EASE }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Kpi label={t('mess.optedIn')} value="402" tone="brand" />
        <Kpi label={t('mess.optedOutCount')} value="58" tone="amber" />
        <Kpi label={t('landing.mock.waste')} value="2.1 kg" tone="success" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
            {t('mess.headcountSub')}
          </p>
          <span className="shrink-0 rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-bold text-success-700">
            {t('landing.preview.optin')}
          </span>
        </div>
        <div className="mt-3 flex h-16 items-end gap-1.5">
          {BARS.map((h, i) => (
            <motion.span
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.6, delay: 0.62 + i * 0.05, ease: EASE }}
              className={cn(
                'flex-1 rounded-t-md',
                i === BARS.length - 1
                  ? 'bg-gradient-to-t from-violet-600 to-brand-400'
                  : 'bg-gradient-to-t from-brand-500/35 to-brand-500/80'
              )}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <QueueRow icon={Gift} label={t('landing.preview.gift')} tone="violet" />
        <QueueRow icon={Wrench} label={t('landing.preview.fixed')} tone="success" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2.5">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-bold text-slate-700">
          <UtensilsCrossed className="h-3.5 w-3.5 shrink-0 text-brand-600" />
          <span className="truncate">
            {t('landing.preview.slot')} · {t('landing.preview.dish')}
          </span>
        </span>
        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-violet-700">
          {t('landing.preview.rank')}
        </span>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: 'brand' | 'amber' | 'success' }) {
  const TONES = {
    brand: 'bg-brand-50 text-brand-700',
    amber: 'bg-amber-50 text-amber-700',
    success: 'bg-success-50 text-success-700'
  }[tone];

  return (
    <div className={cn('min-w-0 rounded-2xl px-2.5 py-2', TONES)}>
      <p className="truncate font-display text-sm font-black tracking-tight">{value}</p>
      <p className="truncate text-[10px] font-semibold opacity-80">{label}</p>
    </div>
  );
}

function QueueRow({ icon: Icon, label, tone }: { icon: typeof Gift; label: string; tone: 'violet' | 'success' }) {
  return (
    <span className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2.5 py-2">
      <span
        className={cn(
          'grid h-6 w-6 shrink-0 place-items-center rounded-lg',
          tone === 'violet' ? 'bg-violet-50 text-violet-600' : 'bg-success-50 text-success-600'
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="truncate text-[11px] font-semibold text-slate-600">{label}</span>
    </span>
  );
}
