'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './provider';
import { cn } from '@/lib/utils';
import { useLang } from '@/i18n';

/** Sun/Moon pill used in every navbar — flips the `.dark` class on <html>. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const { t } = useLang();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={t('theme.toggle')}
      title={t('theme.toggle')}
      className={cn(
        'inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium shadow-lift transition',
        'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50',
        'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-brand-500 dark:hover:bg-slate-800',
        className
      )}
    >
      {dark ? <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" /> : <Moon className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      <span className="hidden sm:inline">{dark ? t('theme.light') : t('theme.dark')}</span>
    </button>
  );
}
