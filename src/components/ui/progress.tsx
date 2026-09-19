import * as React from 'react';
import { cn } from '@/lib/utils';

export function Progress({ value, max = 100, tone = 'brand', label, className, size = 'md' }: {
  value: number; max?: number; tone?: 'brand' | 'success' | 'amber' | 'rose' | 'violet'; label?: string; className?: string; size?: 'sm' | 'md';
}) {
  const pct = Math.round(clampPct(value, max));
  const bar = {
    brand: 'bg-gradient-to-r from-brand-500 to-brand-600',
    success: 'bg-gradient-to-r from-success-500 to-success-600',
    amber: 'bg-gradient-to-r from-amber-400 to-orange-500',
    rose: 'bg-gradient-to-r from-rose-500 to-rose-600',
    violet: 'bg-gradient-to-r from-violet-500 to-purple-600'
  }[tone];
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';
  return (
    <div className={cn('w-full', className)}>
      <div
        role="progressbar"
        aria-value-now={pct}
        aria-value-min={0}
        aria-value-max={100}
        aria-label={label}
        className={cn('relative overflow-hidden rounded-full bg-slate-100', h)}
      >
        <div className={cn('h-full rounded-full transition-all duration-500', bar)} style={{ width: `${pct}%` }}>
          {pct > 12 && <span className="sr-only">{pct}%</span>}
        </div>
      </div>
    </div>
  );
}

function clampPct(v: number, max: number): number {
  return Math.min(100, Math.max(0, (v / max) * 100));
}