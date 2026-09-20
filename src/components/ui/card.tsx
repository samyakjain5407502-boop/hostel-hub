import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Surface primitive.
 * ─────────────────────────────────────────────────────────────
 * Themed with the semantic tokens (`--card`, `--border`, `--fg`) instead of
 * hard-coded dark values, so it renders as a premium white card in light mode
 * and a deep glass panel in dark mode from the exact same markup.
 */
export function Card({
  className,
  padded = true,
  glass = false,
  tone = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
  /** Frosted surface — reads as glass over the mesh background. */
  glass?: boolean;
  /** `glow` adds a brand halo, `reward` the gold/indigo gamification wash. */
  tone?: 'default' | 'glow' | 'reward';
}) {
  return (
    <div
      className={cn(
        'w-full max-w-full overflow-hidden rounded-2xl border shadow-lift',
        glass ? 'border-slate-200 bg-white/95 shadow-soft backdrop-blur-sm' : 'border-slate-200 bg-white',
        tone === 'glow' && 'glow-brand border-brand-200',
        tone === 'reward' && 'reward-surface',
        padded && 'px-4 py-4',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  sub,
  icon,
  action,
  className,
  tone = 'brand'
}: {
  title?: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  tone?: 'brand' | 'success' | 'amber' | 'violet' | 'rose' | 'sky';
}) {
  const ICON_TONE = {
    brand: 'bg-brand-50 text-brand-600',
    success: 'bg-success-50 text-success-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-600',
    sky: 'bg-sky-50 text-sky-600'
  }[tone];

  return (
    <div className={cn('flex min-w-0 flex-wrap items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', ICON_TONE)}>{icon}</span>
        )}
        <div className="min-w-0">
          <h2 className="break-anywhere text-base font-bold tracking-tight text-slate-900">{title}</h2>
          {sub && <p className="break-anywhere mt-0.5 text-xs font-medium text-slate-600">{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
