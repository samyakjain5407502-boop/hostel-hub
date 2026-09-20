'use client';

/**
 * Mess Operator → Meal Slots & Menu (/mess/menu).
 * ─────────────────────────────────────────────────────────────
 * Daily meal-slot management: pick a slot, flip it Active / Closed, rename
 * dishes, mark items out of stock and price extras. Every edit writes straight
 * into the shared store, so the student plate selector and mess screens update
 * in the same tick.
 */

import { motion } from 'framer-motion';
import { UtensilsCrossed, Power, Check, X, Megaphone } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDb } from '@/lib/store';
import { useToast } from '@/components/ui/toast';
import { useLang, type TKey } from '@/i18n';
import { TODAY_KEY, MEAL_SLOT_META } from '@/lib/data/seed-meals';
import { cn } from '@/lib/utils';
import type { Meal } from '@/types';

export default function MessMenuPage() {
  const db = useDb();
  const toast = useToast();
  const { t } = useLang();
  const today = db.week.find((d) => d.date === TODAY_KEY) ?? db.week[0];
  const [slotId, setSlotId] = React.useState<string>('');

  const meals = today?.meals ?? [];
  const meal = meals.find((m) => m.id === slotId) ?? meals[0];

  if (!today || !meal) return null;

  function toggleStock(target: Meal, item: string) {
    const current = target.menuMeta?.[item]?.available ?? true;
    db.updateMenuItem(target.id, item, { available: !current });
  }

  function renameItem(target: Meal, item: string, name: string) {
    if (name.trim() && name.trim() !== item) db.updateMenuItem(target.id, item, { name: name.trim() });
  }

  function setPrice(target: Meal, item: string, price: number) {
    db.updateMenuItem(target.id, item, { price });
  }

  function toggleStatus(target: Meal) {
    const next: Meal['status'] = target.status === 'active' ? 'closed' : 'active';
    db.setMealStatus(target.id, next);
    toast.push({
      title: next === 'active' ? t('mess.markActive') : t('mess.markClosed'),
      body: next === 'active' ? t('mess.slotActive') : t('mess.slotClosed'),
      tone: next === 'active' ? 'success' : 'info'
    });
  }

  return (
    <div className="w-full max-w-full">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <CardHeader
          title={t('mess.menuTitle')}
          sub={t('mess.menuSub')}
          icon={<UtensilsCrossed className="h-5 w-5" aria-hidden="true" />}
          action={
            <Button
              variant="warden"
              size="sm"
              onClick={() => toast.push({ title: t('mess.menuPublished'), tone: 'success' })}
            >
              <Megaphone className="h-4 w-4" aria-hidden="true" /> Publish menu
            </Button>
          }
        />
      </motion.div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {meals.map((m) => {
          const selected = m.id === meal.id;
          const isOpen = m.status === 'active';
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSlotId(m.id)}
              aria-pressed={selected}
              className={cn(
                'lift flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left',
                selected ? 'glow-brand border-brand-300 bg-brand-50' : 'border-slate-200 bg-white'
              )}
            >
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
                  <span aria-hidden="true">{MEAL_SLOT_META[m.slot].emoji}</span>
                  {t(`meals.slots.${m.slot}` as TKey)}
                </span>
                <span className="mt-0.5 block truncate text-sm font-semibold text-slate-900">{m.label}</span>
              </span>
              <Badge tone={isOpen ? 'success' : 'slate'} dot={isOpen}>
                {t(`meals.status.${m.status}` as TKey)}
              </Badge>
            </button>
          );
        })}
      </div>

      <Card className="mt-5">
        <CardHeader
          title={`${MEAL_SLOT_META[meal.slot].emoji} ${meal.label}`}
          sub={`${MEAL_SLOT_META[meal.slot].time} · ${meal.participating} ${t('mess.optedIn').toLowerCase()}`}
          icon={<UtensilsCrossed className="h-5 w-5" aria-hidden="true" />}
          action={
            <Button variant={meal.status === 'active' ? 'outline' : 'success'} size="sm" onClick={() => toggleStatus(meal)}>
              <Power className="h-3.5 w-3.5" aria-hidden="true" />
              {meal.status === 'active' ? t('mess.markClosed') : t('mess.markActive')}
            </Button>
          }
        />

        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {meal.items.map((item) => {
            const meta = meal.menuMeta?.[item];
            const available = meta?.available ?? true;
            const price = meta?.price ?? 0;
            return (
              <li
                key={item}
                className={cn(
                  'flex flex-col gap-2.5 rounded-2xl border p-3.5',
                  available ? 'border-slate-200 bg-white' : 'border-rose-200 bg-rose-50/70'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={available ? 'success' : 'rose'} dot>
                    {available ? t('mess.inStock') : t('mess.outOfStock')}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => toggleStock(meal, item)}
                    className={cn(
                      'pop-on-press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition',
                      available
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        : 'bg-success-100 text-success-700 hover:bg-success-200'
                    )}
                  >
                    {available ? <X className="h-3 w-3" aria-hidden="true" /> : <Check className="h-3 w-3" aria-hidden="true" />}
                    {available ? t('mess.outOfStock') : t('mess.inStock')}
                  </button>
                </div>

                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{t('mess.menuItem')}</span>
                  <input
                    defaultValue={item}
                    onBlur={(e) => renameItem(meal, item, e.target.value)}
                    aria-label={`Rename ${item}`}
                    className={cn(
                      'mt-1 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
                      !available && 'line-through'
                    )}
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{t('mess.menuPrice')}</span>
                  <input
                    type="number"
                    min={0}
                    defaultValue={price}
                    onChange={(e) => setPrice(meal, item, Number(e.target.value))}
                    aria-label={`Extra price for ${item}`}
                    className="mt-1 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </label>
              </li>
            );
          })}
        </ul>
      </Card>

    </div>
  );
}
