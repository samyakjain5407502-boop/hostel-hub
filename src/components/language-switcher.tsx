'use client';

import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import { Languages } from 'lucide-react';
import * as React from 'react';
import { useLang } from '@/i18n';
import type { Lang } from '@/i18n';
import { cn } from '@/lib/utils';

const OPTIONS: { code: Lang; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'hinglish', label: 'Hinglish', flag: '🪁' }
];

/** Dropdown language switcher for the nav bar — instant, no page reload. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, t } = useLang();
  const current = OPTIONS.find((o) => o.code === lang)!;

  return (
    <RadixDropdown.Root>
      <RadixDropdown.Trigger
        className={cn('inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 shadow-lift hover:border-brand-300 hover:bg-brand-50 sm:px-3', className)}
        aria-label={t('a11y.changeLanguage')}
      >
        <Languages className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        {/* Compact on phones (flag only) so the header never overflows. */}
        <span className="hidden min-w-[64px] text-left sm:inline">{current.flag} {current.label}</span>
        <span className="sm:hidden" aria-hidden="true">{current.flag}</span>
      </RadixDropdown.Trigger>
      <RadixDropdown.Portal>
        <RadixDropdown.Content
          sideOffset={8}
          align="end"
          className="z-[60] w-44 max-w-[calc(100vw-1rem)] rounded-xl border border-slate-200 bg-white p-1.5 shadow-soft"
        >
          <RadixDropdown.Label className="px-2.5 py-1 text-[11px] font-semibold uppercase text-slate-400">Language</RadixDropdown.Label>
          {OPTIONS.map((o) => (
            <RadixDropdown.Item
              key={o.code}
              onSelect={() => setLang(o.code)}
              className={cn(
                'flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-brand-50',
                o.code === lang && 'font-semibold text-brand-700'
              )}
            >
              <span className="mr-1.5 w-4 text-center">{o.flag}</span>
              {o.label}
              {o.code === lang && <span className="ml-auto text-brand-600">✓</span>}
            </RadixDropdown.Item>
          ))}
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    </RadixDropdown.Root>
  );
}