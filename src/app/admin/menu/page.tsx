'use client';

import { motion } from 'framer-motion';
import { CalendarDays, Utensils, BarChart3, Plus, Send } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { useToast } from '@/components/ui/toast';
import { PollChart } from '@/components/admin/poll-chart';
import { cn } from '@/lib/utils';

const SLOTS = ['breakfast', 'lunch', 'snacks', 'dinner'];

export default function AdminMenu() {
  const db = useDb();
  const toast = useToast();
  const { t } = useLang();
  const [dayIdx, setDayIdx] = React.useState(0);
  const week = db.week;
  const day = week[Math.min(dayIdx, week.length - 1)];

  const [newDish, setNewDish] = React.useState('');
  const [newEmoji, setNewEmoji] = React.useState('🍛');

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
          <CalendarDays className="h-7 w-7 text-brand-600" aria-hidden="true" /> {t('nav.menuAdmin')}
        </h1>
        <p className="mt-1 text-slate-500">7-day dynamic schedule planner · publish to student feeds instantly.</p>
      </motion.div>

      <div className="mt-4 no-scrollbar flex gap-2 overflow-x-auto">
        {week.map((d, i) => (
          <button
            key={d.date}
            onClick={() => setDayIdx(i)}
            className={cn('rounded-xl border px-3.5 py-2 text-xs font-semibold transition', i === dayIdx ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100')}
            aria-pressed={i === dayIdx}
          >
            {d.date}
          </button>
        ))}
      </div>

      <Card className="mt-5 p-5">
        <CardHeader title={`Day ${dayIdx + 1} — ${day.date}`} sub="Meal schedule & menu items" icon={<Utensils className="h-5 w-5" />} action={<Badge tone="amber" dot>Draft</Badge>} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {day.meals.map((m) => (
            <div key={m.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold capitalize text-slate-700">{m.slot}</span>
                <Badge tone={m.status === 'active' ? 'success' : 'white'}>{m.status}</Badge>
              </div>
              <p className="text-[11px] text-slate-400">{m.time}</p>
              <ul className="mt-2 list-disc pl-4 text-sm text-slate-600">
                {m.items.map((it) => <li key={it}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <Button variant="success" className="mt-4" onClick={() => toast.push({ title: 'Menu published', body: 'Students were notified instantly.', tone: 'success' })}>
          <Send className="h-4 w-4" aria-hidden="true" /> {t('admin.publishMenu')}
        </Button>
      </Card>

      <Card className="mt-6 p-5">
        <CardHeader title={t('admin.pollAnalytics')} sub="Weekend special — live votes" icon={<BarChart3 className="h-5 w-5" />} action={db.poll && <Badge tone="success" dot>Live</Badge>} />
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <PollChart data={db.poll.options.map((o) => ({ label: `${o.emoji} ${o.dish}`, votes: o.votes }))} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">{t('admin.addOption')}</p>
            <div className="mt-2 flex gap-2">
              <Input value={newDish} onChange={(e) => setNewDish(e.target.value)} placeholder="Dish (e.g. Paneer Tikka)" aria-label="Dish name" />
              <Input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} className="w-16" aria-label="Emoji" />
            </div>
            <Button variant="primary" className="mt-2" disabled={!newDish} onClick={() => { db.addPollOption(newDish.trim(), newEmoji || '🍛'); setNewDish(''); toast.push({ title: 'Option added to poll', tone: 'info' }); }}>
              <Plus className="h-4 w-4" aria-hidden="true" /> {t('admin.addOption')}
            </Button>
            <p className="mt-3 text-[11px] text-slate-500">Students can vote for the weekend special from their Mess page.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}