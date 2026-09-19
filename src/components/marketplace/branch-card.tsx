'use client';

import { motion } from 'framer-motion';
import { BedDouble, MapPin, Star, UtensilsCrossed, Sparkles, ShieldCheck } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLang, TKey } from '@/i18n';
import { cn, formatNum } from '@/lib/utils';
import type { Branch } from '@/types';

const GENDER_TONE: Record<Branch['gender'], 'rose' | 'sky' | 'violet'> = {
  Girls: 'rose',
  Boys: 'sky',
  'Open to All': 'violet'
};

const FOOD_TONE: Record<Branch['food'], 'success' | 'amber' | 'rose'> = {
  Jain: 'success',
  'Pure Veg': 'success',
  'Non-Veg': 'rose'
};

export function BranchCard({
  branch, bedsOpen, index = 0, onBook
}: {
  branch: Branch;
  /** Vacant beds left in this branch, so students see live availability. */
  bedsOpen: number;
  index?: number;
  onBook: (branch: Branch) => void;
}) {
  const { t } = useLang();
  const cheapest = cheapestFee(branch);
  const soldOut = bedsOpen === 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.3) }}
      className={cn(
        'flex flex-col rounded-2xl border bg-white shadow-lift transition hover:-translate-y-0.5',
        branch.sponsored ? 'border-brand-300 ring-1 ring-brand-100' : 'border-slate-200'
      )}
    >
      {/* Photo gallery strip — seeded branches ship without image assets, so the
          strip degrades into a branded gradient rather than a broken image. */}
      <div className="relative h-32 overflow-hidden rounded-t-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600">
        {branch.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branch.photos[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full place-items-center text-white/85">
            <BedDouble className="h-10 w-10" aria-hidden="true" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge tone={GENDER_TONE[branch.gender]}>{t(`tag.${branch.gender}` as TKey)}</Badge>
          <Badge tone={FOOD_TONE[branch.food]}>{t(`tag.${branch.food}` as TKey)}</Badge>
        </div>
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-slate-700">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
          {branch.rating.toFixed(1)}
          <span className="font-medium text-slate-400">({formatNum(branch.reviews)})</span>
        </span>
        {branch.sponsored && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-slate-900/85 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
            <Sparkles className="h-3 w-3 text-amber-300" aria-hidden="true" />
            {t('market.sponsored')}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold text-slate-900">{branch.name}</h3>
        <p className="mt-0.5 flex items-start gap-1 text-xs text-slate-500">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {branch.address}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
          <span className="inline-flex items-center gap-1">
            <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden="true" />
            {branch.mealsPerDay} {t('market.meals')}
          </span>
          <span className="inline-flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" aria-hidden="true" />
            {bedsOpen} {t('market.bedsOpen')}
          </span>
        </div>

        {branch.amenities.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {branch.amenities.slice(0, 4).map((a) => (
              <li key={a} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {t(a as TKey)}
              </li>
            ))}
            {branch.amenities.length > 4 && (
              <li className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                +{branch.amenities.length - 4}
              </li>
            )}
          </ul>
        )}

        {/* Tier-based fee table (1-Bed → 4-Bed) */}
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-dashed border-slate-200 pt-3">
          {branch.roomFees.map((fee) => (
            <div key={fee.config} className="flex items-baseline justify-between gap-2">
              <dt className="text-[11px] font-medium text-slate-500">{t(`tag.${fee.config}` as TKey)}</dt>
              <dd className="text-[11px] font-bold text-slate-700">₹{formatNum(fee.monthlyFee)}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex items-end justify-between gap-3">
          <p className="leading-tight">
            <span className="text-[11px] text-slate-400">{t('market.from')} </span>
            <span className="text-lg font-extrabold text-slate-900">₹{formatNum(cheapest)}</span>
            <span className="text-[11px] text-slate-400">{t('market.perMonth')}</span>
          </p>
          <Button size="sm" variant={soldOut ? 'outline' : 'primary'} disabled={soldOut} onClick={() => onBook(branch)}>
            {soldOut ? <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            {soldOut ? t('market.soldOut') : t('market.bookToken')}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

function cheapestFee(branch: Branch): number {
  if (!branch.roomFees.length) return 0;
  return Math.min(...branch.roomFees.map((f) => f.monthlyFee));
}