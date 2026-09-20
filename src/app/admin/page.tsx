'use client';

import { motion } from 'framer-motion';
import { Building2, Gift, TrendingUp, ScrollText, Landmark, BarChart3 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { StatTile } from '@/components/portal/stat';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { useCollegeRegistry } from '@/lib/college-registry';

/**
 * Admin Command Center overview (4-tier architecture).
 * Strictly Super-Admin / Developer controls: platform KPIs, college registry,
 * reward engine queue and diagnostics. Operational warden/mess tasks (complaint
 * triage, gate passes, headcount) live in the Management Desk portal.
 */
export default function AdminHome() {
  const db = useDb();
  const registry = useCollegeRegistry();
  const { t } = useLang();

  const today = db.week[0];
  const live = today?.meals.find((m) => m.status === 'active') ?? today?.meals[1];
  const wastage = live?.participating ? Math.max(4, Math.round(live.participating * 0.04)) : 0;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('admin.title')}</h1>
        <p className="mt-1 text-slate-500">{t('admin.greeting', { date: today.date, slot: live?.slot ?? '-' })}</p>
      </motion.div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Building2 className="h-4 w-4" />} label="Colleges registered" value={registry.colleges.length} sub={`${registry.pending.length} pending approval`} tone="brand" href="/admin/colleges" />
        <StatTile icon={<Landmark className="h-4 w-4" />} label="Properties live" value={db.branches.length} sub="multi-branch setup" tone="violet" href="/admin/branches" />
        <StatTile icon={<Gift className="h-4 w-4" />} label="Rewards pending" value="3" sub="approval queue" tone="success" href="/admin/rewards" />
        <StatTile icon={<BarChart3 className="h-4 w-4" />} label="Wastage risk" value={`~${wastage} kg`} sub="est. for this slot" tone="amber" href="/admin/analytics" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <CardHeader title="Budget today" sub="Spend vs allocation" icon={<TrendingUp className="h-5 w-5" />} action={<Badge tone="amber" dot>Live</Badge>} />
          <div className="mt-4">
            <p className="text-3xl font-black text-slate-900">&#8377;14,208</p>
            <p className="text-xs text-slate-400">of &#8377;18,500 daily mess budget</p>
            <div className="mt-3">
              <Progress value={14208} max={18500} tone="brand" label="budget" />
            </div>
            <p className="mt-2 text-xs text-success-600">&#8593; 6% under budget thanks to 512 early opt-outs this week.</p>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title="Platform registry" sub="Colleges & approvals" icon={<Building2 className="h-5 w-5" />} action={<a href="/admin/colleges" className="text-xs font-semibold text-brand-600">{t('common.viewAll')} &rarr;</a>} />
          <ul className="mt-3 divide-y">
            {registry.colleges.slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-center gap-2 py-2">
                <Badge tone={c.status === 'pending' ? 'amber' : 'success'} dot>
                  {c.status === 'pending' ? 'Pending' : 'Approved'}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{c.name}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-slate-400">New colleges appear at student sign-in the moment they are approved.</p>
        </Card>

        <Card className="p-5">
          <CardHeader title="Diagnostics" sub="System health" icon={<ScrollText className="h-5 w-5" />} action={<a href="/admin/logs" className="text-xs font-semibold text-brand-600">{t('common.viewAll')} &rarr;</a>} />
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"><span>API latency (p95)</span><span className="font-bold text-success-600">142 ms</span></li>
            <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"><span>Background jobs</span><span className="font-bold text-success-600">All clear</span></li>
            <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"><span>Failed logins (24h)</span><span className="font-bold text-amber-600">7</span></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
