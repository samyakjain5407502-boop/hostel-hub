'use client';

/**
 * Mess Operator → Counter Console (/mess).
 * ─────────────────────────────────────────────────────────────
 * The one screen a kitchen lead keeps open during service:
 *   • live opted-in headcount for all four slots, updated by students;
 *   • one-tap Active / Closed switch per slot;
 *   • verified-plate counter with a QR scan dialog (confetti on a good scan).
 *
 * Menu editing lives on /mess/menu and ingredient maths on /mess/ingredients
 * so this console stays a pure, glanceable service board.
 */

import { motion } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  ChefHat,
  Clock3,
  ClipboardList,
  Pause,
  Power,
  ScanLine,
  Sparkles,
  UtensilsCrossed,
  Users,
  Zap
} from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogBody } from '@/components/ui/dialog';
import { ProgressRing } from '@/components/gamification/progress-ring';
import { useConfetti } from '@/components/gamification/confetti-burst';
import { useDb } from '@/lib/store';
import { useToast } from '@/components/ui/toast';
import { useLang, type TKey } from '@/i18n';
import { TODAY_KEY, MEAL_SLOT_META } from '@/lib/data/seed-meals';
import { SLOT_INGREDIENTS, UNIT_COST, projectedSaving, roundQty } from '@/lib/data/ingredients';
import { MESS_CAPACITY, useMealActivityFeed } from '@/lib/meal-live';
import { useOperatorState } from '@/lib/operator-state';
import { cn, formatNum, timeAgo } from '@/lib/utils';
import type { Meal } from '@/types';

/** Demo roll strength — the denominator for "how many are we cooking for". */
const RESIDENTS = MESS_CAPACITY;

/** How many diners the rush-hour demo adds per tick, and the ceiling it respects. */
const RUSH_STEP = 6;
const RUSH_CEILING = 140;

/** Ingredients worth calling out on the savings strip (they dominate the bill). */
const SAVING_FOCUS = /rice|dal|vegetable|paneer|flour/i;

export default function MessConsolePage() {
  const db = useDb();
  const toast = useToast();
  const { t } = useLang();
  const operator = useOperatorState();
  const { fire, burst } = useConfetti();
  const { activities, latest } = useMealActivityFeed(6);

  const today = db.week.find((d) => d.date === TODAY_KEY) ?? db.week[0];

  const [scanOpen, setScanOpen] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [scanResult, setScanResult] = React.useState<'verified' | 'invalid' | 'reuse' | null>(null);

  /**
   * Live-sync (Phase 4) presentation state.
   *  • `pulse`      — which way the count just moved, drives the flash animation;
   *  • `simulated`  — per-slot diners added by the rush-hour demo (display-only:
   *                   the shared student data is never mutated);
   *  • `handledRef` — id of the last activity already announced, so React 18
   *                   StrictMode's double effect run can't toast it twice.
   */
  const [pulse, setPulse] = React.useState<'up' | 'down' | null>(null);
  const [rush, setRush] = React.useState(false);
  const [simulated, setSimulated] = React.useState<Record<string, number>>({});
  const handledRef = React.useRef<string | null>(null);

  const meals = today?.meals ?? [];
  const activeSlot = meals.find((m) => m.status === 'active');
  /** The slot the kitchen is serving right now — the one savings are quoted for. */
  const focusMeal = activeSlot ?? meals[0];
  const focusMealId = focusMeal?.id ?? null;

  /** Headcount including whatever the demo simulation has added. */
  const headsFor = React.useCallback(
    (meal: Meal) => meal.participating + (simulated[meal.id] ?? 0),
    [simulated]
  );

  const totalEating = meals.reduce((sum, m) => sum + headsFor(m), 0);
  const totalOut = meals.reduce((sum, m) => sum + m.optedOut, 0);
  const simulatedTotal = Object.values(simulated).reduce((sum, n) => sum + n, 0);

  /**
   * Ingredient estimate for the serving slot, recomputed on every opt-out.
   * `projectedSaving` is the same helper the student dashboard and the operator
   * ingredient calculator use, so every screen quotes identical rupees.
   */
  const focusHeads = focusMeal ? headsFor(focusMeal) : 0;
  const focusSlot = focusMeal?.slot;
  const saving = React.useMemo(
    () => (focusSlot ? projectedSaving(focusSlot, focusHeads, RESIDENTS) : { rupees: 0, kg: 0, skipped: 0 }),
    [focusSlot, focusHeads]
  );

  /** The three ingredients that actually move when a plate is skipped. */
  const savingRows = React.useMemo(
    () =>
      focusSlot
        ? SLOT_INGREDIENTS[focusSlot]
            .filter((row) => SAVING_FOCUS.test(row.name))
            .slice(0, 3)
            .map((row) => {
              const qty = roundQty(row.perHead * saving.skipped, row.unit);
              return { name: row.name, unit: row.unit, qty, cost: Math.round(qty * (UNIT_COST[row.name] ?? 40)) };
            })
        : [],
    [focusSlot, saving.skipped]
  );

  /**
   * Announce the incoming student action, pulse the board, then let it settle.
   * The ref guard keeps this idempotent across StrictMode's double-invoke.
   */
  React.useEffect(() => {
    if (!latest || handledRef.current === latest.id) return;
    handledRef.current = latest.id;
    const skipping = latest.choice === 'optout';
    setPulse(skipping ? 'down' : 'up');
    toast.push({
      title: t('live.studentMarked', {
        id: latest.studentId,
        action: skipping ? t('live.skipped') : t('live.opted')
      }),
      body: `${skipping ? t('live.autoAdjusted') : t('live.headcountSynced')} · ₹${formatNum(latest.savings.rupees)} ${t('live.saved')}`,
      tone: skipping ? 'reward' : 'info'
    });
    const timer = window.setTimeout(() => setPulse(null), 1800);
    return () => window.clearTimeout(timer);
    /* Deps intentionally exclude `t`/`toast`: both are re-created whenever a
       provider re-renders, which would re-fire this effect on its own toast. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest]);

  /** Rush-hour demo: climb the serving slot's headcount every 2 seconds. */
  React.useEffect(() => {
    if (!rush || !focusMealId) return;
    const timer = window.setInterval(() => {
      setSimulated((prev) => ({
        ...prev,
        [focusMealId]: Math.min(RUSH_CEILING, (prev[focusMealId] ?? 0) + RUSH_STEP)
      }));
      setPulse('up');
    }, 2000);
    return () => window.clearInterval(timer);
  }, [rush, focusMealId]);

  function toggleRush() {
    const next = !rush;
    setRush(next);
    if (!next) setPulse(null);
    toast.push({
      title: next ? t('live.rush') : t('live.rushStop'),
      body: next ? t('live.rushOn') : t('live.rushOff'),
      tone: next ? 'success' : 'info'
    });
  }

  function clearSimulation() {
    setRush(false);
    setPulse(null);
    setSimulated({});
  }

  /** Verify a scanned plate code; a good scan earns a confetti pop. */
  function verify() {
    if (!code.trim()) return;
    const result = operator.scanPlate(code);
    setScanResult(result);
    const display = code.trim().toUpperCase();
    if (result === 'verified') {
      toast.push({ title: `${t('mess.platesVerified')} · ${display}`, body: t('mess.serviceNow'), tone: 'success' });
      fire();
    } else if (result === 'reuse') {
      toast.push({ title: 'Already scanned today', tone: 'warning' });
    } else {
      toast.push({ title: 'Invalid plate code', tone: 'warning' });
    }
    setCode('');
  }

  function toggleStatus(meal: Meal) {
    const next: Meal['status'] = meal.status === 'active' ? 'closed' : 'active';
    db.setMealStatus(meal.id, next);
    toast.push({
      title: next === 'active' ? t('mess.markActive') : t('mess.markClosed'),
      body: next === 'active' ? t('mess.slotActive') : t('mess.slotClosed'),
      tone: next === 'active' ? 'success' : 'info'
    });
    if (next === 'active') fire();
  }

  if (!today) return null;

  return (
    <div className="w-full max-w-full">
      {burst}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <CardHeader
          title={t('mess.consoleTitle')}
          sub={t('mess.consoleSub')}
          icon={<ChefHat className="h-5 w-5" aria-hidden="true" />}
          tone="success"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={activeSlot ? 'success' : 'amber'} dot glow>
                {activeSlot ? `${activeSlot.label} · ${t('meals.status.active')}` : t('meals.status.closed')}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setScanOpen(true)}>
                <ScanLine className="h-4 w-4" aria-hidden="true" /> Scan Pass
              </Button>
            </div>
          }
        />
      </motion.div>

      {/* ── Live headcount board ─────────────────────────────────── */}
      <Card className="mt-6 w-full max-w-full px-4 py-6 sm:px-6" padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-success-50 text-success-600">
              <Users className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">{t('mess.headcount')}</h2>
              <p className="text-xs font-medium text-slate-600">{t('mess.headcountSub')}</p>
            </div>
          </div>
          <Badge tone="success" dot glow className="shrink-0">
            {t('game.liveNow')}
          </Badge>
        </div>

        <div className="mt-5 grid w-full grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {meals.map((meal) => {
            const meta = MEAL_SLOT_META[meal.slot];
            const isOpen = meal.status === 'active';
            const heads = headsFor(meal);
            const extra = simulated[meal.id] ?? 0;
            /* Flash the tile whose headcount just moved (student action or demo). */
            const flashing = pulse !== null && latest?.slot === meal.slot;
            return (
              <div
                key={meal.id}
                className={cn(
                  'lift flex min-w-0 flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-all duration-300 sm:p-4',
                  isOpen ? 'glow-success border-success-300 bg-success-50/60' : 'border-slate-200 bg-slate-50',
                  flashing && 'animate-pulse ring-2 ring-success-400',
                  flashing && pulse === 'up' && 'scale-[1.02] ring-success-400',
                  flashing && pulse === 'down' && 'ring-amber-400'
                )}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span className="text-2xl" aria-hidden="true">{meta.emoji}</span>
                  <Badge tone={isOpen ? 'success' : 'slate'} dot={isOpen}>
                    {t(`meals.status.${meal.status}` as TKey)}
                  </Badge>
                </div>
                <span className="break-anywhere text-[11px] font-bold uppercase tracking-wide text-slate-600 sm:text-xs">
                  {meal.label}
                </span>
                <span
                  aria-live="polite"
                  className={cn(
                    'text-4xl font-black tabular-nums transition-transform duration-300 sm:text-5xl',
                    isOpen ? 'text-success-700' : 'text-slate-900',
                    flashing && 'scale-110'
                  )}
                >
                  {heads}
                </span>
                <span className="text-[11px] font-semibold text-slate-600">
                  {t('mess.optedIn')} · {meal.optedOut} {t('mess.optedOutCount').toLowerCase()}
                </span>
                {extra > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    +{extra} {t('live.simulated')}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                  <Clock3 className="h-3 w-3" aria-hidden="true" /> {meta.time}
                </span>
                <Button
                  variant={isOpen ? 'outline' : 'success'}
                  size="sm"
                  className="mt-1 w-full"
                  onClick={() => toggleStatus(meal)}
                  aria-pressed={isOpen}
                >
                  <Power className="h-3.5 w-3.5" aria-hidden="true" />
                  {isOpen ? t('mess.markClosed') : t('mess.markActive')}
                </Button>
              </div>
            );
          })}
        </div>

        {/* ── Live ingredient savings (recomputed on every opt-out) ────── */}
        <div className="mt-5 rounded-2xl border border-success-200 bg-success-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-success-600">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-success-800">{t('live.savings')}</p>
                <p className="break-anywhere text-[11px] font-medium text-success-700">{t('live.savingsSub')}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black tabular-nums text-success-700">₹{formatNum(saving.rupees)}</p>
              <p className="text-[11px] font-semibold text-success-700">
                {saving.kg} kg {t('live.kgFood')} · {focusMeal ? focusMeal.label : ''}
              </p>
            </div>
          </div>

          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {savingRows.map((row) => (
              <li key={row.name} className="rounded-xl border border-success-200 bg-white px-3 py-2">
                <p className="break-anywhere text-[11px] font-semibold text-slate-600">{row.name}</p>
                <p className="text-sm font-black tabular-nums text-slate-900">
                  {row.qty} {row.unit}
                  <span className="ml-1 text-[11px] font-semibold text-success-700">₹{formatNum(row.cost)}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* ── Verified plates + roll strength ──────────────────────── */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-3 py-6" tone="glow">
          <ProgressRing
            value={operator.verifiedCount}
            max={Math.max(40, totalEating)}
            tone="success"
            size={132}
            ariaLabel={t('mess.platesVerified')}
            label={t('mess.platesVerified')}
          >
            <p className="text-3xl font-black tabular-nums text-slate-900">{operator.verifiedCount}</p>
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
              {t('mess.platesVerified')}
            </p>
          </ProgressRing>
          <Button size="lg" className="w-full max-w-xs" onClick={() => setScanOpen(true)}>
            <ScanLine className="h-5 w-5" aria-hidden="true" /> Scan QR Code Pass
          </Button>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title={t('mess.totalResidents')}
            sub={`${RESIDENTS} · ${totalOut} ${t('mess.optedOutCount').toLowerCase()}`}
            icon={<Users className="h-5 w-5" aria-hidden="true" />}
            tone="violet"
            action={<Badge tone="violet">{t('game.liveNow')}</Badge>}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label={t('mess.optedIn')} value={totalEating} tone="success" />
            <Metric label={t('mess.optedOutCount')} value={totalOut} tone="amber" />
            <Metric label={t('admin.wastageSaved')} value={`${Math.round(totalOut * 0.42)} kg`} tone="brand" />
          </div>
          <a
            href="/mess/ingredients"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            {t('mess.ingredientsTitle')} →
          </a>
        </Card>
      </div>

      {/* ── Live activity feed + rush-hour demo ──────────────────── */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={t('live.activity')}
            sub={t('live.activitySub')}
            icon={<Activity className="h-5 w-5" aria-hidden="true" />}
            tone="violet"
            action={
              <Badge tone={pulse ? 'success' : 'violet'} dot glow={pulse !== null}>
                {pulse ? t('live.pulse') : t('game.liveNow')}
              </Badge>
            }
          />

          {activities.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
              <p className="text-xs font-semibold text-slate-500">{t('live.activityEmpty')}</p>
              <p className="mt-1 text-[11px] font-medium text-slate-400">{t('live.activityHint')}</p>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {activities.map((activity) => {
                const skipped = activity.choice === 'optout';
                return (
                  <li
                    key={activity.id}
                    className={cn('flex items-start gap-3 py-3', activity.id === latest?.id && 'animate-slide-up')}
                  >
                    <span
                      className={cn(
                        'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl',
                        skipped ? 'bg-amber-50 text-amber-600' : 'bg-success-50 text-success-600'
                      )}
                    >
                      {skipped ? (
                        <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-anywhere text-xs font-bold text-slate-900">
                        {t('live.studentMarked', {
                          id: activity.studentId,
                          action: skipped ? t('live.skipped') : t('live.opted')
                        })}
                      </p>
                      <p className="break-anywhere mt-0.5 text-[11px] font-medium text-slate-500">
                        {activity.mealLabel} · {t(`meals.slots.${activity.slot}` as TKey)} ·{' '}
                        {skipped ? t('live.autoAdjusted') : t('live.headcountSynced')} · ₹{formatNum(activity.savings.rupees)}{' '}
                        {t('live.saved')}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-black tabular-nums text-slate-900">{activity.participating}</p>
                      <p className="text-[10px] font-semibold text-slate-400">{timeAgo(activity.at)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card tone="glow">
          <CardHeader
            title={t('live.rush')}
            sub={t('live.rushSub')}
            icon={<Zap className="h-5 w-5" aria-hidden="true" />}
            tone="amber"
            action={
              <Badge tone={rush ? 'success' : 'amber'} dot glow={rush}>
                {rush ? t('live.rushRunning') : t('live.rushIdle')}
              </Badge>
            }
          />
          <Button variant={rush ? 'outline' : 'warden'} size="lg" className="mt-4 w-full" onClick={toggleRush}>
            {rush ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Zap className="h-4 w-4" aria-hidden="true" />}
            {rush ? t('live.rushStop') : t('live.rush')}
          </Button>
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-[11px] font-semibold text-slate-600">{t('live.simulated')}</span>
            <span className="text-sm font-black tabular-nums text-slate-900">+{simulatedTotal}</span>
          </div>
          {simulatedTotal > 0 && (
            <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={clearSimulation}>
              {t('live.rushReset')}
            </Button>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{t('live.rushNote')}</p>
        </Card>
      </div>

      <ScanDialog
        open={scanOpen}
        onClose={() => {
          setScanOpen(false);
          setCode('');
          setScanResult(null);
        }}
        onVerify={verify}
        value={code}
        onChange={setCode}
        result={scanResult}
      />

      {/* end console body */}
    </div>
  );
}

/** Compact stat block used on the roll-strength card. */
function Metric({ label, value, tone }: { label: string; value: React.ReactNode; tone: 'success' | 'amber' | 'brand' }) {
  const TONE = {
    success: 'bg-success-50 text-success-700 border-success-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    brand: 'bg-brand-50 text-brand-700 border-brand-200'
  }[tone];
  return (
    <div className={cn('rounded-2xl border p-4 text-center', TONE)}>
      <p className="text-2xl font-black tabular-nums">{value}</p>
      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide opacity-90">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Plate-pass scanner                                                  */
/* ------------------------------------------------------------------ */

function ScanDialog({
  open,
  onClose,
  onVerify,
  value,
  onChange,
  result
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
          <div className="relative w-full max-w-full overflow-hidden rounded-2xl border border-success-300 bg-success-50/60 p-5 text-center shadow-soft sm:p-8">
            <ScanLine className="animate-scan absolute left-0 top-0 h-full w-1 text-success-500" aria-hidden="true" />
            {result === null && <ChefHat className="mx-auto h-10 w-10 text-success-600" aria-hidden="true" />}
            <p className="mt-4 text-center text-sm font-medium text-slate-600">
              {result === 'verified'
                ? 'Plate verified — serve the thali'
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
              className="mt-3 w-full max-w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-2xl font-black uppercase tracking-widest text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
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
              <Button size="lg" className="mt-3 w-full" onClick={onVerify}>
                Verify Plate
              </Button>
            )}
          </div>
          <p className="mt-3 text-center text-xs font-bold uppercase text-slate-500">
            Quick demo codes (click to fill)
          </p>
          <div className="mt-1.5 flex flex-wrap justify-center gap-2">
            {['HH-8241', 'HH-5310', 'HH-9077', 'HH-1264'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange(c)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1 font-mono text-xs font-bold text-slate-700 transition hover:bg-brand-50 hover:text-brand-800"
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

