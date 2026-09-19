'use client';

import { motion } from 'framer-motion';
import { Star, Send, Sparkles } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { RatingPill } from '@/components/ui/stars';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { MEAL_SLOT_META } from '@/lib/data/seed-meals';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const TAGS = ['#Delicious', '#WellCooked', '#TooOily', '#LessSalt', '#Cold', '#GreatValue', '#Spicy', '#Fresh'];

export default function RatePage() {
  const db = useDb();
  const toast = useToast();
  const { t } = useLang();

  const today = db.week[0];
  const selectable = today.meals.filter((m) => m.status !== 'done' || m.ratings === null);
  const [mealId, setMealId] = React.useState(selectable[0]?.id ?? today.meals[0].id);
  const [hygiene, setHygiene] = React.useState(0);
  const [taste, setTaste] = React.useState(0);
  const [temp, setTemp] = React.useState(0);
  const [tags, setTags] = React.useState<string[]>([]);
  const [done, setDone] = React.useState(false);

  const meal = today.meals.find((m) => m.id === mealId);

  function toggleTag(tag: string) {
    setTags(tags.includes(tag) ? tags.filter((x) => x !== tag) : [...tags, tag]);
  }

  function submit() {
    if (!mealId) return;
    const txn = db.rateMeal(mealId, {
      hygiene, taste, temperature: temp, tags
    });
    setDone(true);
    toast.push({
      title: t('rating.submitted'),
      body: `+${txn?.points ?? 10} ${t('rating.reward')}`,
      tone: 'reward'
    });
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('rating.title')}</h1>
        <p className="mt-1 text-slate-500">{t('rating.tagsHint')}.</p>
      </motion.div>

      <Card className="mt-6 p-6">
        <CardHeader title="Which meal?" sub="Pick a slot to review" icon={<Star className="h-5 w-5" />} />
        <div className="mt-3 flex flex-wrap gap-2">
          {today.meals.map((m) => (
            <button
              key={m.id}
              onClick={() => setMealId(m.id)}
              className={cn(
                'rounded-xl border px-3 py-2 text-xs font-semibold transition',
                mealId === m.id ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              )}
              aria-pressed={mealId === m.id}
            >
              {MEAL_SLOT_META[m.slot].emoji} {m.label}
            </button>
          ))}
        </div>

        {done ? (
          <div className="mt-6 rounded-2xl border border-success-200 bg-success-50 p-5 text-center">
            <span className="text-4xl">🌟</span>
            <p className="mt-1 text-lg font-bold text-success-700">{t('rating.submitted')}</p>
            <p className="text-sm text-success-700">+10 {t('common.points')} · {hygiene}/5 ⭐ · {taste}/5 ⭐ · {temp}/5 ⭐</p>
            <Button variant="outline" className="mt-3" onClick={() => setDone(false)}>Rate another meal</Button>
          </div>
        ) : (
          <>
            <div className="mt-5 space-y-3">
              <RatingPill label={t('rating.hygiene')} value={hygiene} onChange={setHygiene} />
              <RatingPill label={t('rating.taste')} value={taste} onChange={setTaste} />
              <RatingPill label={t('rating.temperature')} value={temp} onChange={setTemp} />
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[11px] font-semibold transition',
                    tags.includes(tag) ? 'border-brand-400 bg-brand-100 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  )}
                  aria-pressed={tags.includes(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>

            <Button type="button" variant="success" size="lg" className="mt-5 w-full" onClick={submit} disabled={!hygiene || !taste || !temp}>
              <Send className="h-4 w-4" aria-hidden="true" /> {t('common.submit')} · +10 {t('common.points')}
            </Button>
          </>
        )}

        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> {t('rating.reward')} eco points for genuine, verified feedback.
        </p>
      </Card>
    </div>
  );
}