'use client';

import { Gift, Radar, Megaphone, Sparkles, Users } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { StatTile } from '@/components/portal/stat';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { inputBase } from '@/components/ui/field';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const PRESETS = [
  { points: 25, label: 'All early opt-outs get +25 eco points 🎉', tone: 'success' as const },
  { points: 30, label: 'Surprise drop — everyone eating dinner +30 🍛', tone: 'violet' as const },
  { points: 40, label: 'Maintenance reporters bonus +40 🔧', tone: 'amber' as const }
];

export default function AdminRewards() {
  const db = useDb();
  const toast = useToast();
  const { t } = useLang();
  const [points, setPoints] = React.useState('25');
  const [label, setLabel] = React.useState('');

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
        <Radar className="h-7 w-7 text-violet-600" aria-hidden="true" /> {t('nav.rewardsAdmin')}
      </h1>
      <p className="mt-1 text-slate-500">Approve bonus points and broadcast surprise reward drops.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatTile icon={<Users className="h-4 w-4" />} label="Active students" value="512" sub="online now: 287" tone="brand" />
        <StatTile icon={<Sparkles className="h-4 w-4" />} label="Points given (7d)" value="3,240" sub="+18% vs last week" tone="success" />
        <StatTile icon={<Gift className="h-4 w-4" />} label="Perks redeemed" value="96" sub="week-to-date" tone="violet" />
      </div>

      <Card className="mt-6 p-5">
        <CardHeader title="Broadcast reward" sub="Send points to a segment" icon={<Megaphone className="h-5 w-5" />} action={<Badge tone="violet" dot>Warden only</Badge>} />
        <div className="mt-4 space-y-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => { setLabel(p.label); setPoints(String(p.points)); }}
              className={cn('flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left text-sm text-slate-700 transition hover:bg-brand-50', label === p.label ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-white')}
              aria-pressed={label === p.label}
            >
              <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-500" aria-hidden="true" /> {p.label}</span>
              <Badge tone={p.tone}>+{p.points}</Badge>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div>
            <span className="mb-0.5 block text-xs font-semibold text-slate-600">Points</span>
            <input className={inputBase} type="number" min={1} max={500} value={points} onChange={(e) => setPoints(e.target.value)} aria-label="Points" />
          </div>
          <div>
            <span className="mb-0.5 block text-xs font-semibold text-slate-600">Message</span>
            <input className={inputBase} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. +20 eco for opting out" aria-label="Message" />
          </div>
        </div>

        <Button
          variant="warden"
          size="lg"
          className="mt-5 w-full"
          disabled={!label || !points}
          onClick={() => {
            db.broadcast(Number(points) || 10, label);
            toast.push({ title: 'Reward broadcast 💜', body: `+${points} points sent to all active students.`, tone: 'reward' });
            setLabel('');
          }}
        >
          <Megaphone className="h-4 w-4" aria-hidden="true" /> {t('admin.broadcast')} · +{points || 0}
        </Button>
      </Card>

      <Card className="mt-6 p-5">
        <CardHeader title="Recent broadcasts" sub="Approval log" icon={<Radar className="h-5 w-5" />} />
        <ul className="mt-3 divide-y">
          {db.rewards.slice(0, 5).map((r) => (
            <li key={r.id} className="flex items-center py-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600"><Gift className="h-4.5 w-4.5" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1 pl-3">
                <p className="truncate text-sm text-slate-700">{r.label}</p>
                <p className="text-[11px] text-slate-400">{r.meta}</p>
              </div>
              <span className="text-sm font-bold text-success-600">+{r.points}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}