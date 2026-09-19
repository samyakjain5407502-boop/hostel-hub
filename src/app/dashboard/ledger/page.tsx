'use client';

import { motion } from 'framer-motion';
import { BadgeIndianRupee, CheckCircle2, Download, FileText, Receipt } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { useToast } from '@/components/ui/toast';
import { cn, formatNum } from '@/lib/utils';

export default function LedgerPage() {
  const db = useDb();
  const { t } = useLang();

  const invoices = db.invoices;
  const [activeId, setActiveId] = React.useState<string>(invoices[0]?.id ?? '');
  const active = invoices.find((i) => i.id === activeId) ?? invoices[0];

  const due = invoices.filter((i) => !i.paid).reduce((a, b) => a + b.total, 0);
  const paid = invoices.filter((i) => i.paid).reduce((a, b) => a + b.total, 0);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('ledger.title')}</h1>
        <p className="mt-1 text-slate-500">{t('ledger.sub')}</p>
      </motion.div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5">
          <BadgeIndianRupee className="h-5 w-5 text-rose-600" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold text-rose-700">{t('ledger.unpaid')}</p>
            <p className="text-xl font-extrabold text-rose-900">₹{formatNum(due)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-success-200 bg-success-50 px-4 py-3.5">
          <CheckCircle2 className="h-5 w-5 text-success-600" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold text-success-700">{t('ledger.paid')}</p>
            <p className="text-xl font-extrabold text-success-900">₹{formatNum(paid)}</p>
          </div>
        </div>
      </div>

      {invoices.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
          {t('ledger.noInvoices')}
        </p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <InvoiceCard active={active} />

          <Card>
            <CardHeader icon={<FileText className="h-5 w-5" />} title={t('ledger.list')} sub={t('ledger.listSub')} />
            <ul className="mt-3 space-y-1.5">
              {invoices.map((inv) => (
                <li key={inv.id}>
                  <button
                    onClick={() => setActiveId(inv.id)}
                    aria-pressed={inv.id === active?.id}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition',
                      inv.id === active?.id ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                    )}
                  >
                    <span>
                      <span className="block text-xs font-bold text-slate-800">{inv.month}</span>
                      <span className="block text-[11px] text-slate-400">{inv.id}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-bold text-slate-900">₹{formatNum(inv.total)}</span>
                      <span className={cn('block text-[11px] font-semibold', inv.paid ? 'text-success-600' : 'text-rose-500')}>
                        {inv.paid ? t('ledger.paid') : t('ledger.unpaid')}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}

/** Right-hand statement preview with the mark-as-paid / print actions. */
function InvoiceCard({ active }: { active: ReturnType<typeof useDb>['invoices'][number] | undefined }) {
  const db = useDb();
  const toast = useToast();
  const { t } = useLang();
  if (!active) return null;

  return (
    <Card className="lg:col-span-2">
      <CardHeader
        icon={<Receipt className="h-5 w-5" />}
        title={`${active.month} · ${active.id}`}
        sub={active.studentName}
        action={<Badge tone={active.paid ? 'success' : 'rose'} dot>{active.paid ? t('ledger.paid') : t('ledger.unpaid')}</Badge>}
      />

      <ul className="mt-4 divide-y">
        <Row label={t('ledger.roomRent')} amount={active.roomRent} />
        <Row label={t('ledger.food')} amount={active.foodCharge} />
        <Row label={t('ledger.absence')} amount={-active.absenceDeduction} tone={active.absenceDeduction ? 'success' : undefined} />
        {active.addonRent > 0 && <Row label={t('ledger.addon')} amount={active.addonRent} tone="rose" />}
      </ul>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white">
        <span className="text-sm font-semibold">{t('ledger.total')}</span>
        <span className="text-xl font-extrabold">₹{formatNum(active.total)}</span>
      </div>

      <div className="mt-3">
        <Progress
          value={active.absenceDeduction}
          max={Math.max(1, active.foodCharge)}
          tone="success"
          label={t('ledger.absence')}
          size="sm"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        {!active.paid && (
          <Button
            variant="success"
            onClick={() => {
              db.markInvoicePaid(active.id);
              toast.push({ title: t('ledger.paidDone'), tone: 'success' });
            }}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {t('ledger.markPaid')}
          </Button>
        )}
        <Button variant="outline" onClick={() => window.print()}>
          <Download className="h-4 w-4" aria-hidden="true" /> {t('ledger.print')}
        </Button>
      </div>
    </Card>
  );
}

/** One ledger line — negative amounts render as a green deduction. */
function Row({ label, amount, tone }: { label: string; amount: number; tone?: 'success' | 'rose' }) {
  return (
    <li className="flex items-center justify-between py-2.5">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={cn('text-sm font-bold', tone === 'success' ? 'text-success-600' : tone === 'rose' ? 'text-rose-600' : 'text-slate-900')}>
        {amount < 0 ? '−' : ''}₹{formatNum(Math.abs(amount))}
      </span>
    </li>
  );
}