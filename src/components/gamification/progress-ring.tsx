'use client';

/**
 * Progress ring — the gamification workhorse.
 * ─────────────────────────────────────────────────────────────
 * An animated SVG donut used for Eco score, Discipline score, quest
 * completion and streak progress. Animates on mount with a spring, keeps the
 * final value in the DOM (so screenshots/print match the UI) and exposes
 * proper `role="progressbar"` semantics for screen readers.
 */

import { motion, useReducedMotion } from 'framer-motion';
import * as React from 'react';
import { cn } from '@/lib/utils';

export type RingTone = 'brand' | 'success' | 'amber' | 'violet' | 'rose' | 'sky';

const STROKE: Record<RingTone, string> = {
  brand: 'url(#hi-ring-brand)',
  success: 'url(#hi-ring-success)',
  amber: 'url(#hi-ring-amber)',
  violet: 'url(#hi-ring-violet)',
  rose: 'url(#hi-ring-rose)',
  sky: 'url(#hi-ring-sky)'
};

const FUEL: Record<RingTone, [string, string]> = {
  brand: ['#6366f1', '#8b5cf6'],
  success: ['#10b981', '#22c55e'],
  amber: ['#f59e0b', '#f97316'],
  violet: ['#8b5cf6', '#ec4899'],
  rose: ['#f43f5e', '#f97316'],
  sky: ['#0ea5e9', '#22d3ee']
};

export interface ProgressRingProps {
  /** Current value (0…`max`). */
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  tone?: RingTone;
  /** Small caption under the value. */
  label?: React.ReactNode;
  /** Overrides the auto-rendered centre; wins over `value`/`label`. */
  children?: React.ReactNode;
  className?: string;
  /** Accessible name for the ring. */
  ariaLabel?: string;
}

export function ProgressRing({
  value,
  max = 100,
  size = 108,
  thickness = 9,
  tone = 'brand',
  label,
  children,
  className,
  ariaLabel
}: ProgressRingProps) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;
  const gradientId = React.useId();

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative grid place-items-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={ariaLabel}
          className="-rotate-90"
        >
          <defs>
            <linearGradient id={`${gradientId}-g`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={FUEL[tone][0]} />
              <stop offset="100%" stopColor={FUEL[tone][1]} />
            </linearGradient>
          </defs>
          <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={thickness} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#${gradientId}-g)`}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            initial={reduce ? false : { strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${dash} ${circumference - dash}` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>

        <div className="absolute inset-0 grid place-content-center text-center">
          {children ?? (
            <>
              <p className="text-xl font-black tabular-nums leading-none text-slate-900">{Math.round(pct)}%</p>
              {label && <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>}
            </>
          )}
        </div>
      </div>
      {children && label && (
        <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      )}
    </div>
  );
}

/** Horizontal XP bar with an animated fill — pairs with the rings. */
export function XpBar({ value, max = 100, tone = 'brand', className }: {
  value: number; max?: number; tone?: RingTone; className?: string;
}) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-200/70', className)}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${FUEL[tone][0]}, ${FUEL[tone][1]})` }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

export { FUEL as RING_FUEL, STROKE as RING_STROKE };
