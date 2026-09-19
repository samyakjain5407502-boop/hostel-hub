import * as React from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'slate' | 'brand' | 'success' | 'amber' | 'rose' | 'violet' | 'sky' | 'white';

const TONES: Record<BadgeTone, string> = {
  slate: 'bg-slate-100 text-slate-600',
  brand: 'bg-brand-100 text-brand-700',
  success: 'bg-success-100 text-success-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  violet: 'bg-violet-100 text-violet-700',
  sky: 'bg-sky-100 text-sky-700',
  white: 'border border-slate-200 bg-white text-slate-600'
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Adds a leading status dot that inherits the badge colour. */
  dot?: boolean;
}

export function Badge({ className, tone = 'slate', dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', TONES[tone], className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}