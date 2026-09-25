'use client';

import { Clock3, Utensils, Sparkles } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDb } from '@/lib/store';
import { useLang, TKey } from '@/i18n';
import { useToast } from '@/components/ui/toast';
import type { Meal } from '@/types';
import { MEAL_SLOT_META } from '@/lib/data/seed-meals';

const STATUS_TONE: Record<Meal['status'], 'success' | 'amber' | 'sky' | 'white'> = {
  active: 'success',
  closed: 'amber',
  upcoming: 'sky',
  done: 'white'
};

export function MealCard({ meal, interactive = true }: { meal: Meal; interactive?: boolean }) {
  const db = useDb();
  const toast = useToast();
  const { t } = useLang();

  /**
   * Toggling here is what drives the operator console: `db.optMeal()` commits the
   * new headcount *and* broadcasts it over the live-sync bus (Phase 4), so the
   * counter pulses and re-costs the kitchen in another tab. The toast repeats
   * the same facts back to the student.
   */
  function toggle(choice: 'optin' | 'optout') {
    const txn = db.optMeal(meal.id, choice);
    if (choice === 'optout') {
      toast.push({
        title: t('meals.optOutDone'),
        body: `+${txn?.points ?? 18} ${t('common.points')} · ${t('live.autoAdjusted')}`,
        tone: 'success'
      });
    } else {
      toast.push({ title: t('meals.optInDone'), body: t('live.headcountSynced'), tone: 'info' });
    }
  }

  const eating = meal.participating;
  const total = meal.participating + meal.optedOut;
  const optingOut = meal.userOpt === 'optout';
  const optedIn = meal.userOpt === 'optin';
  const canOpt = interactive && (meal.status === 'active' || meal.status === 'upcoming');

  return (
    <article className="w-full max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-lift">
      <div className="flex items-center justify-between gap-2">
        <span className="text-3xl" aria-hidden="true">{MEAL_SLOT_META[meal.slot].emoji}</span>
        <Badge tone={STATUS_TONE[meal.status]} dot>{t(`meals.status.${meal.status}` as TKey)}</Badge>
      </div>

      <h3 className="mt-2 break-anywhere text-base font-bold text-slate-900">{meal.label}</h3>
      <p className="flex min-w-0 items-center gap-1 text-xs text-slate-500">
        <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> <span className="min-w-0 truncate">{meal.time} · {t(`meals.slots.${meal.slot}` as TKey)}</span>
      </p>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {meal.items.map((item) => {
          const meta = meal.menuMeta?.[item];
          const out = meta?.available === false;
          const price = meta?.price ?? 0;
          return (
            <span
              key={item}
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-medium',
                out ? 'bg-rose-50 text-rose-600 line-through' : 'bg-slate-100 text-slate-600'
              )}
            >
              {item}
              {!out && price > 0 && <span className="ml-1 font-semibold text-brand-600">+₹{price}</span>}
              {out && <span className="ml-1 font-semibold">Out of stock</span>}
            </span>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className={cn('h-2 rounded-full', optedIn || optingOut ? 'bg-success-400' : 'bg-brand-500')} style={{ width: `${total ? (eating / total) * 100 : 0}%` }} />
        </div>
        <span className="shrink-0 text-[11px] font-medium text-slate-500">{eating} eating</span>
      </div>
      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
        <Utensils className="h-3.5 w-3.5" aria-hidden="true" /> {meal.credits} {t('meals.credits').toLowerCase()} · {total - eating} saved
      </p>

      {canOpt && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => toggle('optin')}
            className={cn(
              'rounded-xl border px-0 py-2 text-xs font-semibold transition',
              optedIn ? 'border-success-300 bg-success-100 text-success-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            )}
            aria-pressed={optedIn}
          >
            ✓ {t('meals.optIn')}
          </button>
          <button
            onClick={() => toggle('optout')}
            className={cn(
              'rounded-xl border px-0 py-2 text-xs font-semibold transition',
              optingOut ? 'border-amber-300 bg-amber-100 text-amber-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-amber-50'
            )}
            aria-pressed={optingOut}
          >
            {t('meals.optOut')} <Sparkles className="ml-0.5 inline h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      )}
    </article>
  );
}