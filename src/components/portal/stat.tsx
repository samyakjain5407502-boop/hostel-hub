import * as React from 'react';
import { cn } from '@/lib/utils';

const TONES = {
  brand: 'bg-brand-50 text-brand-600',
  success: 'bg-success-50 text-success-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  violet: 'bg-violet-50 text-violet-600',
  sky: 'bg-sky-50 text-sky-600'
};

export function StatTile({ icon, label, value, sub, tone = 'brand', className, href }: {
  icon: React.ReactNode; label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode;
  tone?: keyof typeof TONES; className?: string; href?: string;
}) {
  const Wrapper = href ? 'a' : 'div';
  return (
    <Wrapper
      href={href}
      className={cn(
        'lift group flex flex-col gap-1.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-lift hover:border-brand-300',
        className
      )}
    >
      <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
        <span className={cn('grid h-8 w-8 place-items-center rounded-xl transition group-hover:scale-105', TONES[tone])}>{icon}</span>
        {label}
      </span>
      <p className="text-xl font-extrabold tracking-tight text-slate-900">{value}</p>
      {sub && <p className="text-[11px] font-medium text-slate-500">{sub}</p>}
    </Wrapper>
  );
}