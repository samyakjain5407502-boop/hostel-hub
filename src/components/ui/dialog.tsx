'use client';

import * as DialogR from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Dialog = DialogR.Root;
export const DialogTrigger = DialogR.Trigger;
export const DialogClose = DialogR.Close;
export const DialogTitle = DialogR.Title;
export const DialogDescription = DialogR.Description;

export function DialogContent({ className, children, maxW = 'max-w-lg', descId }: {
  className?: string; children: React.ReactNode; maxW?: string; descId?: string;
}) {
  return (
    <DialogR.Portal>
      <DialogR.Overlay className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm data-[state=open]:animate-fade-in" />
      <DialogR.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-[90] max-h-[88vh] w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-soft',
          maxW,
          className
        )}
        aria-describedby={descId}
      >
        {children}
        <DialogR.Close
          className="absolute right-3.5 top-3.5 grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </DialogR.Close>
      </DialogR.Content>
    </DialogR.Portal>
  );
}

/** Shared body wrapper so every dialog keeps identical padding rhythm. */
export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-5 pt-2', className)} {...props} />;
}

/** Header block used inside dialogs that need a visible title + helper text. */
export function DialogHeader({ title, desc, icon }: { title: string; desc?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
      {icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>}
      <div className="min-w-0">
        <DialogR.Title className="text-base font-bold text-slate-900">{title}</DialogR.Title>
        {desc && <DialogR.Description className="mt-0.5 text-xs text-slate-500">{desc}</DialogR.Description>}
      </div>
    </div>
  );
}