import * as React from 'react';
import { cn } from '@/lib/utils';

const HUES: Record<'brand' | 'success' | 'amber' | 'violet' | 'sky' | 'rose', string> = {
  brand: 'from-brand-500 to-brand-700',
  success: 'from-success-500 to-success-700',
  amber: 'from-amber-400 to-orange-600',
  violet: 'from-violet-500 to-purple-700',
  sky: 'from-sky-400 to-sky-600',
  rose: 'from-rose-400 to-rose-600'
};

export function Avatar({ name, tone = 'brand', size = 'md', emoji, ring, className }: { name: string; tone?: keyof typeof HUES; size?: 'sm' | 'md' | 'lg'; emoji?: boolean; ring?: boolean; className?: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const dims = { sm: 'h-7 w-7 text-[11px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm' };
  return (
    <span
      className={cn(
        'inline-grid place-items-center rounded-full bg-gradient-to-br text-white font-bold shrink-0',
        HUES[tone],
        dims[size],
        ring && 'ring-2 ring-white shadow-soft',
        className
      )}
      aria-hidden={emoji ? true : undefined}
      aria-label={emoji ? undefined : name}
    >
      {emoji ? name : initials}
    </span>
  );
}