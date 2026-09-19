'use client';

import { motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, UtensilsCrossed, Vote } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { MealCard } from '@/components/portal/meal-card';
import { Badge } from '@/components/ui/badge';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { TODAY_KEY } from '@/lib/data/seed-meals';
import { cn } from '@/lib/utils';

export default function MessPage() {
  const db = useDb();
  const { t } = useLang();
  const [dayIdx, setDayIdx] = React.useState(0);
  const week = db.week;
  const day = week[Math.min(dayIdx, week.length - 1)];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-2xl font-extrabold text-slate-900">{render(week[0].date)} · {t('meals.title')}</h1>
        <p className="mt-1 text-slate-500">{t('meals.optOutDone')}</p>
      </motion.div>

      {/* Day switcher */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button onClick={() => setDayIdx(Math.max(0, dayIdx - 1))} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 disabled" disabled={dayIdx === 0} aria-label="Previous day">
          <ChevronLeft className="h-4.5 w-4.5" aria-hidden="true" />
        </button>
        {week.map((d, i) => (
          <button
            key={d.date}
            onClick={() => setDayIdx(i)}
            className={cn(
              'shrink-0 rounded-xl border px-3.5 py-2 text-xs font-semibold transition',
              i === dayIdx ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            )}
            aria-pressed={i === dayIdx}
          >
            {d.date === TODAY_KEY ? t('common.today') : shortDay(d.date)}
          </button>
        ))}
        <button onClick={() => setDayIdx(Math.min(week.length - 1, dayIdx + 1))} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500" disabled={dayIdx >= week.length - 1} aria-label="Next day">
          <ChevronRight className="h-4.5 w-4.5" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {day.meals.map((m) => <MealCard key={m.id} meal={m} />)}
      </div>

      <PollSection />
    </div>
  );
}

function PollSection() {
  const db = useDb();
  const { t } = useLang();
  const poll = db.poll;
  const total = poll.options.reduce((a, b) => a + b.votes, 0);

  return (
    <Card id="poll" className="mt-6 p-5">
      <CardHeader title="Weekly Special · Vote" sub="Weekend dish poll — closes in 2 days" icon={<Vote className="h-5 w-5" />} action={<Badge tone="success" dot>Open</Badge>} />
      <p className="mt-1 text-sm text-slate-500">{poll.titleKey}</p>
      <div className="mt-4 space-y-3">
        {poll.options.map((o) => {
          const pct = total ? Math.round((o.votes / total) * 100) : 0;
          const voted = poll.userVoted === o.id;
          return (
            <button
              key={o.id}
              onClick={() => db.votePoll(o.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left transition',
                voted ? 'border-success-300 bg-success-50' : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50'
              )}
              aria-pressed={voted}
            >
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="text-xl" aria-hidden="true">{o.emoji}</span>
                {o.dish}
              </span>
              <span className="flex items-center gap-1.5">
                {voted && <Badge tone="success">✓ Vote</Badge>}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{pct}%</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-400">✓ {total} votes cast · Warden reviews results on Sunday.</p>
    </Card>
  );
}

function render(date: string): string {
  const d = new Date(date + 'T00:00:00');
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
  return d.toLocaleDateString('en-IN', options);
}
function shortDay(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
}