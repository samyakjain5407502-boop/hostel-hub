'use client';

import { motion } from 'framer-motion';
import { Check, CircleDollarSign, Receipt, Wand2 } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { playChime } from '@/lib/celebration';

/**
 * Fee invoice desk — generate a month's invoice from four numbers, then
 * track collection. Room rent is pre-filled from the branch's 2-Bed rate
 * so the desk rarely types more than a name.
 */
export default function InvoicesPage() {
  const db = useDb();
  const toast = useToast();
  const { t, n } = useLang();
  const [name, setName] = React.useState('');
  const [branch, setBranch] = React.useState('');
  const [month, setMonth] = React.useState(() => new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' }));
  const [rent, setRent] = React.useState('4800');
  const [food, setFood] = React.useState('3200');
  const [absent, setAbsent] = React.useState('0');
  const [addon, setAddon] = React.useState('0');
  const branchId = branch || db.branches[0]?.id || '';

  const unpaid = db.invoices.filter((i) => !i.paid);
  const paid = db.invoices.filter((i) => i.paid);
  const collected = paid.reduce((s, i) => s + i.total, 0);
  const pending = unpaid.reduce((s, i) => s + i.total, 0);
  const total = Math.max(0, (Number(rent) || 0) + (Number(food) || 0) + (Number(addon) || 0) - (Number(absent) || 0));

  function generate() {
    if (!name.trim()) return;
    const inv = db.buildInvoice({
      studentName: name.trim(), branchId, month,
      roomRent: Number(rent) || 0, foodCharge: Number(food) || 0,
      absenceDeduction: Number(absent) || 0, addonRent: Number(addon) || 0
    });
    playChime();
    toast.push({ title: t('invoices.created', { id: inv.id }), body: `₹${n(inv.total)} · ${month}`, tone: 'success' });
    setName('');
  }

  function markPaid(id: string) {
    const done = db.markInvoicePaid(id);
    if (done) toast.push({ title: t('invoices.paidToast', { id }), tone: 'success' });
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('invoices.title')}</h1>
        <p className="mt-1 text-slate-600">{t('invoices.sub')}</p>
      </motion.div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t('invoices.collected')}</p>
          <p className="mt-1 text-3xl font-black text-success-600">₹{n(collected)}</p>
          <p className="text-[11px] text-slate-500">{paid.length} {t('invoices.settled')}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t('mgmt.unpaid')}</p>
          <p className="mt-1 text-3xl font-black text-rose-600">₹{n(pending)}</p>
          <p className="text-[11px] text-slate-500">{unpaid.length} {t('invoices.open')}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <CardHeader icon={<Wand2 className="h-5 w-5" />} title={t('invoices.generate')} sub={t('invoices.generateSub')} />
          <div className="mt-4 grid gap-3">
            <div>
              <Label>{t('walkin.name')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Mehta" />
            </div>
            <div>
              <Label>{t('walkin.branch')}</Label>
              <select value={branchId} onChange={(e) => setBranch(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
                {db.branches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div><Label>{t('invoices.month')}</Label><Input value={month} onChange={(e) => setMonth(e.target.value)} /></div>
              <div><Label>{t('invoices.roomRent')}</Label><Input value={rent} onChange={(e) => setRent(e.target.value)} inputMode="numeric" /></div>
              <div><Label>{t('invoices.food')}</Label><Input value={food} onChange={(e) => setFood(e.target.value)} inputMode="numeric" /></div>
              <div><Label>{t('invoices.absence')}</Label><Input value={absent} onChange={(e) => setAbsent(e.target.value)} inputMode="numeric" /></div>
              <div className="col-span-2"><Label>{t('invoices.addon')}</Label><Input value={addon} onChange={(e) => setAddon(e.target.value)} inputMode="numeric" /></div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-bold text-brand-800"><CircleDollarSign className="h-4 w-4" aria-hidden="true" /> {t('invoices.total')}</span>
              <span className="text-lg font-black text-brand-900">₹{n(total)}</span>
            </div>
            <Button className="w-full" disabled={!name.trim()} onClick={generate}>
              <Receipt className="h-4 w-4" aria-hidden="true" /> {t('invoices.issue')}
            </Button>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-3">
          <CardHeader icon={<Receipt className="h-5 w-5" />} title={t('invoices.ledger')} sub={t('invoices.ledgerSub')} action={<Badge tone="brand" dot>{t('mgmt.live')}</Badge>} />
          <ul className="mt-4 divide-y">
            {db.invoices.slice(0, 12).map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{inv.studentName}</p>
                  <p className="font-mono text-[11px] text-slate-500">{inv.id} · {inv.month}</p>
                </div>
                <span className="text-sm font-black text-slate-900">₹{n(inv.total)}</span>
                {inv.paid ? (
                  <Badge tone="success" dot>{t('invoices.paid')}</Badge>
                ) : (
                  <button
                    onClick={() => markPaid(inv.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-brand-700 active:scale-95"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" /> {t('invoices.markPaid')}
                  </button>
                )}
              </li>
            ))}
            {db.invoices.length === 0 && (
              <li className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">{t('invoices.none')}</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
