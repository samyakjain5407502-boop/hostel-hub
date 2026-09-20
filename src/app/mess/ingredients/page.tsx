'use client';

import { motion } from 'framer-motion';
import { Calculator, Coins, Leaf, Printer, Users } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { StatTile } from '@/components/portal/stat';
import { useDb } from '@/lib/store';
import { useLang, type TKey } from '@/i18n';
import { cn } from '@/lib/utils';
import { scaleIngredients, projectedSaving } from '@/lib/data/ingredients';
import type { MessSlot } from '@/types';

const SLOTS: MessSlot[] = ['breakfast', 'lunch', 'snacks', 'dinner'];
const SLOT_KEY: Record<MessSlot, TKey> = {
  breakfast: 'ing.breakfast',
  lunch: 'ing.lunch',
  snacks: 'ing.snacks',
  dinner: 'ing.dinner'
};

const GROUP_TONE: Record<string, string> = {
  grain: 'bg-amber-50 text-amber-700',
  protein: 'bg-rose-50 text-rose-700',
  produce: 'bg-success-50 text-success-700',
  dairy: 'bg-sky-50 text-sky-700',
  other: 'bg-slate-100 text-slate-700'
};

/**
 * Ingredient calculator — the kitchen's shopping sheet. Pick a slot, the
 * live opted-in headcount from the store drives every quantity, so the
 * batch is cooked to demand instead of to a fixed 500-cover guess.
 */
export default function IngredientsPage() {
  const db = useDb();
  const { t, n } = useLang();
  const [slot, setSlot] = React.useState<MessSlot>('lunch');
  const [headsOverride, setHeadsOverride] = React.useState<number | null>(null);

  const today = db.week[0];
  const meal = today.meals.find((m) => m.slot === slot) ?? today.meals[0];
  const heads = headsOverride ?? meal.participating;

  const rows = React.useMemo(() => scaleIngredients(slot, heads), [slot, heads]);
  const saving = projectedSaving(slot, heads);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{t('mess.ingredientsTitle')}</h1>
          <p className="mt-1 text-slate-600">{t('ing.sub')}</p>
        </div>
        <Button variant="ghost" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden="true" /> {t('ing.print')}
        </Button>
      </motion.div>

      <div className="mt-6 flex flex-wrap gap-2">
        {SLOTS.map((s) => {
          const active = s === slot;
          const count = (today.meals.find((m) => m.slot === s) ?? today.meals[0]).participating;
          return (
            <button
              key={s}
              onClick={() => { setSlot(s); setHeadsOverride(null); }}
              className={cn(
                'rounded-xl border px-4 py-2.5 text-sm font-bold transition active:scale-95',
                active ? 'border-brand-500 bg-brand-600 text-white shadow-soft' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-700'
              )}
            >
              {t(SLOT_KEY[s])} · {count}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Users className="h-4 w-4" />} label={t('ing.heads')} value={n(heads)} sub={t('ing.liveCount')} tone="brand" />
        <StatTile icon={<Calculator className="h-4 w-4" />} label={t('ing.total')} value={`₹${n(totalCost)}`} sub={t('ing.est')} tone="violet" />
        <StatTile icon={<Coins className="h-4 w-4" />} label={t('ing.saving')} value={`₹${n(saving.rupees)}`} sub={t('ing.savingSub')} tone="success" />
        <StatTile icon={<Leaf className="h-4 w-4" />} label={t('ing.kgSaved')} value={`${saving.kg} kg`} sub={`${saving.skipped} ${t('ing.skipped')}`} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <CardHeader icon={<Calculator className="h-5 w-5" />} title={t(SLOT_KEY[slot])} sub={meal.label} action={<Badge tone="brand" dot>{t('ing.liveCount')}</Badge>} />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-3">{t('ing.ingredient')}</th>
                  <th className="pb-2 pr-3 text-right">{t('ing.perHead')}</th>
                  <th className="pb-2 pr-3 text-right">{t('ing.qty')}</th>
                  <th className="pb-2 text-right">{t('ing.est')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.name} className="transition hover:bg-slate-50">
                    <td className="py-2.5 pr-3">
                      <span className={cn('mr-2 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase', GROUP_TONE[r.group])}>{r.group}</span>
                      <span className="font-semibold text-slate-800">{r.name}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-xs text-slate-500">{r.perHead} {r.unit}</td>
                    <td className="py-2.5 pr-3 text-right font-mono font-bold text-slate-900">{n(r.total)} {r.unit}</td>
                    <td className="py-2.5 text-right font-mono text-xs text-slate-600">₹{n(r.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <CardHeader icon={<Users className="h-5 w-5" />} title={t('ing.heads')} sub={t('ing.headsHint')} />
          <div className="mt-5 flex items-center justify-center gap-5">
            <button
              onClick={() => setHeadsOverride(Math.max(0, heads - 10))}
              className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-xl font-black text-slate-700 transition hover:border-brand-300 hover:text-brand-600 active:scale-90"
              aria-label="-10"
            >
              −
            </button>
            <div className="text-center">
              <p className="text-5xl font-black tracking-tight text-slate-900">{n(heads)}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t('ing.liveCount')}</p>
            </div>
            <button
              onClick={() => setHeadsOverride(heads + 10)}
              className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-xl font-black text-slate-700 transition hover:border-brand-300 hover:text-brand-600 active:scale-90"
              aria-label="+10"
            >
              +
            </button>
          </div>
          <div className="mt-6 rounded-2xl border border-success-200 bg-success-50 p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-success-800">
              <Leaf className="h-4 w-4" aria-hidden="true" /> {t('ing.saving')}
            </p>
            <p className="mt-1 text-3xl font-black text-success-700">₹{n(saving.rupees)}</p>
            <p className="text-[11px] text-success-700">{t('ing.savingSub')} · {saving.kg} kg {t('ing.foodKg')}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
