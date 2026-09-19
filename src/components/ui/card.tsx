import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, padded = true, ...props }: React.HTMLAttributes<HTMLDivElement> & { padded?: boolean }) {
  return (
    <div
      className={cn(
        'w-full max-w-full rounded-2xl border border-slate-200 bg-white shadow-lift overflow-hidden',
        padded && 'px-4 py-4',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ title, sub, icon, action, className }: { title?: React.ReactNode; sub?: React.ReactNode; icon?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-wrap items-center justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
        )}
        <div className="min-w-0">
          <h2 className="break-anywhere text-base font-semibold text-slate-900">{title}</h2>
          {sub && <p className="break-anywhere text-xs text-slate-500">{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}