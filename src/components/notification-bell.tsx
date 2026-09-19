'use client';

import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import { BellRing, CheckCheck, CheckCircle2, Gift, Info, AlertTriangle } from 'lucide-react';
import * as React from 'react';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { cn, timeAgo } from '@/lib/utils';

const TONE_ICON = { info: Info, success: CheckCircle2, warning: AlertTriangle, reward: Gift };

const TONE_TEXT = {
  info: 'text-brand-500',
  success: 'text-success-500',
  warning: 'text-amber-500',
  reward: 'text-violet-500'
} as const;

export function NotificationBell({ className }: { className?: string }) {
  const db = useDb();
  const { t, tr, lang } = useLang();
  const unread = db.notifications.filter((n) => !n.read).length;
  const items = db.notifications.slice(0, 8);

  return (
    <RadixDropdown.Root>
      <RadixDropdown.Trigger
        className={cn(
          'relative inline-grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-lift hover:border-brand-300',
          className
        )}
        aria-label={t('notify.aria', { n: unread })}
      >
        <BellRing className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="pointer-events-none absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </RadixDropdown.Trigger>

      <RadixDropdown.Portal>
        <RadixDropdown.Content
          sideOffset={8}
          align="end"
          className="z-[60] w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-soft"
        >
          <div className="flex items-center justify-between px-1.5">
            <p className="text-sm font-semibold text-slate-800">{t('notify.title')}</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => db.markRead()}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline"
              >
                <CheckCheck className="h-3 w-3" aria-hidden="true" />
                {t('notify.markAll')}
              </button>
            )}
          </div>

          <div className="mt-1 max-h-72 divide-y overflow-auto">
            {items.length === 0 && <p className="px-2 py-6 text-center text-xs text-slate-400">{t('notify.empty')}</p>}
            {items.map((n) => {
              const Icon = TONE_ICON[n.tone];
              return (
                <RadixDropdown.Item
                  key={n.id}
                  disabled
                  className="px-2 py-2.5 outline-none"
                  // Long-press/selection stays available for copy on desktop.
                  title={tr(n.title, n.meta)}
                >
                  <div className="flex items-start gap-2.5" lang={lang === 'hi' ? 'hi' : undefined}>
                    <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', TONE_TEXT[n.tone])} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className={cn('block text-[13px] font-semibold', n.read ? 'text-slate-500' : 'text-slate-800')}>
                        {tr(n.title, n.meta)}
                      </span>
                      <span className="block text-xs text-slate-400">{tr(n.body, n.meta)}</span>
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(n.at)}</span>
                  </div>
                </RadixDropdown.Item>
              );
            })}
          </div>
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    </RadixDropdown.Root>
  );
}