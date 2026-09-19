'use client';

import { Trophy, Crown, Flame, Sparkles } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { cn } from '@/lib/utils';

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardPage() {
  const db = useDb();
  const { t } = useLang();
  const me = { rank: 11, name: t('leaderboard.meRow'), studentId: 'STU-23045', points: 490, streak: 6, badges: ['🌱', '🍽'] };

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
        <Trophy className="h-7 w-7 text-amber-500" aria-hidden="true" /> {t('leaderboard.title')}
      </h1>
      <p className="mt-1 text-slate-500">{t('leaderboard.sub')}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {db.leaderboard.slice(0, 3).map((p) => {
          const hue = p.rank === 1 ? 'violet' : p.rank === 2 ? 'brand' : 'sky';
          return (
            <div key={p.rank} className={cn('rounded-2xl border p-4 text-center shadow-soft', p.rank === 1 ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-white' : 'border-slate-200 bg-white')}>
              <span className="text-3xl">{MEDALS[p.rank]}</span>
              <Avatar name={p.name} tone={hue} size="lg" className="mt-2" />
              <p className="mt-1 font-bold text-slate-800">{p.name}</p>
              <p className="text-xs text-slate-400">{p.studentId}</p>
              <p className="mt-1 text-lg font-extrabold text-slate-900">{p.points} <span className="text-xs text-slate-400">{t('common.points')}</span></p>
              <p className="flex items-center gap-1 text-[11px] text-slate-400"><Flame className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" /> {p.streak}-{t('leaderboard.streak')}</p>
            </div>
          );
        })}
      </div>

      <Card className="mt-5 p-5">
        <CardHeader title={t('leaderboard.title')} sub={t('leaderboard.top8')} icon={<Trophy className="h-5 w-5" />} />
        <ul className="mt-3 divide-y">
          {db.leaderboard.map((p) => (
            <li key={p.studentId} className="flex items-center gap-3 py-2.5">
              <span className="w-8 text-center text-sm font-black text-slate-500">{MEDALS[p.rank] ?? p.rank}</span>
              <Avatar name={p.name} size="sm" tone="brand" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {p.name}
                  {p.badges.map((b) => <span key={b} className="ml-1">{b}</span>)}
                </p>
                <p className="text-[11px] text-slate-400">{p.studentId}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500"><Flame className="h-3.5 w-3.5 text-orange-400" aria-hidden="true" /> {p.streak}</span>
              <span className="text-sm font-bold text-slate-800">{p.points} {t('common.points')}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-5 p-5">
        <CardHeader title={t('leaderboard.you')} sub={t('leaderboard.keepStreak')} icon={<Sparkles className="h-5 w-5" />} />
        <div className="mt-3 flex items-center gap-3">
          <span className="w-8 text-center text-sm font-black text-brand-600">11</span>
          <Avatar name={me.name} size="sm" ring />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-brand-700">{me.name}</p>
            <p className="text-[11px] text-slate-400">{me.studentId} · {t('leaderboard.thisWeek')}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold text-slate-900">{me.points}</p>
            <p className="text-[11px] text-slate-400">{me.streak}-{t('leaderboard.streak')}</p>
          </div>
        </div>
        <Badge tone="brand" className="mt-3">{t('leaderboard.riseNote')}</Badge>
      </Card>
    </div>
  );
}