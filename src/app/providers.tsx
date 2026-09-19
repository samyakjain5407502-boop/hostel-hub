'use client';

import { LanguageProvider } from '@/i18n';
import { DbProvider } from '@/lib/store';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from '@/components/theme/provider';
import type { ReactNode } from 'react';

/** Wraps the whole app in theme + i18n + demo-data + toast contexts. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <DbProvider>
          <ToastProvider>{children}</ToastProvider>
        </DbProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
