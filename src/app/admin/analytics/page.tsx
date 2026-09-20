'use client';

import { motion } from 'framer-motion';
import { BarChart3, BedDouble, Leaf, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { StatTile } from '@/components/portal/stat';
import { Progress } from '@/components/ui/progress';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { cn } from '@/lib/utils';

/**
 * Occupancy & food-wastage BI — the admin's decision screen. Two questions
 * answered from the live store: are beds earning, and is food rotting?
 * Charts are hand-rolled (div bars) so there's zero chart-library weight.
 */
export default function AnalyticsPage() {
  const db = useDb();
  const { t, n } = useLang();

  const totalBeds = db.beds.length;
  const booked = db.beds.filter((b) => b.status === 'Booked').length;
  const occupancy = totalBeds ? Math.round((booked / totalBeds) * 100) : 0;

  /* Plates skipped this week → food saved. One avoided plate ≈ 0.45 kg. */
  const skipped = db.week.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + m.optedOut, 0), 0);
  const savedKg = Math.round(skipped * 0.45);
  const eaten = db.week.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + m.participating, 0), 0);
  const wastageKg = Math.round(eaten * 0.04);

  const perBranch = db.branches
    .map((b) => {
      const beds = db.beds.filter((x) => x.branchId === b.id);
      const used = beds.filter((x) => x.status === 'Booked').length;
      return { id: b.id, name: b.name, used, total: beds.length, pct: beds.length ? Math.round((used / beds.length) * 100) : 0 };
    })
    .sort((a, b) => b.pct - a.pct);

  const maxSlot = Math.max(1, ...db.week.flatMap((d) => d.meals.map((m) => m.participating)));

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('analytics.title')}</h1>
        <p className="mt-1 text-slate-600">{t('analytics.sub')}</p>
      </motion.div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<BedDouble className="h-4 w-4" />} label={t('analytics.occupancy')} value={`${occupancy}%`} sub={`${booked}/${totalBeds} ${t('inventory.beds')}`} tone="brand" />
        <StatTile icon={<Leaf className="h-4 w-4" />} label={t('analytics.foodSaved')} value={`${n(savedKg)} kg`} sub={t('analytics.foodSavedSub')} tone="success" />
        <StatTile icon={<Trash2 className="h-4 w-4" />} label={t('analytics.wastage')} value={`${n(wastageKg)} kg`} sub={t('analytics.wastageSub')} tone="amber" />
        <StatTile icon={<TrendingDown className="h-4 w-4" />} label={t('analytics.platesSkipped')} value={n(skipped)} sub={t('analytics.platesSkippedSub')} tone="violet" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <CardHeader icon={<BedDouble className="h-5 w-5" />} title={t('analytics.occByBranch')} sub={t('analytics.occByBranchSub')} action={<Badge tone="brand" dot>{t('mgmt.live')}</Badge>} />
          <ul className="mt-5 space-y-4">
            {perBranch.map((b) => (
              <li key={b.id}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{b.name}</span>
                  <span className="font-mono font-bold text-slate-600">{b.used}/{b.total} · {b.pct}%</span>
                </div>
                <Progress value={b.used} max={b.total || 1} tone={b.pct >= 80 ? 'success' : b.pct >= 50 ? 'brand' : 'amber'} label={b.name} />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <CardHeader icon={<BarChart3 className="h-5 w-5" />} title={t('analytics.slotTrend')} sub={t('analytics.slotTrendSub')} />
          <div className="mt-6 flex h-44 items-end gap-2">
            {db.week.flatMap((day) =>
              day.meals.map((m) => (
                <div key={`${day.date}-${m.id}`} className="group relative flex-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(m.participating / maxSlot) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={cn(
                      'min-h-[8px] rounded-t-md transition',
                      m.status === 'active' ? 'bg-brand-500 group-hover:bg-brand-600' : 'bg-slate-300 group-hover:bg-slate-400'
                    )}
                  />
                  <div className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white group-hover:block">
                    {m.participating} · {m.slot}
                  </div>
                </div>
              ))
            )}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <TrendingUp className="h-3.5 w-3.5 text-success-500" aria-hidden="true" /> {t('analytics.trendNote')}
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <CardHeader icon={<Leaf className="h-5 w-5" />} title={t('analytics.ecoTitle')} sub={t('analytics.ecoSub')} />
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { label: t('analytics.kgSaved'), value: `${n(savedKg)} kg`, tone: 'text-success-600' },
              { label: t('analytics.rupeeSaved'), value: `₹${n(skipped * 60)}`, tone: 'text-brand-600' },
              { label: t('analytics.plateRate'), value: `${Math.round((skipped / Math.max(1, eaten + skipped)) * 100)}%`, tone: 'text-violet-600' }
            ].map((k) => (
              <div key={k.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
                <p className={cn('text-2xl font-black', k.tone)}>{k.value}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-600">{k.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader icon={<Trash2 className="h-5 w-5" />} title={t('analytics.topWaste')} sub={t('analytics.topWasteSub')} />
          <ul className="mt-3 divide-y">
            {db.week[0].meals.map((m) => (
              <li key={m.id} className="flex items-center gap-2 py-2 text-xs">
                <span className="min-w-0 flex-1 truncate font-bold capitalize text-slate-800">{m.slot}</span>
                <span className="text-slate-500">{m.optedOut} {t('analytics.skips')}</span>
                <span className="font-mono font-bold text-amber-600">~{Math.max(1, Math.round(m.participating * 0.04))} kg</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

