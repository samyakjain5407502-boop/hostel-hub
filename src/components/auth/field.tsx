'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function Field({ label, hint, icon, children, className }: {
  label: React.ReactNode; hint?: string; icon?: LucideIcon; children: React.ReactNode; className?: string;
}) {
  const Icon = icon;
  return (
    <label className={cn('block', className)}>
      <span className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
        {Icon && <Icon className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />}
        {label}
      </span>
      {children}
      {hint && <span className="mt-0.5 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}