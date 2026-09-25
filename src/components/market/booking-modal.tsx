'use client';

import { motion } from 'framer-motion';
import {
  BadgeCheck,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Download,
  IndianRupee,
  LoaderCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Store,
  UtensilsCrossed
} from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { useLang } from '@/i18n';
import { cn, formatNum } from '@/lib/utils';
import type { Branch, FoodTag, RoomBed, TokenBooking } from '@/types';

/**
 * Hostel booking modal (Phase 2).
 * ─────────────────────────────────────────────────────────────
 * Replaces the old one-click "bed locked!" toast with the real shape of a hostel
 * reservation:
 *
 *   1. **Details** — who is coming (name, 10-digit WhatsApp number, college,
 *      roll number, move-in date, dietary preference). Nothing is optional
 *      except what genuinely is.
 *   2. **Payment** — two honest demo paths:
 *        • *Simulate UPI / QR*: a live-looking mock UPI code with a 5-minute
 *          countdown and an explicit "Simulate Success" button;
 *        • *Pay at desk*: the 7-day grace period the management desk already
 *          models (`graceDays`).
 *   3. **Confirmation** — booking id (`HH-IND-2026-####`), animated badge, full
 *      summary and a printable token receipt.
 *
 * The component never talks to the store directly: it collects a
 * {@link BookingIntent} and hands it to the page, which owns `db.bookToken()`,
 * `db.applyForHostel()` and the bed-availability stats. That keeps the modal
 * reusable (e.g. from a branch page) and the data flow one-directional.
 */

/** Refundable token every listing advertises. */
export const TOKEN_AMOUNT = 2000;
/** Grace period before holding rent starts. Mirrors the seed desk bookings. */
export const GRACE_DAYS = 7;
/** How long the mock UPI QR stays live. */
const QR_TTL_SECONDS = 300;
const QR_MODULES = 25;

export const DIET_OPTIONS: FoodTag[] = ['Jain', 'Pure Veg', 'Non-Veg'];

export interface BookingIntent {
  reference: string;
  studentName: string;
  studentMobile: string;
  collegeName: string;
  studentRoll: string;
  /** `yyyy-mm-dd` from the date picker. */
  moveInDate: string;
  diet: FoodTag;
  payment: 'upi' | 'desk';
}

export interface BookingDraft {
  branch: Branch;
  /** The bed the reservation will hold. */
  bed: RoomBed;
  /** Beds still vacant in this branch, recomputed from the live store. */
  vacant: number;
  total: number;
  fromFee: number;
}

/** `HH-IND-2026-1234` — short enough to read out at the desk. */
export function newBookingReference(): string {
  return `HH-IND-2026-${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Today's date as `yyyy-mm-dd` (local, not UTC) for the date-picker minimum. */
export function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Only digits, max 10 — the field is a phone number, not free text. */
function digits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

/**
 * Pseudo-random but *stable* QR matrix.
 * A real UPI code can't be rendered here (no gateway), but a random blob looks
 * like noise — so we draw the three finder patterns properly and fill the data
 * area from an xorshift seeded by the booking reference. Same reference, same
 * code; a refreshed reference visibly re-rolls the pattern.
 */
function buildQrMatrix(seed: string, size = QR_MODULES): boolean[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  function next(): number {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return Math.abs(h % 1000) / 1000;
  }
  const finders: Array<[number, number]> = [[0, 0], [0, size - 7], [size - 7, 0]];
  const cells: boolean[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const zone = finders.find(([zr, zc]) => r >= zr && r < zr + 7 && c >= zc && c < zc + 7);
      if (zone) {
        const lr = r - zone[0];
        const lc = c - zone[1];
        const border = lr === 0 || lr === 6 || lc === 0 || lc === 6;
        const core = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
        cells.push(border || core);
      } else {
        cells.push(next() > 0.52);
      }
    }
  }
  return cells;
}


type FieldName = 'studentName' | 'studentMobile' | 'collegeName' | 'studentRoll' | 'moveInDate';

export function BookingModal({
  open,
  draft,
  confirmed,
  onClose,
  onConfirm,
  onOpenPortal
}: {
  open: boolean;
  /** Live branch + bed data; recomputed by the page from the shared store. */
  draft: BookingDraft | null;
  /** Set by the page once the reservation is committed. */
  confirmed: TokenBooking | null;
  onClose: () => void;
  onConfirm: (intent: BookingIntent) => TokenBooking | null;
  onOpenPortal: () => void;
}) {
  const { t, tr } = useLang();
  const toast = useToast();

  const [reference, setReference] = React.useState(newBookingReference);
  const [studentName, setStudentName] = React.useState('');
  const [studentMobile, setStudentMobile] = React.useState('');
  const [collegeName, setCollegeName] = React.useState('');
  const [studentRoll, setStudentRoll] = React.useState('');
  const [moveInDate, setMoveInDate] = React.useState(todayIso);
  const [diet, setDiet] = React.useState<FoodTag>('Pure Veg');
  const [payment, setPayment] = React.useState<'upi' | 'desk'>('upi');
  const [errors, setErrors] = React.useState<Partial<Record<FieldName, boolean>>>({});

  /** Mock-UPI state. `paid` unlocks the confirm button in UPI mode. */
  const [paid, setPaid] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [qrSeconds, setQrSeconds] = React.useState(QR_TTL_SECONDS);

  const qr = React.useMemo(() => buildQrMatrix(reference), [reference]);
  const done = confirmed !== null;

  /* Closing the dialog arms a brand-new reservation: fresh id, fresh QR, empty
     form — so reopening it (for this or another hostel) never leaks state. */
  React.useEffect(() => {
    if (open) return;
    setReference(newBookingReference());
    setStudentName('');
    setStudentMobile('');
    setCollegeName('');
    setStudentRoll('');
    setMoveInDate(todayIso());
    setDiet('Pure Veg');
    setPayment('upi');
    setPaid(false);
    setVerifying(false);
    setQrSeconds(QR_TTL_SECONDS);
    setErrors({});
  }, [open]);

  /* QR countdown — only while the dialog is open and UPI is still unpaid. */
  React.useEffect(() => {
    if (!open || done || payment !== 'upi' || paid) return;
    const timer = window.setInterval(() => setQrSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(timer);
  }, [open, done, payment, paid]);

  function refreshQr() {
    setReference(newBookingReference());
    setQrSeconds(QR_TTL_SECONDS);
    setPaid(false);
  }

  function validate(): boolean {
    const next: Partial<Record<FieldName, boolean>> = {};
    if (studentName.trim().length < 3) next.studentName = true;
    /* Indian mobile shape: 10 digits starting 6-9. */
    if (!/^[6-9]\d{9}$/.test(studentMobile)) next.studentMobile = true;
    if (collegeName.trim().length < 3) next.collegeName = true;
    if (studentRoll.trim().length < 3) next.studentRoll = true;
    if (!moveInDate || moveInDate < todayIso()) next.moveInDate = true;
    setErrors(next);
    if (Object.keys(next).length) {
      toast.push({ title: t('booking.fixErrors'), tone: 'warning' });
      return false;
    }
    return true;
  }

  async function simulatePayment() {
    setVerifying(true);
    /* Stand-in for the gateway round-trip so the confirmation feels like a
       payment rather than a form submit. */
    await new Promise((resolve) => setTimeout(resolve, 900));
    setVerifying(false);
    setPaid(true);
    toast.push({ title: t('booking.upiPaid'), tone: 'success' });
  }

  /** Hand the collected intent to the page, which owns the store mutation. */
  function confirm() {
    if (!validate()) return;
    const booking = onConfirm({
      reference,
      studentName: studentName.trim(),
      studentMobile,
      collegeName: collegeName.trim(),
      studentRoll: studentRoll.trim().toUpperCase(),
      moveInDate,
      diet,
      payment
    });
    if (!booking) toast.push({ title: t('admissions.noBed'), tone: 'warning' });
  }

  /**
   * "Download Token Receipt".
   * A generated print view is the honest demo version of a PDF: the browser's
   * own print dialog lets the student save it, and nothing is uploaded anywhere.
   */
  function printReceipt() {
    if (!draft || !confirmed) return;
    const rows: Array<[string, string]> = [
      [t('booking.ref'), confirmed.reference ?? confirmed.id],
      [t('booking.studentName'), studentName],
      [t('booking.phone'), studentMobile],
      [t('booking.college'), collegeName],
      [t('booking.roll'), studentRoll.toUpperCase()],
      [t('booking.moveIn'), prettyDate(moveInDate)],
      [t('booking.diet'), tr(diet)],
      [t('booking.bedConfig'), tr(draft.bed.config)],
      [t('booking.monthlyRent'), `Rs ${formatNum(draft.bed.monthlyFee)}`],
      [t('booking.tokenAmount'), `Rs ${formatNum(confirmed.tokenAmount)}`],
      [t('booking.tokenStatus'), payment === 'upi' ? t('booking.paidOnline') : t('booking.payOnArrival')],
      [t('booking.graceUntil'), prettyDate(moveInDate)]
    ];
    const html = `<!doctype html><html><head><meta charset="utf-8" />
<title>${t('booking.receiptTitle')}</title>
<style>
  body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;margin:32px;color:#0f172a}
  h1{font-size:20px;margin:0 0 4px}
  p.sub{margin:0 0 20px;color:#475569;font-size:12px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  td{padding:9px 0;border-bottom:1px solid #e2e8f0;vertical-align:top}
  td.k{color:#475569;width:45%}
  td.v{font-weight:700;text-align:right}
  .note{margin-top:24px;padding:14px;border:1px solid #c7d2fe;border-radius:14px;background:#eef2ff;font-size:12px;color:#3730a3}
</style></head><body>
<h1>HostelHub</h1>
<p class="sub">${t('app.tagline')} &middot; ${draft.branch.name}</p>
<table>${rows.map(([k, v]) => `<tr><td class="k">${k}</td><td class="v">${v}</td></tr>`).join('')}</table>
<p class="note">${t('booking.printHint')}</p>
</body></html>`;
    const win = window.open('', '_blank', 'width=720,height=900');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  /** Small helper: labelled field with an inline error state. */
  function fieldProps(name: FieldName) {
    return {
      'aria-invalid': errors[name] ? true : undefined,
      className: errors[name] ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100' : undefined
    } as const;
  }

  const qrExpired = payment === 'upi' && !paid && qrSeconds <= 0;
  /* Desk payment needs no gateway step; UPI must be simulated through first. */
  const canConfirm = payment === 'desk' || paid;
  const qrClock = `${Math.floor(qrSeconds / 60)}:${String(qrSeconds % 60).padStart(2, '0')}`;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent maxW="max-w-2xl">
        <DialogHeader
          title={draft ? draft.branch.name : t('booking.title')}
          desc={t('booking.sub')}
          icon={<BedDouble className="h-5 w-5" aria-hidden="true" />}
        />
        <DialogBody className="pt-4">
          {/* ── What is being reserved ───────────────────────────────── */}
          <div className="grid gap-2 sm:grid-cols-3">
            <Detail
              icon={<BedDouble className="h-3.5 w-3.5" aria-hidden="true" />}
              label={t('booking.bedConfig')}
              value={draft ? tr(draft.bed.config) : '—'}
            />
            <Detail
              icon={<IndianRupee className="h-3.5 w-3.5" aria-hidden="true" />}
              label={t('booking.monthlyRent')}
              value={draft ? `₹${formatNum(draft.bed.monthlyFee)}` : '—'}
            />
            <Detail
              icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />}
              label={t('booking.tokenAmount')}
              value={`₹${formatNum(TOKEN_AMOUNT)}`}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
            {draft && <Badge tone="slate">Room {draft.bed.roomNo} · Bed {draft.bed.bedNo}</Badge>}
            {draft && (
              <Badge tone="success">
                {draft.vacant}/{draft.total} {t('market.bedsOpen')}
              </Badge>
            )}
            <span>{t('market.tokenNote', { days: GRACE_DAYS })}</span>
          </div>

          {/* ── Student details ──────────────────────────────────────── */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="booking-name">
                {t('booking.studentName')} <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="booking-name"
                autoComplete="name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder={t('booking.studentNamePh')}
                {...fieldProps('studentName')}
              />
              {errors.studentName && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600">{t('booking.requiredField')}</p>
              )}
            </div>

            <div>
              <Label htmlFor="booking-phone">
                {t('booking.phone')} <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Smartphone
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <Input
                  id="booking-phone"
                  className={cn('pl-9', errors.studentMobile && 'border-rose-400 focus:border-rose-500 focus:ring-rose-100')}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  value={studentMobile}
                  onChange={(e) => setStudentMobile(digits(e.target.value))}
                  placeholder={t('booking.phonePh')}
                  aria-invalid={errors.studentMobile ? true : undefined}
                />
              </div>
              {errors.studentMobile && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600">{t('booking.phoneInvalid')}</p>
              )}
            </div>

            <div>
              <Label htmlFor="booking-college">
                {t('booking.college')} <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="booking-college"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder={t('booking.collegePh')}
                {...fieldProps('collegeName')}
              />
            </div>

            <div>
              <Label htmlFor="booking-roll">
                {t('booking.roll')} <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="booking-roll"
                value={studentRoll}
                onChange={(e) => setStudentRoll(e.target.value)}
                placeholder={t('booking.rollPh')}
                {...fieldProps('studentRoll')}
              />
            </div>

            <div>
              <Label htmlFor="booking-date">
                <CalendarDays className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                {t('booking.moveIn')}
              </Label>
              <Input
                id="booking-date"
                type="date"
                min={todayIso()}
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                {...fieldProps('moveInDate')}
              />
              <p className="mt-1 text-[11px] font-medium text-slate-500">{t('booking.moveInHint')}</p>
            </div>

            <div>
              <Label>
                <UtensilsCrossed className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                {t('booking.diet')}
              </Label>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('booking.diet')}>
                {DIET_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDiet(option)}
                    aria-pressed={diet === option}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-xs font-semibold transition',
                      diet === option
                        ? 'border-brand-400 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'
                    )}
                  >
                    {tr(option)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Payment method ───────────────────────────────────────── */}
          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t('booking.payTitle')}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPayment('upi')}
                aria-pressed={payment === 'upi'}
                className={cn(
                  'rounded-2xl border px-3.5 py-3 text-left transition',
                  payment === 'upi'
                    ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-100'
                    : 'border-slate-200 bg-white hover:border-brand-300'
                )}
              >
                <span className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <QrCode className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                  {t('booking.payUpi')}
                </span>
                <span className="mt-1 block text-[11px] font-medium text-slate-600">{t('booking.payUpiSub')}</span>
              </button>

              <button
                type="button"
                onClick={() => setPayment('desk')}
                aria-pressed={payment === 'desk'}
                className={cn(
                  'rounded-2xl border px-3.5 py-3 text-left transition',
                  payment === 'desk'
                    ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-100'
                    : 'border-slate-200 bg-white hover:border-brand-300'
                )}
              >
                <span className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Store className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                  {t('booking.payDesk')}
                </span>
                <span className="mt-1 block text-[11px] font-medium text-slate-600">{t('booking.payDeskSub')}</span>
              </button>
            </div>

            {/* Option A — mock UPI / QR, with its own countdown */}
            {payment === 'upi' && (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                {paid ? (
                  <p className="flex items-center gap-2 text-xs font-bold text-success-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {t('booking.upiPaid')}
                  </p>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div
                      role="img"
                      aria-label={`${t('booking.payUpi')} token`}
                      className="grid w-fit shrink-0 gap-[2px] rounded-xl border border-slate-200 bg-white p-2"
                      style={{ gridTemplateColumns: `repeat(${QR_MODULES}, minmax(0, 1fr))` }}
                    >
                      {qr.map((on, i) => (
                        <span
                          key={i}
                          className={cn('h-[5px] w-[5px] rounded-[1px]', on ? 'bg-slate-900' : 'bg-transparent')}
                        />
                      ))}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-anywhere text-[11px] font-semibold text-slate-600">{t('booking.qrHint')}</p>
                      <p
                        className={cn(
                          'mt-1 font-mono text-xl font-black tabular-nums',
                          qrExpired ? 'text-rose-600' : 'text-slate-900'
                        )}
                      >
                        {qrClock}
                      </p>
                      <p className="break-anywhere text-[11px] font-medium text-slate-500">
                        {qrExpired ? t('booking.qrExpired') : `${t('booking.ref')} · ${reference}`}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {qrExpired ? (
                          <Button variant="outline" size="sm" onClick={refreshQr}>
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                            {t('booking.qrRefresh')}
                          </Button>
                        ) : (
                          <Button variant="success" size="sm" disabled={verifying} onClick={() => void simulatePayment()}>
                            {verifying ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                            )}
                            {verifying ? t('booking.simulating') : t('booking.simulate')}
                          </Button>
                        )}
                        <span className="text-[10px] font-semibold text-slate-400">{t('booking.demoMoney')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Option B — token at the desk, 7-day grace */}
            {payment === 'desk' && (
              <p className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[11px] font-semibold text-amber-800">
                <Store className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t('booking.graceUntil', { date: prettyDate(moveInDate) })}
              </p>
            )}
          </div>

          {/* ── Confirm / confirmation card ───────────────────────────── */}
          {done && confirmed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="mt-5 rounded-2xl border border-success-200 bg-success-50 p-4"
            >
              <div className="flex items-center gap-3">
                <motion.span
                  initial={{ scale: 0.4, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-success-600 text-white shadow-soft"
                >
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                </motion.span>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-success-900">{t('booking.confirmedTitle')}</p>
                  <p className="text-[11px] font-semibold text-success-700">
                    {t('booking.confirmedSub', { days: confirmed.graceDays })}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-success-200 bg-white px-3.5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{t('booking.ref')}</p>
                <p className="font-mono text-lg font-black tracking-tight text-slate-900">
                  {confirmed.reference ?? confirmed.id}
                </p>
              </div>

              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                <Detail label={t('booking.studentName')} value={studentName} />
                <Detail label={t('booking.phone')} value={`+91 ${studentMobile}`} />
                <Detail label={t('booking.college')} value={collegeName} />
                <Detail label={t('booking.roll')} value={studentRoll.toUpperCase()} />
                <Detail
                  label={t('booking.tokenStatus')}
                  value={payment === 'upi' ? t('booking.paidOnline') : t('booking.payOnArrival')}
                />
                <Detail label={t('booking.moveIn')} value={prettyDate(moveInDate)} />
              </dl>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="sm:flex-1" onClick={printReceipt}>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {t('booking.download')}
                </Button>
                <Button variant="warden" className="sm:flex-1" onClick={onOpenPortal}>
                  {t('booking.goPortal')}
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="mt-5">
              <Button variant="warden" size="lg" className="w-full" disabled={!canConfirm} onClick={confirm}>
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {t('booking.confirm')} · ₹{formatNum(TOKEN_AMOUNT)}
              </Button>
              {!canConfirm && (
                <p className="mt-2 text-center text-[11px] font-semibold text-slate-500">{t('booking.paymentFirst')}</p>
              )}
            </div>
          )}

        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/** Label/value line used by the summary strip and the confirmation card. */
function Detail({
  label,
  value,
  icon
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2">
      {icon && (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="break-anywhere text-xs font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
