'use client';

import { LanguageProvider } from '@/i18n';
import { DbProvider } from '@/lib/store';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from '@/components/theme/provider';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import type { ReactNode } from 'react';

/**
 * Wraps the whole app in theme + i18n + demo-data + toast contexts.
 * The PWA install banner sits innermost so it can translate itself (`useLang`)
 * and stay clear of the toast stack.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <DbProvider>
          <ToastProvider>
            {children}
            <PwaInstallPrompt />
          </ToastProvider>
        </DbProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
