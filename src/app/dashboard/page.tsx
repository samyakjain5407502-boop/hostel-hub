'use client';

import { motion } from 'framer-motion';
import {
  UtensilsCrossed, Gift, LifeBuoy, Wallet as WalletIcon, BarChart3, ArrowRight, Sparkles
} from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { StatTile } from '@/components/portal/stat';
import { MealCard } from '@/components/portal/meal-card';
import { Badge } from '@/components/ui/badge';
import { useDb } from '@/lib/store';
import { useLang, TKey } from '@/i18n';
import type { User } from '@/types';

export default function DashboardHome() {
  const db = useDb();
  const { t, lang } = useLang();

  const today = db.week[0];
  const meals = today?.meals ?? [];
  const totalPoints = db.rewards.filter((r) => r.points > 0).reduce((a, b) => a + b.points, 0);
  const wallet = db.wallet;
  const available = wallet.monthlyAllocation - wallet.used - wallet.onMeal;
  const live = meals.find((m) => m.status === 'active');

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-slate-900">Namaste, Demo Student 👋</h1>
        <p className="mt-1 text-slate-500">
          {lang === 'hi' ? 'आज' : lang === 'hinglish' ? 'Aaj ka plan' : t('common.today')} — {mealTitle(live)}.
        </p>
      </motion.div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<UtensilsCrossed className="h-4 w-4" />} label={t('nav.mess')} value={`${live?.participating ?? 0}`} sub={live ? `${live.label} · ${t('meals.optOut').toLowerCase()} ${live.optedOut}` : '—'} tone="brand" />
        <StatTile icon={<Gift className="h-4 w-4" />} label={t('nav.rewards')} value={formatPts(totalPoints)} sub={`${db.gifts.scratchLeft} ${t('rewards.giftsLeft').toLowerCase()}`} tone="violet" />
        <StatTile icon={<LifeBuoy className="h-4 w-4" />} label={t('nav.complaints')} value={openComplaints(db)} sub={t('complaints.sla')} tone="rose" href="/dashboard/complaints" />
        <StatTile icon={<WalletIcon className="h-4 w-4" />} label={t('nav.wallet')} value={available} sub={`${t('wallet.available')} ${t('meals.credits').toLowerCase()}`} tone="success" href="/dashboard/wallet" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card padded={false} className="!px-0">
          <div className="px-4 py-3">
            <CardHeader title={t('meals.title')} sub={t('common.today')} action={<a href="/dashboard/mess" className="text-xs font-semibold text-brand-600">{t('common.viewAll')} →</a>} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {meals.map((m) => <MealCard key={m.id} meal={m} />)}
          </div>
        </Card>

        <PollBanner />
      </div>
    </div>
  );
}

function PollBanner() {
  const db = useDb();
  const poll = db.poll;
  const top = [...poll.options].sort((a, b) => b.votes - a.votes)[0];
  const totalVotes = poll.options.reduce((a, b) => a + b.votes, 0);
  return (
    <Card className="!px-4 py-5">
      <CardHeader title="Weekly Menu Poll" sub="Weekend special voting" action={<Badge tone="success" dot>Live</Badge>} icon={<BarChart3 className="h-5 w-5" />} />
      <div className="mt-4 space-y-2.5">
        {poll.options.slice(0, 4).map((o) => {
          const pct = totalVotes ? Math.round((o.votes / totalVotes) * 100) : 0;
          return (
            <div key={o.id}>
              <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span>{o.emoji} {o.dish}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className={cn(('h-2.5 rounded-full bg-gradient-to-r from-brand-500 to-violet-500'))} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <a href="/dashboard/mess#poll" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
        Vote now <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </a>
    </Card>
  );
}

function mealTitle(m?: { label: string; status: string } | null): string {
  return m ? `${m.label} (${m.status})` : 'no active meal slot';
}
function formatPts(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
function cn(...a: string[]) {
  return a.filter(Boolean).join(' ');
}
function openComplaints(db: { complaints: { status: string }[] }): number {
  return db.complaints.filter((c) => !['Resolved', 'Closed'].includes(c.status)).length;
}