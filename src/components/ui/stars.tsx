'use client';

import { Star } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export function Stars({ value, onChange, label, className }: {
  value: number; onChange?: (v: number) => void; label: string; className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1', className)} role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value >= star}
          aria-label={`${star} of 5`}
          onClick={() => onChange?.(star)}
          className={cn(
            'grid h-9 w-9 place-items-center rounded-lg transition-transform hover:scale-110 active:scale-95',
            value >= star ? 'text-amber-400' : 'text-slate-300'
          )}
        >
          <Star className={cn('h-6 w-6', value >= star && 'fill-amber-300')} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

export function RatingPill({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <Stars value={value} onChange={onChange} label={label} />
    </div>
  );
}