'use client';

import { motion } from 'framer-motion';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import * as React from 'react';
import { LogoMark } from '@/components/brand';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme/toggle';
import { Footer } from '@/components/footer';
import { cn } from '@/lib/utils';
import { useLang } from '@/i18n';

export interface AuthConfig {
  role: 'student' | 'operator' | 'management' | 'admin';
  title: string;
  sub: string;
  accentRing: string;
  icon: React.ReactNode;
}

export function AuthShell({ config, children }: { config: AuthConfig; children: React.ReactNode }) {
  return (
    <div className="mesh-bg min-h-dvh w-full max-w-full overflow-x-clip">
      <div className="glass-header sticky top-0 z-40 flex w-full max-w-full items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-5">
        <a href="/" className="flex min-w-0 items-center gap-2">
          <LogoMark />
          <span className="truncate font-display text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">Hostel<span className="text-brand-600">Hub</span></span>
        </a>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>

      <div id="main" className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 pb-16 pt-6 sm:px-5 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="order-2 w-full min-w-0 max-w-full lg:order-1"
        >
          {children}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="order-1 hidden lg:order-2 lg:flex lg:flex-col"
        >
          <div className={cn('glow-brand mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br text-white', config.accentRing)}>
            {config.icon}
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">{config.title}</h1>
          <p className="mt-2 text-slate-600">{config.sub}</p>

          <ul className="mt-8 space-y-3.5 text-sm font-medium text-slate-700">
            {PORTAL_HIGHLIGHTS[config.role].map((x, i) => (
              <li key={x} className="lift flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 shadow-lift">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{i + 1}</span>
                {x}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

/** Per-portal "what you get" list on the auth hero panel. */
const PORTAL_HIGHLIGHTS: Record<AuthConfig['role'], string[]> = {
  student: ['Mess plate customisation', 'Rewards & scratch cards', 'Fee ledger and gate pass QR', 'Live complaint tracking'],
  operator: ['Live opted-in headcount', 'Meal slot Active / Closed switch', 'Ingredient calculator per head', 'QR plate verification'],
  management: ['Application verification queue', 'Walk-in admission desk', 'Room & bed inventory matrix', 'Fee invoice generation'],
  admin: ['Multi-property branch setup', 'Occupancy & wastage BI', 'Global reward engine', 'System diagnostic logs']
};

export function Spin({ className }: { className?: string }) {
  return <LoaderCircle className={cn('h-5 w-5 animate-spin', className)} aria-hidden="true" />;
}
export { ArrowRight };
