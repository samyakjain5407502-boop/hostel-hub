'use client';

import { Filter } from 'lucide-react';
import * as React from 'react';
import { cn, formatNum } from '@/lib/utils';
import { useLang } from '@/i18n';
import type { Branch } from '@/types';

const GENDERS = ['All', 'Girls', 'Boys', 'Open to All'];
const FOODS = ['All', 'Jain', 'Pure Veg', 'Non-Veg'];
const BEDS = ['All', '1-Bed', '2-Bed', '3-Bed', '4-Bed'];

/** Compact filter bar used by the public directory. */
export function DirectoryFilters({
  query, onQuery, gender, onGender, food, onFood, budget, onBudget, bed, onBed, count
}: {
  query: string; onQuery: (v: string) => void;
  gender: string; onGender: (v: string) => void;
  food: string; onFood: (v: string) => void;
  budget: number; onBudget: (v: number) => void;
  bed: string; onBed: (v: string) => void;
  count: number;
}) {
  const { t } = useLang();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lift">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Filter className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
        {t('market.results', { n: count })}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={t('market.search')}
            aria-label={t('market.search')}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <Pill label={t('market.filterGender')} options={GENDERS} value={gender} onChange={onGender} allLabel={t('market.all')} />
        <Pill label={t('market.filterFood')} options={FOODS} value={food} onChange={onFood} allLabel={t('market.all')} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Pill label={t('market.filterBed')} options={BEDS} value={bed} onChange={onBed} allLabel={t('market.all')} />
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{t('market.filterBudget')}</span>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={3000}
              max={20000}
              step={500}
              value={budget}
              onChange={(e) => onBudget(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-brand-600"
              aria-label={t('market.filterBudget')}
            />
            <span className="shrink-0 text-xs font-bold text-slate-700">₹{formatNum(budget)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ label, options, value, onChange, allLabel }: {
  label: string; options: string[]; value: string;
  onChange: (v: string) => void; allLabel: string;
}) {
  return (
    <div>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            aria-pressed={value === o}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition',
              value === o
                ? 'border-brand-400 bg-brand-50 text-brand-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            )}
          >
            {o === 'All' ? allLabel : o}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Shared filter state + memoised result set for the directory. */
export function useHostelFilters(branches: Branch[]) {
  const [query, setQuery] = React.useState('');
  const [gender, setGender] = React.useState('All');
  const [food, setFood] = React.useState('All');
  const [bed, setBed] = React.useState('All');
  const [budget, setBudget] = React.useState(20000);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return branches.filter((b) => {
      if (q && !`${b.name} ${b.address} ${b.food}`.toLowerCase().includes(q)) return false;
      if (gender !== 'All' && b.gender !== gender) return false;
      if (food !== 'All' && b.food !== food) return false;
      if (bed !== 'All' && !b.roomFees.some((r) => r.config === bed)) return false;
      const cheapest = b.roomFees.length ? Math.min(...b.roomFees.map((r) => r.monthlyFee)) : Number.POSITIVE_INFINITY;
      return cheapest <= budget;
    });
  }, [branches, query, gender, food, bed, budget]);

  return { query, setQuery, gender, setGender, food, setFood, bed, setBed, budget, setBudget, filtered };
}
