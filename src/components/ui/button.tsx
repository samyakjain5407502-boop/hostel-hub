'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'success' | 'outline' | 'ghost' | 'danger' | 'glass' | 'dark' | 'warden';
export type ButtonSize = 'xs' | 'sm' | 'default' | 'lg' | 'icon';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-soft hover:bg-brand-700',
  success: 'bg-success-600 text-white shadow-soft hover:bg-success-700',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:border-brand-300 hover:bg-slate-50 hover:text-brand-700',
  ghost: 'text-brand-700 hover:bg-brand-50',
  danger: 'bg-rose-600 text-white shadow-soft hover:bg-rose-700',
  glass: 'border border-brand-200 bg-white/70 text-brand-800 backdrop-blur hover:bg-brand-50',
  dark: 'bg-slate-900 text-white hover:bg-slate-800',
  warden: 'bg-gradient-to-br from-brand-600 to-violet-600 text-white shadow-soft hover:opacity-90'
};

const SIZES: Record<ButtonSize, string> = {
  xs: 'h-7 rounded-lg px-2.5 text-xs',
  sm: 'h-9 px-3 text-xs',
  default: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
  icon: 'h-10 w-10'
};

const BASE =
  'inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 active:scale-[.98] disabled:pointer-events-none disabled:opacity-45';

/** Shared class recipe so `<Link>`s can look identical to `<Button>`s. */
export function buttonStyles({ variant = 'primary', size = 'default', className }: {
  variant?: ButtonVariant; size?: ButtonSize; className?: string;
} = {}) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the full width of the parent (mobile-friendly primary actions). */
  block?: boolean;
  /** Render the Button as a child element (for Link usage) without changing the API shape. */
  asChild?: boolean;
}

export function Button({ className, variant = 'primary', size = 'default', block, asChild, type = 'button', children, ...props }: ButtonProps) {
  const classes = buttonStyles({ variant, size, className: cn(block && 'w-full', className) });

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(classes, (children.props as { className?: string }).className)
    });
  }

  return <button type={type} className={classes} {...props}>{children}</button>;
}

/** Spinner shown inside a button while an async action is in flight. */
export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn('h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent', className)}
    />
  );
}