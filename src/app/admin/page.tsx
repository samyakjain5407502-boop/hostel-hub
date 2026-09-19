'use client';

import { motion } from 'framer-motion';
import { Users, Utensils, LifeBuoy, Gift, CalendarClock, TrendingUp } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { StatTile } from '@/components/portal/stat';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { HeadcountDonut } from '@/components/admin/headcount-donut';
import { AdminPollMini } from '@/components/admin/poll-mini';

export default function AdminHome() {
  const db = useDb();
  const { t } = useLang();

  const today = db.week[0];
  const live = today?.meals.find((m) => m.status === 'active') ?? today?.meals[1];
  const openComplaints = db.complaints.filter((c) => !['Resolved', 'Closed'].includes(c.status)).length;
  const urgent = db.complaints.filter((c) => c.priority === 'Urgent' && !['Resolved', 'Closed'].includes(c.status)).length;
  const seated = 512;
  const optedOut = live?.optedOut ?? 0;
  const eating = live?.participating ?? 0;
  const wastage = eating ? Math.max(4, Math.round(eating * 0.04)) : 0;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('admin.title')}</h1>
        <p className="mt-1 text-slate-500">{t('admin.greeting', { date: today.date, slot: live?.slot ?? '—' })}</p>
      </motion.div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Users className="h-4 w-4" />} label={t('admin.eatingNow')} value={eating} sub={`${optedOut} ${t('admin.optedOut').toLowerCase()}`} tone="success" href="/admin/headcount" />
        <StatTile icon={<Utensils className="h-4 w-4" />} label="Wastage risk" value={`~${wastage} kg`} sub="est. for this slot" tone="amber" />
        <StatTile icon={<LifeBuoy className="h-4 w-4" />} label={t('admin.openComplaints')} value={openComplaints} sub={`${urgent} urgent`} tone="rose" href="/admin/complaints" />
        <StatTile icon={<Gift className="h-4 w-4" />} label="Rewards pending" value="3" sub="approval queue" tone="violet" href="/admin/rewards" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <HeadcountCard eating={eating} optedOut={optedOut} seated={seated} />

        <Card className="p-5">
          <CardHeader title="Budget today" sub="Spend vs allocation" icon={<TrendingUp className="h-5 w-5" />} action={<Badge tone="amber" dot>Live</Badge>} />
          <div className="mt-4">
            <p className="text-3xl font-black text-slate-900">₹14,208</p>
            <p className="text-xs text-slate-400">of ₹18,500 daily mess budget</p>
            <div className="mt-3">
              <Progress value={14208} max={18500} tone="brand" label="budget" />
            </div>
            <p className="mt-2 text-xs text-success-600">↑ 6% under budget thanks to 512 early opt-outs this week.</p>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title="Live triage" sub="Urgent queue" icon={<LifeBuoy className="h-5 w-5" />} action={<a href="/admin/complaints" className="text-xs font-semibold text-brand-600">{t('common.viewAll')} →</a>} />
          <ul className="mt-3 divide-y">
            {db.complaints.filter((c) => c.status !== 'Closed').slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-center gap-2 py-2">
                <Badge tone={c.priority === 'Urgent' ? 'rose' : 'slate'}>{c.priority}</Badge>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{c.title}</span>
                <span className="text-[11px] text-slate-400">{c.status}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400"><CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> SLA timers auto-assign reminders at 70% elapsed.</p>
        </Card>
      </div>

      <AdminPollMini />
    </div>
  );
}

function HeadcountCard({ eating, optedOut, seated }: { eating: number; optedOut: number; seated: number }) {
  const { t } = useLang();
  return (
    <Card className="p-5">
      <CardHeader title={t('admin.headcount.title')} sub="Current meal slot" icon={<Users className="h-5 w-5" />} action={<Badge tone="success" dot>● Live</Badge>} />
      <div className="mt-3 flex items-center gap-4">
        <HeadcountDonut eating={eating} seated={seated} size={116} />
        <div>
          <p className="text-2xl font-extrabold text-slate-900">{eating}</p>
          <p className="text-xs text-slate-400">{t('admin.eatingNow')}</p>
          <p className="mt-1 text-lg font-bold text-success-600">{optedOut}</p>
          <p className="text-xs text-slate-400">{t('admin.optedOut')}</p>
        </div>
      </div>
    </Card>
  );
}