'use client';

import { Sparkles, Star, UtensilsCrossed, BedDouble, MapPin } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn, formatNum } from '@/lib/utils';
import { useLang } from '@/i18n';
import type { Branch } from '@/types';

/** Deterministic gradient so a photo-less branch still reads as a real listing. */
const GRADIENTS = [
  'from-brand-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-sky-500 to-indigo-600',
  'from-rose-400 to-pink-600'
];

export function gradientFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return GRADIENTS[h % GRADIENTS.length];
}

export interface BranchStats {
  vacant: number;
  total: number;
  fromFee: number;
}

export function HostelCard({ branch, stats, onBook, booking = false }: {
  branch: Branch;
  stats: BranchStats;
  onBook: (branch: Branch) => void;
  booking?: boolean;
}) {
  const { t, tr } = useLang();
  const cover = branch.photos[0];
  const soldOut = stats.vacant <= 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift transition hover:-translate-y-0.5 hover:border-brand-300">
      <div className={cn('relative h-40 bg-gradient-to-br', gradientFor(branch.id))}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={branch.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="grid h-full w-full place-items-center text-5xl" aria-hidden="true">🏠</span>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {branch.sponsored && (
            <Badge tone="violet">
              <Sparkles className="h-3 w-3" aria-hidden="true" /> {t('market.sponsored')}
            </Badge>
          )}
          <Badge tone="white">{branch.gender}</Badge>
        </div>

        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-slate-800">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
          {branch.rating.toFixed(1)}
          <span className="font-medium text-slate-400">({branch.reviews})</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold text-slate-900">{branch.name}</h3>
        <p className="mt-0.5 flex items-start gap-1 text-xs text-slate-500">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          {branch.address}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
            <UtensilsCrossed className="h-3 w-3" aria-hidden="true" /> {tr(branch.food)} · {branch.mealsPerDay} {t('market.meals')}
          </span>
          <span className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
            soldOut ? 'bg-rose-100 text-rose-700' : 'bg-success-100 text-success-700'
          )}>
            <BedDouble className="h-3 w-3" aria-hidden="true" /> {stats.vacant}/{stats.total}
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {branch.amenities.slice(0, 3).map((a) => (
            <span key={a} className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              {tr(a)}
            </span>
          ))}
          {branch.amenities.length > 3 && (
            <span className="px-1 py-0.5 text-[10px] font-semibold text-slate-400">+{branch.amenities.length - 3}</span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{t('market.from')}</p>
            <p className="text-xl font-black text-slate-900">
              ₹{formatNum(stats.fromFee)}
              <span className="text-xs font-semibold text-slate-400">{t('market.perMonth')}</span>
            </p>
          </div>
          <button
            onClick={() => onBook(branch)}
            disabled={soldOut || booking}
            className={cn(
              'rounded-xl px-3.5 py-2.5 text-xs font-semibold transition',
              soldOut || booking
                ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                : 'bg-brand-600 text-white shadow-soft hover:bg-brand-700 active:scale-[.98]'
            )}
          >
            {t('market.bookToken')}
          </button>
        </div>
      </div>
    </article>
  );
}