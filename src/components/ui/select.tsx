'use client';

import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Select = RadixSelect.Root;
export const SelectTrigger = RadixSelect.Trigger;

export function SelectContent({ children, className, align = 'center', sideOffset = 6 }: {
  children: React.ReactNode; className?: string; align?: 'start' | 'center' | 'end'; sideOffset?: number;
}) {
  return (
    <RadixSelect.Portal>
      <RadixSelect.Content className={cn('z-[70] min-w-[var(--radix-select-trigger-width)] rounded-xl border border-slate-200 bg-white p-1.5 shadow-soft', className)} align={align} sideOffset={sideOffset}>
        <RadixSelect.Viewport>
          {children}
        </RadixSelect.Viewport>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  );
}

export function SelectItem({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  return (
    <RadixSelect.Item value={value} className={cn('flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 outline-none data-[highlighted]:bg-brand-50 data-[highlighted]:text-brand-800', className)}>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator className="ml-auto">
        <Check className="h-4 w-4 text-brand-600" aria-hidden="true" />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  );
}

export function SelectIcon({ className }: { className?: string }) {
  return <ChevronDown className={cn('h-4 w-4 text-slate-500', className)} aria-hidden="true" />;
}

