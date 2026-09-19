'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertTriangle, Building2, RotateCcw } from 'lucide-react';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useDb } from '@/lib/store';
import { useLang, type TKey } from '@/i18n';
import { useToast } from '@/components/ui/toast';
import { cn, formatNum } from '@/lib/utils';
import type { TokenBooking } from '@/types';

const TOKEN = 2000;
const HOLDING_RATE = 120;

function statusBadge(status: TokenBooking['status'], t: (k: TKey, vars?: Record<string, string | number>) => string) {
  const map = {
    Held: { tone: 'amber' as const, label: t('book.held') },
    Confirmed: { tone: 'success' as const, label: t('book.confirmed') },
    Expired: { tone: 'rose' as const, label: t('book.expired') }
  } as const;
  const { tone, label } = map[status];
  return <Badge tone={tone} dot>{label}</Badge>;
}

function graceBar(booking: TokenBooking, t: (k: TKey, vars?: Record<string, string | number>) => string) {
  const endsAt = booking.expectedArrival;
  const now = Date.now();
  const total = booking.graceDays * 86_400_000;
  const elapsed = Math.max(0, now - booking.bookedAt);
  const remaining = Math.max(0, endsAt - now);
  const pct = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0;
  const done = remaining <= 0;
  return (
    <div className="rounded-xl bg-slate-50 p-3.5">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>{t('book.graceWindow')}</span>
        {done ? (
          <span className="text-rose-600">{t('book.overdue')}</span>
        ) : (
          <span className="text-slate-700">{t('book.daysLeft', { n: Math.ceil(remaining / 86_400_000) })}</span>
        )}
      </div>
      <Progress
        value={done ? 100 : pct}
        max={100}
        tone={done ? 'rose' : pct > 75 ? 'amber' : 'success'}
        label={t('book.graceEnds')}
        size="sm"
        className="mt-2"
      />
      {done && <p className="mt-2 text-xs font-medium text-rose-600">{t('book.overdueNote')}</p>}
    </div>
  );
}

export default function BookPage() {
  const db = useDb();
  const toast = useToast();
  const { t, n, tr } = useLang();

  const active = db.bookings.find((b) => b.status === 'Held' || b.status === 'Confirmed') ?? null;
  const expired = db.bookings.find((b) => b.status === 'Expired') ?? null;
  const booking = active ?? expired ?? null;

  const branch = booking ? db.branches.find((b) => b.id === booking.branchId) ?? null : null;
  const bed = booking && branch ? db.beds.find((b) => b.id === booking.bedId) ?? null : null;

  const endsAt = booking?.expectedArrival ?? 0;
  const now = Date.now();
  const isOverdue = booking && endsAt > 0 && now > endsAt && booking.status === 'Held';
  const isConfirmed = booking?.status === 'Confirmed';

  function handleConfirm() {
    if (!booking || isConfirmed) return;
    const updated = db.confirmArrival(booking.id);
    if (updated) toast.push({ title: t('book.arrivedToast'), tone: 'success' });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700">
          <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
          {t('nav.hostels')}
        </span>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">{t('book.title')}</h1>
        <p className="mt-1.5 text-slate-500">{t('book.sub')}</p>
      </motion.div>

      {!booking ? (
        <Card>
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400">
              <RotateCcw className="h-8 w-8" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{t('book.noBooking')}</p>
              <p className="mt-1 text-xs text-slate-500">{t('book.sceneNone')}</p>
            </div>
            <Button asChild size="lg">
              <a href="/hostels" className="flex items-center gap-2">
                {t('market.bookToken')}
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </Card>
      ) : isConfirmed ? (
        <Card>
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-success-100 text-success-600">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{t('book.sceneArrived')}</p>
              <p className="mt-1 text-xs text-slate-500">{t('book.arrivalDone')}</p>
            </div>
            <Badge tone="success" dot>{t('book.confirmed')}</Badge>
            {bed && branch && (
              <div className="mt-2 text-xs text-slate-500">
                {tr('tag.' + bed.config)} · {branch.name} · {bed.roomNo}/{bed.bedNo}
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{t('book.bookingId')}</p>
              <p className="text-xs text-slate-400 font-mono">{booking.id}</p>
            </div>
            {statusBadge(booking.status, t)}
          </div>

          {branch && bed && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">{t('book.branch')}</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-800">{branch.name}</p>
                <p className="text-xs text-slate-500">{branch.address}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">{t('book.roomBed')}</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-800">
                  {bed.roomNo} / Bed {bed.bedNo}
                </p>
                <p className="text-xs text-slate-500">{tr('tag.' + bed.config)} · {n(bed.monthlyFee)}/{t('market.perMonth')}</p>
              </div>
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3.5">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">{t('book.tokenPaid')}</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">₹{formatNum(TOKEN)}</p>
              <p className="text-[11px] text-slate-400">token held in escrow</p>
            </div>
            <div>{graceBar(booking, t)}</div>
          </div>

          {isOverdue && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 p-3.5 text-xs">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden="true" />
              <span className="text-rose-700">{t('book.overdueNote')}</span>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-500">
            {t('book.arrivalDeadline', {
              date: new Date(endsAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            })}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={handleConfirm} disabled={Boolean(isConfirmed || isOverdue)} className="flex-1">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {t('book.confirmArrival')}
            </Button>
            <Button variant="outline" asChild>
              <a href="/hostels">{t('book.noBooking')}</a>
            </Button>
          </div>

          {isOverdue && (
            <div className="mt-3 rounded-xl border border-dashed border-rose-200 bg-rose-50/40 p-3.5 text-xs text-rose-600">
              <p className="font-semibold">{t('book.holdingRent')}</p>
              <p className="mt-0.5 text-slate-600">
                {t('book.perDay', { n: n(HOLDING_RATE) })} · {t('ledger.addon')}
              </p>
            </div>
          )}
        </Card>
      )}

      <p className="mt-6 text-center text-xs text-slate-400">{t('market.tokenNote', { days: 7 })}</p>
    </div>
  );
}

