import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, padded = true, glass = true, ...props }: React.HTMLAttributes<HTMLDivElement> & { padded?: boolean; glass?: boolean }) {
  return (
    <div
      className={cn(
        'w-full max-w-full rounded-2xl border overflow-hidden shadow-lift',
        glass
          ? 'bg-slate-900/60 border-white/10 shadow-soft backdrop-blur-sm'
          : 'bg-slate-900 border-white/10',
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
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          {icon && (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-400">{icon}</span>
          )}
          <div className="min-w-0">
            <h2 className="break-anywhere text-base font-semibold text-white">{title}</h2>
            {sub && <p className="break-anywhere text-xs text-fg-muted">{sub}</p>}
          </div>
        </div>
      </div>
      {action}
    </div>
  );
}