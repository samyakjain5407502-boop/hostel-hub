'use client';

import { motion } from 'framer-motion';
import { CalendarCheck2, Check, Save, Utensils, X } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useDb } from '@/lib/store';
import { useLang, type TKey } from '@/i18n';
import { useToast } from '@/components/ui/toast';
import { MEAL_SLOT_META, TODAY_KEY } from '@/lib/data/seed-meals';
import { cn } from '@/lib/utils';
import type { Meal } from '@/types';

const FOOD_CHARGE = 2600; // monthly mess charge used for the absence estimate

export default function PlatePage() {
  const db = useDb();
  const toast = useToast();
  const { t } = useLang();

  const today = db.week.find((d) => d.date === TODAY_KEY) ?? db.week[0];
  const [mealId, setMealId] = React.useState<string>(today?.meals[1]?.id ?? today?.meals[0]?.id ?? '');
  const meal = today?.meals.find((m) => m.id === mealId) ?? today?.meals[0];

  const saved = db.plates.find((p) => p.mealId === mealId);
  const [draft, setDraft] = React.useState<string[]>([]);
  const [sweet, setSweet] = React.useState(false);

  // Re-sync the local draft whenever the student switches meal slot.
  React.useEffect(() => {
    setDraft(saved && !saved.skipped ? saved.items : []);
    setSweet(saved?.sweetOptIn ?? false);
  }, [mealId, saved]);

  /* Live menu from the store — the mess operator's "Edit Today's Menu"
     changes (names, stock, extra pricing) show up here in real time. */
  const offered = meal ? meal.items : [];
  const absentDays = saved?.absenceDays ?? [];
  const deduction = db.absenceDeduction(FOOD_CHARGE, absentDays.length);

  function toggleItem(item: string) {
    setDraft((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  }

  function save() {
    db.setPlate(mealId, draft, sweet);
    toast.push({ title: t('plate.saved'), tone: 'success' });
  }

  if (!meal) return null;
  const slotLabel = t(('meals.slots.' + meal.slot) as TKey);
  const statusLabel = t(('meals.status.' + meal.status) as TKey);
  const statusTone = meal.status === 'active' ? 'success' : meal.status === 'upcoming' ? 'sky' : 'amber';

  return (
    <div className="w-full max-w-full">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('plate.title')}</h1>
        <p className="mt-1 text-slate-500">{t('plate.sub')}</p>
      </motion.div>

      {/* Meal slot tabs — wrap instead of scrolling so nothing is cut off on phones */}
      <div className="mt-5 flex w-full max-w-full flex-wrap items-center gap-2">
        {today.meals.map((m) => (
          <button
            key={m.id}
            onClick={() => setMealId(m.id)}
            aria-pressed={m.id === mealId}
            className={cn(
              'shrink-0 rounded-xl border px-3.5 py-2 text-xs font-semibold transition',
              m.id === mealId ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            )}
          >
            {MEAL_SLOT_META[m.slot].emoji} {m.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid w-full max-w-full gap-6 lg:grid-cols-3">
        <Card className="w-full max-w-full lg:col-span-2">
          <CardHeader
            title={t('plate.chooseItems')}
            sub={`${slotLabel} · ${meal.time}`}
            icon={<Utensils className="h-5 w-5" />}
            action={<Badge tone={statusTone} dot>{statusLabel}</Badge>}
          />
          <PlateItems offered={offered} meta={meal?.menuMeta} draft={draft} onToggle={toggleItem} />

          {/* Optional sweet dish — priced add-on */}
          <label className="mt-3 flex w-full max-w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
            <span className="min-w-0 text-sm font-semibold text-amber-900">{t('plate.sweet')}</span>
            <input type="checkbox" checked={sweet} onChange={(e) => setSweet(e.target.checked)} className="h-4 w-4 shrink-0 accent-amber-500" />
          </label>

          {/* Actions go full-width on phones, inline from `sm` up. */}
          <div className="mt-4 flex w-full max-w-full flex-wrap gap-2">
            <Button variant="primary" onClick={save} disabled={!draft.length} className="w-full sm:w-auto">
              <Save className="h-4 w-4" aria-hidden="true" /> {t('plate.save')}
            </Button>
            <Button
              variant="outline"
              onClick={() => { db.setPlate(mealId, [], false); setDraft([]); setSweet(false); toast.push({ title: t('plate.skip'), tone: 'info' }); }}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4" aria-hidden="true" /> {t('plate.skip')}
            </Button>
          </div>
        </Card>

        <AbsencePanel mealId={mealId} absentDays={absentDays} count={absentDays.length} deduction={deduction} />
      </div>
    </div>
  );
}

function PlateItems({ offered, meta, draft, onToggle }: {
  offered: string[]; meta?: Meal['menuMeta']; draft: string[]; onToggle: (item: string) => void;
}) {
  return (
    <ul className="mt-4 grid w-full max-w-full gap-2 sm:grid-cols-2">
      {offered.map((item) => {
        const on = draft.includes(item);
        const out = meta?.[item]?.available === false;
        const price = meta?.[item]?.price ?? 0;
        return (
          <li key={item} className="min-w-0">
            <button
              onClick={() => { if (!out) onToggle(item); }}
              disabled={out}
              aria-pressed={on}
              className={cn(
                'flex w-full max-w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition',
                out
                  ? 'cursor-not-allowed border-rose-200 bg-rose-50/60 text-rose-500'
                  : on
                    ? 'border-success-300 bg-success-50 text-success-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50'
              )}
            >
              <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-md border', on && !out ? 'border-success-500 bg-success-500 text-white' : 'border-slate-300 bg-white')}>
                {on && !out ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
              </span>
              <span className={cn('min-w-0 break-anywhere', out && 'line-through')}>{item}</span>
              <span className="ml-auto shrink-0 text-[11px] font-semibold">
                {out ? (
                  <span className="text-rose-500">Out of stock</span>
                ) : price > 0 ? (
                  <span className="text-brand-600">+₹{price}</span>
                ) : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function AbsencePanel({ mealId, absentDays, count, deduction }: {
  mealId: string; absentDays: string[]; count: number; deduction: number;
}) {
  const db = useDb();
  const { t, n } = useLang();
  return (
    <Card className="w-full max-w-full">
      <CardHeader title={t('plate.absence')} sub={t('plate.absenceSub')} icon={<CalendarCheck2 className="h-5 w-5" />} />
      <ul className="mt-4 space-y-1.5">
        {db.week.map((d) => {
          const on = absentDays.includes(d.date);
          return (
            <li key={d.date}>
              <button
                onClick={() => db.toggleAbsence(mealId, d.date)}
                aria-pressed={on}
                className={cn(
                  'flex w-full max-w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition',
                  on ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                )}
              >
                <span className="min-w-0 truncate">{d.date === TODAY_KEY ? t('common.today') : weekday(d.date)}</span>
                <span className="shrink-0">{d.date.slice(8)}/{d.date.slice(5, 7)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3">
        <p className="text-xs font-semibold text-slate-500">{t('plate.absentDays', { n: count })}</p>
        <p className="mt-1.5 text-lg font-extrabold text-slate-900">₹{n(deduction)}</p>
        <p className="text-[11px] text-slate-400">{t('plate.estDeduction')} · {t('plate.ofFood')}</p>
        <div className="mt-2.5">
          <Progress value={deduction} max={FOOD_CHARGE} tone="success" label={t('plate.estDeduction')} size="sm" />
        </div>
      </div>
    </Card>
  );
}

function weekday(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}
