'use client';

import { motion } from 'framer-motion';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import * as React from 'react';
import { LogoMark } from '@/components/brand';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Footer } from '@/components/footer';
import { cn } from '@/lib/utils';
import { useLang } from '@/i18n';

export interface AuthConfig {
  role: 'student' | 'admin';
  title: string;
  sub: string;
  accentRing: string;
  icon: React.ReactNode;
}

export function AuthShell({ config, children }: { config: AuthConfig; children: React.ReactNode }) {
  return (
    <div className="mesh-bg min-h-dvh">
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 glass-header px-5 py-3">
        <a href="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="font-display text-lg font-extrabold tracking-tight text-slate-900">Hostel<span className="text-brand-600">Hub</span></span>
        </a>
        <LanguageSwitcher />
      </div>

      <div id="main" className="mx-auto grid max-w-5xl items-center gap-10 px-5 pb-16 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="order-2 lg:order-1"
        >
          {children}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="order-1 hidden lg:order-2 lg:flex lg:flex-col"
        >
          <div className={cn('mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br text-white shadow-soft', config.accentRing)}>
            {config.icon}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">{config.title}</h1>
          <p className="mt-2 text-slate-500">{config.sub}</p>

          <ul className="mt-8 space-y-4 text-sm text-slate-600">
            {['Mess planning & credits', 'Rewards & gift boxes', 'Live complaint tracking', 'Meal quality rating'].map((x, i) => (
              <li key={x} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-3.5 py-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{i + 1}</span>
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

export function Spin({ className }: { className?: string }) {
  return <LoaderCircle className={cn('h-5 w-5 animate-spin', className)} aria-hidden="true" />;
}
export { ArrowRight };