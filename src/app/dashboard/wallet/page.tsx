'use client';

import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, TicketCheck, Receipt } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatTile } from '@/components/portal/stat';
import { Button } from '@/components/ui/button';
import { useDb } from '@/lib/store';
import { useLang, type TKey } from '@/i18n';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

export default function WalletPage() {
  const db = useDb();
  const toast = useToast();
  const { t } = useLang();
  const w = db.wallet;
  const available = w.monthlyAllocation - w.used - w.onMeal;

  const txns = [
    { id: 't1', labelKey: 'wallet.lunchToday', cost: 10, at: '12:40 PM' },
    { id: 't2', labelKey: 'wallet.breakfast', cost: 6, at: '8:05 AM' },
    { id: 't3', labelKey: 'wallet.dinnerYesterday', cost: 10, at: '7:55 PM' },
    { id: 't4', labelKey: 'wallet.snacks', cost: 5, at: '5:20 PM' },
    { id: 't5', labelKey: 'wallet.lunch', cost: 10, at: '12:30 PM' }
 ];

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
        <WalletIcon className="h-7 w-7 text-success-600" aria-hidden="true" /> {t('wallet.title')}
      </h1>
      <p className="mt-1 text-slate-500">{t('meals.credits')} · monthly dining credit system.</p>

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-medium text-slate-500">{t('wallet.available')}</p>
            <p className="text-4xl font-black text-slate-900">{available}</p>
            <p className="text-xs text-slate-400">{t('wallet.ofMonthly', { used: w.used + w.onMeal, total: w.monthlyAllocation })}</p>
          </div>
          <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-success-600 shadow-soft">
            <WalletIcon className="h-9 w-9" aria-hidden="true" />
          </div>
        </div>
        <div className="px-5 pb-4">
          <Progress value={w.used + w.onMeal} max={w.monthlyAllocation} tone="success" label={t('wallet.creditsUsed')} />
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div><p className="font-bold text-slate-700">{w.used}</p><p className="text-slate-400">{t('wallet.used')}</p></div>
            <div><p className="font-bold text-brand-600">{w.onMeal}</p><p className="text-slate-400">{t('wallet.reserved')}</p></div>
            <div><p className="font-bold text-success-600">{available}</p><p className="text-slate-400">{t('wallet.available')}</p></div>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatTile icon={<ArrowDownCircle className="h-4 w-4" />} label={t('wallet.used')} value={w.used} tone="amber" />
        <StatTile icon={<ArrowUpCircle className="h-4 w-4" />} label={t('wallet.reserved')} value={w.onMeal} tone="sky" />
        <StatTile icon={<TicketCheck className="h-4 w-4" />} label={t('wallet.redeemed')} value={w.redeemedRewards} tone="violet" />
      </div>

            <Card className="mt-6 p-5">
        <CardHeader title={t('wallet.txnsTitle')} sub={t('wallet.txnsSub')} icon={<Receipt className="h-5 w-5" />} />
        <ul className="mt-3 divide-y">
          {txns.map((x) => (
            <li key={x.id} className="flex items-center gap-3 py-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500">🍽</span>
              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-700">{t(x.labelKey as TKey)}</p>
                <p className="text-[11px] text-slate-400">{x.at}</p>
              </div>
              <span className={cn('text-sm font-bold', x.cost ? 'text-slate-700' : 'text-success-600')}>−{x.cost}</span>
            </li>
          ))}
        </ul>
      </Card>

            <Card className="mt-6 p-5">
        <CardHeader title={t('wallet.topup')} sub={t('wallet.kiosk')} icon={<Receipt className="h-5 w-5" />} />
        <p className="mt-2 text-sm text-slate-500">{t('wallet.rechargeHint')}</p>
        <Button variant="success" className="mt-3" onClick={() => toast.push({ title: t('wallet.rechargeSent'), body: t('wallet.rechargeBody'), tone: 'info' })}>
          {t('wallet.recharge')}
        </Button>
      </Card>
    </div>
  );
}