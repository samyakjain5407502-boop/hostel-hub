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
import { ChefHat, ScanLine, Power, Users, Clock3, ClipboardList } from 'lucide-react';
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
import { useOperatorState } from '@/lib/operator-state';
import { cn } from '@/lib/utils';
import type { Meal } from '@/types';

/** Demo roll strength — the denominator for "how many are we cooking for". */
const RESIDENTS = 520;

export default function MessConsolePage() {
  const db = useDb();
  const toast = useToast();
  const { t } = useLang();
  const operator = useOperatorState();
  const { fire, burst } = useConfetti();

  const today = db.week.find((d) => d.date === TODAY_KEY) ?? db.week[0];

  const [scanOpen, setScanOpen] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [scanResult, setScanResult] = React.useState<'verified' | 'invalid' | 'reuse' | null>(null);

  const meals = today?.meals ?? [];
  const totalEating = meals.reduce((sum, m) => sum + m.participating, 0);
  const totalOut = meals.reduce((sum, m) => sum + m.optedOut, 0);
  const activeSlot = meals.find((m) => m.status === 'active');

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
            return (
              <div
                key={meal.id}
                className={cn(
                  'lift flex min-w-0 flex-col items-center gap-2 rounded-2xl border p-3 text-center sm:p-4',
                  isOpen ? 'glow-success border-success-300 bg-success-50/60' : 'border-slate-200 bg-slate-50'
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
                <span className={cn('text-4xl font-black tabular-nums sm:text-5xl', isOpen ? 'text-success-700' : 'text-slate-900')}>
                  {meal.participating}
                </span>
                <span className="text-[11px] font-semibold text-slate-600">
                  {t('mess.optedIn')} · {meal.optedOut} {t('mess.optedOutCount').toLowerCase()}
                </span>
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

