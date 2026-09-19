'use client';

import { motion } from 'framer-motion';
import { Users, TrendingUp, Utensils, AlertTriangle } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { StatTile } from '@/components/portal/stat';
import { Progress } from '@/components/ui/progress';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { HeadcountDonut } from '@/components/admin/headcount-donut';

const SLOTS = [
  { name: 'Breakfast', eating: 328, optedOut: 41 },
  { name: 'Lunch (active)', eating: 402, optedOut: 58 },
  { name: 'Snacks', eating: 233, optedOut: 72 },
  { name: 'Dinner', eating: 372, optedOut: 49 }
];

export default function HeadcountPage() {
  const db = useDb();
  const { t } = useLang();
  const seated = 512;
  const peak = SLOTS[1];
  const eatingNow = peak.eating;
  const wastage = Math.round(eatingNow * 0.04);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
          <Users className="h-7 w-7 text-success-600" aria-hidden="true" /> {t('admin.headcount.title')}
        </h1>
        <p className="mt-1 text-slate-500">Real-time kitchen occupancy · opt-in vs opt-out · wastage control.</p>
      </motion.div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Users className="h-4 w-4" />} label={t('admin.eatingNow')} value={eatingNow} sub="Lunch slot" tone="success" />
        <StatTile icon={<Utensils className="h-4 w-4" />} label={t('admin.optedOut')} value="220" sub="across all slots" tone="sky" />
        <StatTile icon={<AlertTriangle className="h-4 w-4" />} label={t('admin.noShow')} value="~11" sub="est. no-shows" tone="amber" />
        <StatTile icon={<TrendingUp className="h-4 w-4" />} label={t('admin.wastage')} value={`~${wastage} kg`} sub="est. this slot" tone="rose" />
      </div>

      <Card className="mt-6 p-5">
        <CardHeader title={t('admin.headcount.title')} sub="Live occupancy" icon={<Users className="h-5 w-5" />} />
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <HeadcountDonut eating={eatingNow} seated={seated} size={150} />
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2 text-slate-700"><span className="h-3 w-3 rounded-sm bg-success-500" /> {eatingNow} eating now</p>
            <p className="flex items-center gap-2 text-slate-700"><span className="h-3 w-3 rounded-sm bg-sky-400" /> {seated - eatingNow - 85} seats free</p>
            <p className="flex items-center gap-2 text-slate-700"><span className="h-3 w-3 rounded-sm bg-rose-400" /> {85} unregistered walk-ins</p>
          </div>
          <div className="ml-auto rounded-xl border border-success-200 bg-success-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Food prepared</p>
            <p className="text-2xl font-extrabold text-success-700">{eatingNow + 28} plates</p>
            <p className="text-[11px] text-success-700">✓ +28 buffer · 0 over-cook</p>
          </div>
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <CardHeader title="Per-slot headcount" sub="Opt-in vs opt-out (today)" icon={<Utensils className="h-5 w-5" />} />
        <div className="mt-4 space-y-4">
          {SLOTS.map((s) => {
            const pct = (s.eating / seated) * 100;
            return (
              <div key={s.name} className="flex items-center gap-3">
                <span className="w-28 text-xs font-semibold text-slate-600">{s.name}</span>
                <div className="flex h-3 flex-1 overflow-hidden rounded-full bg-transparent">
                  <div className="h-3 bg-gradient-to-r from-success-400 to-success-500" style={{ width: `${pct}%` }} title={`${s.eating} eating`} />
                  <div className="h-3 bg-rose-300" style={{ width: `${(s.optedOut / seated) * 100}%` }} title={`${s.optedOut} opted out`} />
                </div>
                <span className="w-24 text-right text-[11px] text-slate-500">{s.eating} · {s.optedOut} out</span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-slate-400">Prep ratio shown for kitchen planning — opt-outs reduce cooking volume in real time.</p>
      </Card>
    </div>
  );
}