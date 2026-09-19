'use client';

/**
 * Mess Operator Console (3-portal architecture → /mess-operator).
 * ----------------------------------------------------------------
 *  1. Live daily headcount per slot (Breakfast / Lunch / Snacks / Dinner)
 *     derived from today's opt-in vs opt-out data.
 *  2. Meal item availability toggle — items the counter cannot serve are
 *    switched off so students see live availability.
 *  3. Plate scan/verify — counter codes are checked against the issued
 *     list; reused or invalid codes are flagged in the scan journal.
 */

import { motion } from 'framer-motion';
import { ChefHat, CheckCircle2, QrCode, ScanLine, Users, UtensilsCrossed, XCircle, Clock3 } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { StatTile } from '@/components/portal/stat';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useDb } from '@/lib/store';
import { useToast } from '@/components/ui/toast';
import { TODAY_KEY, MEAL_SLOT_META } from '@/lib/data/seed-meals';
import { useOperatorState } from '@/lib/operator-state';
import { cn } from '@/lib/utils';
import { inputBase } from '@/components/ui/field';

export default function MessOperatorPage() {
  const db = useDb();
  const toast = useToast();
  const operator = useOperatorState();
  const today = db.week.find((d) => d.date === TODAY_KEY) ?? db.week[0];

  const [mealId, setMealId] = React.useState('');
  const [code, setCode] = React.useState('');
  const [scanResult, setScanResult] = React.useState<'verified' | 'invalid' | 'reuse' | null>(null);

  const meal = today?.meals.find((m) => m.id === mealId) ?? today?.meals[1] ?? today?.meals[0];

  function verify() {
    if (!code.trim()) return;
    const result = operator.scanPlate(code);
    setScanResult(result);
    if (result === 'verified') toast.push({ title: `Plate ${code.trim().toUpperCase()} verified`, tone: 'success' });
    else if (result === 'reuse') toast.push({ title: 'Plate already scanned', body: `${code.trim().toUpperCase()} was served earlier.`, tone: 'warning' });
    else toast.push({ title: 'Invalid plate code', body: `${code.trim().toUpperCase()} is not an issued plate.`, tone: 'warning' });
    setCode('');
  }

  if (!meal) return null;

  const activeSlot = today.meals.find((m) => m.status === 'active') ?? today.meals[0];
  const eatingNow = activeSlot.participating - activeSlot.optedOut;
  const offItems = today.meals.reduce(
    (acc, m) => acc + m.items.filter((item) => !operator.isAvailable(m.id, item)).length,
    0
  );

  return (
    <div className="w-full max-w-full">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
          <ChefHat className="h-7 w-7 text-emerald-600" aria-hidden="true" /> Operator Console
        </h1>
        <p className="mt-1 text-slate-500">Live counter view — headcount, service availability and plate verification for today.</p>
      </motion.div>

      {/* Live stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Users className="h-4 w-4" />} label="Eating now" value={eatingNow} sub={activeSlot.label} tone="success" />
        <StatTile icon={<ScanLine className="h-4 w-4" />} label="Plates verified" value={operator.verifiedCount} sub="this counter" tone="sky" />
        <StatTile icon={<UtensilsCrossed className="h-4 w-4" />} label="Items off menu" value={offItems} sub="live availability" tone="amber" />
        <StatTile icon={<QrCode className="h-4 w-4" />} label="Scans logged" value={operator.scans.length} sub="journal entries" tone="rose" />
      </div>

      {/* Per-slot live headcount */}
      <Card className="mt-6 w-full max-w-full p-5">
        <CardHeader title="Live daily headcount" sub="Opt-in vs opt-out, per slot" icon={<Users className="h-5 w-5" />} />
        <div className="mt-4 space-y-4">
          {today.meals.map((m) => {
            const eating = m.participating - m.optedOut;
            const total = m.participating;
            return (
              <div key={m.id} className="w-full max-w-full">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm" aria-hidden="true">
                    {MEAL_SLOT_META[m.slot].emoji}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
                    {m.slot.charAt(0).toUpperCase() + m.slot.slice(1)}
                    <span className="ml-2 text-[11px] font-normal text-slate-400">{MEAL_SLOT_META[m.slot].time}</span>
                  </span>
                  <span className="shrink-0 text-[11px] font-semibold text-slate-500">
                    {eating} eating · {m.optedOut} out
                  </span>
                </div>
                <div className="mt-1.5">
                  <Progress value={eating} max={total} tone="success" label="Eating" size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-6 grid w-full max-w-full gap-6 lg:grid-cols-2">
        {/* Meal item availability */}
        <Card className="w-full max-w-full p-5">
          <CardHeader title="Meal item availability" sub="Switch off anything the counter can't serve" icon={<UtensilsCrossed className="h-5 w-5" />} />

          <div className="mt-3 flex w-full max-w-full flex-wrap gap-2">
            {today.meals.map((m) => (
              <button
                key={m.id}
                onClick={() => setMealId(m.id)}
                aria-pressed={m.id === meal.id}
                className={cn(
                  'shrink-0 rounded-xl border px-3 py-1.5 text-xs font-semibold transition',
                  m.id === meal.id ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                )}
              >
                {MEAL_SLOT_META[m.slot].emoji} {m.slot.charAt(0).toUpperCase() + m.slot.slice(1)}
              </button>
            ))}
          </div>

          <ul className="mt-3 w-full max-w-full space-y-1.5">
            {meal.items.map((item) => {
              const on = operator.isAvailable(meal.id, item);
              return (
                <li key={item} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => operator.toggleItem(meal.id, item)}
                    aria-pressed={on}
                    className={cn(
                      'flex w-full max-w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition',
                      on ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100' : 'border-rose-200 bg-rose-50 text-rose-700'
                    )}
                  >
                    <span className="min-w-0 truncate">{item}</span>
                    <span
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition',
                        on ? 'bg-emerald-500' : 'bg-slate-300'
                      )}
                      aria-hidden="true"
                    >
                      <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition', on ? 'translate-x-4' : 'translate-x-0.5')} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Plate scan / verify */}
        <Card className="w-full max-w-full p-5">
          <CardHeader title="Plate scan / verify" sub="Enter or scan the counter code on the thali token" icon={<ScanLine className="h-5 w-5" />} />

          <div className="mt-3 flex w-full max-w-full items-center gap-2">
            <input
              className={cn(inputBase, 'min-w-0 flex-1 uppercase')}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); verify(); } }}
              placeholder="e.g. HH-8241"
              aria-label="Plate code"
            />
            <Button variant="primary" onClick={verify} className="shrink-0">
              <ScanLine className="h-4 w-4" aria-hidden="true" /> Verify
            </Button>
          </div>

          {scanResult && (
            <div
              className={cn(
                'mt-3 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold',
                scanResult === 'verified' && 'bg-emerald-50 text-emerald-700',
                scanResult === 'reuse' && 'bg-amber-50 text-amber-700',
                scanResult === 'invalid' && 'bg-rose-50 text-rose-700'
              )}
              role="status"
            >
              {scanResult === 'verified' ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <XCircle className="h-4 w-4" aria-hidden="true" />}
              {scanResult === 'verified' && 'Plate verified — serve the thali.'}
              {scanResult === 'reuse' && 'This plate was already scanned today.'}
              {scanResult === 'invalid' && 'Unknown plate code — check with the student.'}
            </div>
          )}

          {operator.demoCodes.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
              <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Issued codes still pending:
              {operator.demoCodes.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCode(c)}
                  className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-600 hover:bg-slate-200"
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Scan journal</p>
            <ul className="mt-2 w-full max-w-full space-y-1">
              {operator.scans.length === 0 && <li className="py-2 text-sm text-slate-400">No scans yet — verify a plate to start the journal.</li>}
              {operator.scans.map((s, i) => (
                <li key={`${s.code}-${s.at}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs">
                  <span className="font-mono font-semibold text-slate-700">{s.code || '—'}</span>
                  <span className={cn('font-semibold', s.result === 'verified' && 'text-emerald-600', s.result === 'reuse' && 'text-amber-600', s.result === 'invalid' && 'text-rose-600')}>
                    {s.result}
                  </span>
                  <span className="shrink-0 text-slate-400">{new Date(s.at).toLocaleTimeString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
