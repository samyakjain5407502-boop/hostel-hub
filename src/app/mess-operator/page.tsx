'use client';

import { motion } from 'framer-motion';
import { ChefHat, ScanLine, UtensilsCrossed } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogBody } from '@/components/ui/dialog';
import { useDb } from '@/lib/store';
import { useToast } from '@/components/ui/toast';
import { TODAY_KEY, MEAL_SLOT_META } from '@/lib/data/seed-meals';
import { useOperatorState } from '@/lib/operator-state';
import { cn } from '@/lib/utils';
import type { Meal } from '@/types';

export default function MessOperatorPage() {
  const db = useDb();
  const toast = useToast();
  const operator = useOperatorState();
  const today = db.week.find((d) => d.date === TODAY_KEY) ?? db.week[0];

  const [scanOpen, setScanOpen] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [scanResult, setScanResult] = React.useState<'verified' | 'invalid' | 'reuse' | null>(null);
  const [menuMealId, setMenuMealId] = React.useState('');

  const activeMeal = today?.meals.find((m) => m.status === 'active') ?? today?.meals[0];
  const memoMeal = React.useMemo(
    () => today?.meals.find((m) => m.id === menuMealId) ?? activeMeal,
    [today?.meals, menuMealId, activeMeal]
  );

  function verify() {
    if (!code.trim()) return;
    const r = operator.scanPlate(code);
    setScanResult(r);
    const display = code.trim().toUpperCase();
    if (r === 'verified') toast.push({ title: 'Plate ' + display + ' verified', body: 'Serve the thali', tone: 'success' });
    else if (r === 'reuse') toast.push({ title: 'Already scanned today', tone: 'warning' });
    else toast.push({ title: 'Invalid plate code', tone: 'warning' });
    setCode('');
  }

  function toggleStock(meal: Meal, item: string) {
    const m = meal.menuMeta?.[item];
    db.updateMenuItem(meal.id, item, { available: !(m?.available ?? true) });
  }

  function renameItem(meal: Meal, item: string, name: string) {
    if (name.trim() && name.trim() !== item) db.updateMenuItem(meal.id, item, { name: name.trim() });
  }

  function setPrice(meal: Meal, item: string, price: number) {
    db.updateMenuItem(meal.id, item, { price });
  }

  if (!today || !activeMeal || !memoMeal) return null;
  const todayDate = today.date === TODAY_KEY ? 'Live Service' : today.date;

  return (
    <div className="w-full max-w-full">

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <CardHeader
          title="Mess Counter"
          sub={`Today - ${todayDate}`}
          icon={<ChefHat className="h-5 w-5 text-emerald-400" aria-hidden="true" />}
          action={<Button variant="outline" size="sm" onClick={() => setScanOpen(true)}><ScanLine className="mr-1.5 h-4 w-4" aria-hidden="true" /> Scan Pass</Button>}
        />
      </motion.div>

      {/* ── Giant headcount ─────────────────────────────────────────── */}
      <Card className="mt-6 w-full max-w-full px-5 py-8" glass={false}>
        <p className="mb-1 text-center text-xs font-black uppercase tracking-wider text-fg-muted">Today's Dining Headcount</p>
        <p className="mx-auto mb-6 max-w-sm text-center text-sm text-fg-muted">Breakfast, Lunch, Snacks, Dinner</p>
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {today.meals.map((meal) => {
            const meta = MEAL_SLOT_META[meal.slot];
            return (
              <div
                key={meal.id}
                className="flex min-w-0 flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-soft sm:p-4"
              >
                <span className="text-2xl sm:text-3xl" aria-hidden="true">{meta.emoji}</span>
                <span className="break-anywhere text-xs font-bold uppercase tracking-wide text-fg-muted sm:text-sm">{meal.label}</span>
                <span className="text-4xl font-black tabular-nums text-emerald-400 sm:text-6xl">{meal.participating}</span>
                <span className="text-[11px] font-medium text-fg-muted sm:text-xs">eating today</span>
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex w-full max-w-full flex-col items-center gap-4">
          <div className="relative flex h-24 w-full max-w-xs items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 text-center shadow-soft sm:px-6">
            <ScanLine
              className="absolute inset-y-0 left-0 h-full w-1 animate-scan text-emerald-400"
              aria-hidden="true"
            />
            <span className="tabular-nums text-5xl font-black text-white sm:text-7xl">{operator.verifiedCount}</span>
            <span className="ml-3 text-xs font-bold uppercase tracking-wide text-emerald-400 sm:text-sm">Verified</span>
          </div>
          <Button
            size="lg"
            className="h-14 w-full max-w-xs text-base font-extrabold tracking-wide sm:text-xl"
            onClick={() => setScanOpen(true)}
          >
            <ScanLine className="mr-2 h-5 w-5 shrink-0 sm:h-6 sm:w-6" aria-hidden="true" /> Scan QR Code Pass
          </Button>
        </div>
      </Card>

      {/* ── Edit Today's Menu ─────────────────────────────────────── */}

      <Card className="mt-6 w-full max-w-full">
        <CardHeader
          title="Edit Today's Menu"
          sub="Live for every student - changes appear instantly"
          icon={<UtensilsCrossed className="h-5 w-5 text-brand-400" aria-hidden="true" />}
          action={
            <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
              <select
                value={menuMealId}
                onChange={(e) => setMenuMealId(e.target.value)}
                aria-label="Meal slot"
                className="h-10 w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-sm font-semibold text-white shadow-soft focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 sm:w-44"
              >
                {today.meals.map((m) => (
                  <option key={m.id} value={m.id}>{MEAL_SLOT_META[m.slot].emoji} {m.label}</option>
                ))}
              </select>
            </div>
          }
        />
        {memoMeal && (
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {memoMeal.items.map((item: string) => {
              const meta = memoMeal.menuMeta?.[item];
              const price = meta?.price ?? 0;
              const available = meta?.available ?? true;
              return (
                <li
                  key={item}
                  className={cn('flex flex-col gap-2 rounded-2xl border p-4 transition', available ? 'border-white/10 bg-white/[0.03]' : 'border-rose-500/30 bg-rose-500/5')}
                >
                  <span className={cn('grid h-12 w-12 place-items-center rounded-xl text-lg font-black', available ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400')} aria-hidden="true">
                    {available ? 'OK' : 'OUT'}
                  </span>
                  <input
                    defaultValue={item}
                    onBlur={(e) => renameItem(memoMeal, item, e.target.value)}
                    aria-label={`Rename ${item}`}
                    className={cn('w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-lg font-bold text-white outline-none transition', !available && 'line-through')}
                  />
                  <label className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-xs font-bold uppercase text-fg-muted">Extra price in Rupees</span>
                    <input
                      type="number"
                      min={0}
                      defaultValue={price}
                      onChange={(e) => setPrice(memoMeal, item, Number(e.target.value))}
                      aria-label={`Extra price for ${item}`}
                      className="w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-lg font-bold text-white outline-none transition"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleStock(memoMeal, item)}
                    className={cn('h-12 rounded-xl px-4 text-sm font-black uppercase tracking-wide transition active:scale-95', available ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-rose-500 text-white hover:bg-rose-600')}
                  >
                    {available ? 'Available' : 'Out of Stock'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <ScanDialog
        open={scanOpen}
        onClose={() => { setScanOpen(false); setCode(''); setScanResult(null); }}
        onVerify={verify}
        value={code}
        onChange={setCode}
        result={scanResult}
      />
    </div>
  );
}

function ScanDialog({
  open,
  onClose,
  onVerify,
  value,
  onChange,
  result,
}: {
  open: boolean;
  onClose: () => void;
  onVerify: () => void;
  value: string;
  onChange: (v: string) => void;
  result: 'verified' | 'invalid' | 'reuse' | null;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent maxW="max-w-md">
        <DialogHeader
          title="Scan a Plate Pass"
          desc="Ask the student to show their QR pass, or type the plate code below."
          icon={<ScanLine className="h-5 w-5" aria-hidden="true" />}
        />
        <DialogBody>
          <div className="relative w-full max-w-full overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center shadow-soft sm:p-8">
            <ScanLine className="absolute left-0 top-0 h-full w-1 animate-scan text-emerald-500" aria-hidden="true" />
            {result === null && (
              <ChefHat className="mx-auto h-10 w-10 text-emerald-500" aria-hidden="true" />
            )}
            <p className="mt-4 text-center text-sm font-medium text-slate-500">
              {result === 'verified'
                ? 'Plate verified - serve the thali'
                : result === 'reuse'
                  ? 'Already scanned today'
                  : result === 'invalid'
                    ? 'Invalid plate code'
                    : 'Type a plate code or scan a QR pass'}
            </p>
            <input
              autoFocus
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                if (result !== null) onVerify();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onVerify();
              }}
              placeholder="HH-0000"
              className="w-full max-w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-2xl font-black uppercase tracking-widest text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            />
            {result !== null && (
              <div className="mt-3 flex justify-center gap-3">
                <Button size="sm" variant="outline" onClick={() => onChange('')}>
                  Clear
                </Button>
                <Button size="sm" onClick={() => onVerify()}>
                  Verify Again
                </Button>
              </div>
            )}
            {result === null && (
              <Button size="lg" className="mt-2 w-full" onClick={onVerify}>
                Verify Plate
              </Button>
            )}
          </div>
          <p className="mt-3 text-center text-xs font-bold uppercase text-slate-400">
            Quick demo codes (click to fill)
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['HH-8241', 'HH-5310', 'HH-9077', 'HH-1264'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange(c)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-mono text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                {c}
              </button>
            ))}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

